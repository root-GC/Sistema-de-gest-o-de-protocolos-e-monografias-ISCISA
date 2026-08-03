<?php
// Modules/Defense/app/Services/DefenseService.php

namespace Modules\Defense\app\Services;

use Modules\Defense\app\Models\{Defense, DefenseJuryAvailability, DefenseFinalDocument};
use Modules\Defense\app\Enums\DefenseStatus;
use Modules\Defense\app\Events\{
    DefenseDateProposed, DefenseDateRejected, DefenseScheduled,
    DefenseGraded, DefenseClosed
};
use Modules\User\app\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class DefenseService
{
    public function assignJury(Defense $d, array $members): Defense
    {
        $this->assertStatus($d, DefenseStatus::AguardaJuri);
        abort_if(count($members) < 3, 422, 'Júri requer no mínimo 3 membros.');

        foreach ($members as $member) {
            abort_if(
                $member['teacher_id'] === $d->monograph->supervisor_id,
                422,
                'O supervisor não pode integrar o júri.'
            );

            $d->jury()->create([
                'teacher_id' => $member['teacher_id'],
                'jury_role'  => $member['jury_role'],
            ]);
        }

        $d->update(['status' => DefenseStatus::JuriDefinido]);

        return $d->fresh('jury');
    }

    /**
     * Coordenador propõe (ou repropõe) data/local. Abre uma nova ronda
     * de confirmação — só o(s) arguente(s) têm poder de aceitar/recusar.
     */
    public function proposeSchedule(Defense $d, int $coordinatorId, string $proposedAt, string $location): Defense
    {
        $this->assertStatus($d, [DefenseStatus::JuriDefinido, DefenseStatus::DataProposta]);
        abort_if($d->jury()->count() < 3, 422, 'Júri incompleto.');
        abort_if($d->jury()->where('jury_role', 'arguente')->doesntExist(), 422, 'Júri sem arguente definido.');

        return DB::transaction(function () use ($d, $coordinatorId, $proposedAt, $location) {
            $d->update([
                'coordinator_id' => $coordinatorId,
                'scheduled_at'   => $proposedAt,
                'location'       => $location,
                'status'         => DefenseStatus::DataProposta,
            ]);

            foreach ($d->jury as $member) {
                DefenseJuryAvailability::create([
                    'defense_jury_id' => $member->id,
                    'proposed_at'     => $proposedAt,
                    'response'        => 'pendente',
                ]);
            }

            DefenseDateProposed::dispatch($d->fresh());

            return $d->fresh();
        });
    }

    /**
     * Só um membro com jury_role='arguente' pode confirmar ou recusar.
     * Um único arguente a aceitar já avança a defesa para 'defesa_agendada'.
     */
    public function respondToSchedule(
        Defense $d,
        int $teacherId,
        bool $accepted,
        ?string $alternativeDateTime = null,
        ?string $note = null
    ): Defense {
        $this->assertStatus($d, DefenseStatus::DataProposta);

        $juryMember = $d->jury()->where('teacher_id', $teacherId)->firstOrFail();

        abort_unless(
            $juryMember->jury_role === 'arguente',
            403,
            'Só o arguente pode confirmar ou recusar a data proposta.'
        );

        abort_if(!$accepted && blank($alternativeDateTime) && blank($note), 422,
            'Indique uma data alternativa ou motivo da recusa.');

        $availability = $juryMember->availabilityResponses()
            ->where('proposed_at', $d->scheduled_at)
            ->where('response', 'pendente')
            ->firstOrFail();

        $availability->update([
            'response'             => $accepted ? 'aceite' : 'recusado',
            'alternative_datetime' => $alternativeDateTime,
            'note'                 => $note,
            'responded_at'         => now(),
        ]);

        if (!$accepted) {
            DefenseDateRejected::dispatch($d, $juryMember, $alternativeDateTime, $note);
            return $d->fresh();
        }

        $d->update(['status' => DefenseStatus::DefesaAgendada]);
        DefenseScheduled::dispatch($d->fresh());

        return $d->fresh();
    }

    public function scheduleResponses(Defense $d): Collection
    {
        return $d->jury()
            ->with(['teacher.user', 'availabilityResponses' => function ($q) use ($d) {
                $q->where('proposed_at', $d->scheduled_at);
            }])
            ->get()
            ->map(fn ($member) => [
                'teacher'     => $member->teacher->user->name,
                'jury_role'   => $member->jury_role,
                'response'    => $member->availabilityResponses->first()?->response ?? 'pendente',
                'alternative' => $member->availabilityResponses->first()?->alternative_datetime,
                'note'        => $member->availabilityResponses->first()?->note,
            ]);
    }

    /**
     * Regista o resultado da defesa. $requiresCorrections indica se o
     * júri exige uma versão final corrigida antes de o processo encerrar.
     */
    public function recordGrade(Defense $d, float $grade, bool $requiresCorrections, ?string $notes = null): Defense
    {
        $this->assertStatus($d, DefenseStatus::DefesaAgendada);
        abort_if($requiresCorrections && blank($notes), 422, 'Indique as correcções exigidas.');

        $d->update([
            'final_grade'          => $grade,
            'requires_corrections' => $requiresCorrections,
            'corrections_notes'    => $notes,
            'status'               => DefenseStatus::Defendida,
        ]);

        DefenseGraded::dispatch($d);

        return $d->fresh();
    }

    public function uploadMinutes(Defense $d, UploadedFile $file): Defense
    {
        $this->assertStatus($d, DefenseStatus::Defendida);

        $path = $file->store('defenses/' . $d->id);

        $nextStatus = $d->requires_corrections
            ? DefenseStatus::AguardaCorrecoesFinais
            : DefenseStatus::Encerrada;

        $d->update([
            'minutes_file_path' => $path,
            'status'            => $nextStatus,
        ]);

        if ($nextStatus === DefenseStatus::Encerrada) {
            DefenseClosed::dispatch($d);
        }

        return $d->fresh();
    }

    /**
     * Estudante submete a versão final corrigida, exigida pelo júri.
     */
    public function submitFinalDocument(Defense $d, User $student, UploadedFile $file): Defense
    {
        $this->assertStatus($d, [DefenseStatus::AguardaCorrecoesFinais, DefenseStatus::CorrecoesSubmetidas]);
        abort_unless($d->monograph->student_id === $student->id, 403);

        return DB::transaction(function () use ($d, $student, $file) {
            $nextVersion = ($d->finalDocuments()->max('version') ?? 0) + 1;

            $filename = sprintf('final_v%d_%s.%s', $nextVersion, now()->format('Ymd_His'), $file->getClientOriginalExtension());
            $path = $file->storeAs('defenses/' . $d->id . '/final', $filename);

            DefenseFinalDocument::create([
                'defense_id'   => $d->id,
                'submitted_by' => $student->id,
                'file_name'    => $file->getClientOriginalName(),
                'file_path'    => $path,
                'version'      => $nextVersion,
                'status'       => 'pendente',
            ]);

            $d->update(['status' => DefenseStatus::CorrecoesSubmetidas]);

            return $d->fresh();
        });
    }

    /**
     * Coordenador valida a versão final. Aprovado → encerra o processo.
     * Rejeitado → devolve para o estudante submeter de novo.
     */
    public function validateFinalDocument(Defense $d, User $coordinator, bool $approved, ?string $notes = null): Defense
    {
        $this->assertStatus($d, DefenseStatus::CorrecoesSubmetidas);
        abort_if(!$approved && blank($notes), 422, 'Indique o motivo da devolução.');

        $document = $d->latestFinalDocument();
        abort_if(!$document, 404, 'Nenhum documento final encontrado.');

        $document->update([
            'status'           => $approved ? 'aprovado' : 'rejeitado',
            'validated_by'     => $coordinator->id,
            'validation_notes' => $notes,
            'validated_at'     => now(),
        ]);

        $d->update([
            'status' => $approved ? DefenseStatus::Encerrada : DefenseStatus::AguardaCorrecoesFinais,
        ]);

        if ($approved) {
            DefenseClosed::dispatch($d);
        }

        return $d->fresh();
    }

    private function assertStatus(Defense $d, DefenseStatus|array $expected): void
    {
        $expected = is_array($expected) ? $expected : [$expected];

        abort_unless(in_array($d->status, $expected, true), 409,
            "Transição inválida: estado actual é '{$d->status->value}'.");
    }
}