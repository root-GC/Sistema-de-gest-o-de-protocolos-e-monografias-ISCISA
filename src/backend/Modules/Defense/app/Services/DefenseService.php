<?php
// Modules/Defense/app/Services/DefenseService.php

namespace Modules\Defense\app\Services;

use App\Services\DocumentTraceService;
use App\Services\WorkflowTransitionService;
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
    public function assignJury(Defense $d, array $members, ?User $actor = null): Defense
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

        $oldStatus = $d->status->value;
        $d->update(['status' => DefenseStatus::JuriDefinido]);
        $this->recordTransition($d, $actor, 'jury_assigned', $oldStatus, $d->status->value, 'Júri da defesa definido.');

        return $d->fresh('jury');
    }

    /**
     * Coordenador propõe (ou repropõe) data/local. Abre uma nova ronda
     * de confirmação — só o(s) arguente(s) têm poder de aceitar/recusar.
     */
    public function proposeSchedule(Defense $d, int $coordinatorId, string $proposedAt, string $location, ?User $actor = null): Defense
    {
        $this->assertStatus($d, [DefenseStatus::JuriDefinido, DefenseStatus::DataProposta]);
        abort_if($d->jury()->count() < 3, 422, 'Júri incompleto.');
        abort_if($d->jury()->where('jury_role', 'arguente')->doesntExist(), 422, 'Júri sem arguente definido.');

        return DB::transaction(function () use ($d, $coordinatorId, $proposedAt, $location) {
            $oldStatus = $d->status->value;
            $d->update([
                'coordinator_id' => $coordinatorId,
                'scheduled_at'   => $proposedAt,
                'location'       => $location,
                'status'         => DefenseStatus::DataProposta,
            ]);

            $this->recordTransition($d, $actor, 'schedule_proposed', $oldStatus, $d->status->value, 'Data de defesa proposta.', [
                'scheduled_at' => $proposedAt,
                'location' => $location,
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
        ?string $note = null,
        ?User $actor = null,
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
            $this->recordTransition($d, $actor, 'schedule_rejected', $d->status->value, $d->status->value, 'Data de defesa recusada pelo arguente.', [
                'alternative_datetime' => $alternativeDateTime,
                'note' => $note,
            ]);
            DefenseDateRejected::dispatch($d, $juryMember, $alternativeDateTime, $note);
            return $d->fresh();
        }

        $oldStatus = $d->status->value;
        $d->update(['status' => DefenseStatus::DefesaAgendada]);
        $this->recordTransition($d, $actor, 'schedule_confirmed', $oldStatus, $d->status->value, 'Data de defesa confirmada.');
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
    public function recordGrade(Defense $d, float $grade, bool $requiresCorrections, ?string $notes = null, ?User $actor = null): Defense
    {
        $this->assertStatus($d, DefenseStatus::DefesaAgendada);
        abort_if($requiresCorrections && blank($notes), 422, 'Indique as correcções exigidas.');

        $oldStatus = $d->status->value;
        $d->update([
            'final_grade'          => $grade,
            'requires_corrections' => $requiresCorrections,
            'corrections_notes'    => $notes,
            'status'               => DefenseStatus::Defendida,
        ]);
        $this->recordTransition($d, $actor, 'grade_recorded', $oldStatus, $d->status->value, 'Resultado da defesa registado.', [
            'grade' => $grade,
            'requires_corrections' => $requiresCorrections,
        ]);

        DefenseGraded::dispatch($d);

        return $d->fresh();
    }

    public function uploadMinutes(Defense $d, UploadedFile $file, ?User $actor = null): Defense
    {
        $this->assertStatus($d, DefenseStatus::Defendida);

        $path = $file->store('defenses/' . $d->id);

        $nextStatus = $d->requires_corrections
            ? DefenseStatus::AguardaCorrecoesFinais
            : DefenseStatus::Encerrada;

        $oldStatus = $d->status->value;
        $d->update([
            'minutes_file_path' => $path,
            'status'            => $nextStatus,
        ]);

        $revision = app(DocumentTraceService::class)->capture(
            $d,
            'defense_minutes',
            $d->id,
            $file->getClientOriginalName(),
            $path,
            null,
            'minutes',
            $actor,
        );
        $this->recordTransition($d, $actor, 'minutes_uploaded', $oldStatus, $d->status->value, 'Ata da defesa submetida.', [], $revision);

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

            $document = $d->finalDocuments()->latest('id')->firstOrFail();
            $oldStatus = $d->status->value;
            $d->update(['status' => DefenseStatus::CorrecoesSubmetidas]);
            $revision = app(DocumentTraceService::class)->capture(
                $d,
                'defense_final_documents',
                $document->id,
                $document->file_name,
                $document->file_path,
                $nextVersion,
                'final_document',
                $student,
            );
            $this->recordTransition($d, $student, 'final_document_submitted', $oldStatus, $d->status->value, 'Versão final da defesa submetida.', [], $revision);

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

        $oldStatus = $d->status->value;
        $d->update([
            'status' => $approved ? DefenseStatus::Encerrada : DefenseStatus::AguardaCorrecoesFinais,
        ]);

        $this->recordTransition($d, $coordinator, $approved ? 'final_document_approved' : 'final_document_returned', $oldStatus, $d->status->value, $approved ? 'Documento final aprovado.' : 'Documento final devolvido.', [
            'document_id' => $document->id,
            'notes' => $notes,
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

    private function recordTransition(
        Defense $defense,
        ?User $actor,
        string $action,
        string $fromState,
        string $toState,
        string $description,
        array $metadata = [],
        ?\App\Models\DocumentRevision $revision = null,
    ): void {
        $workflow = app(WorkflowTransitionService::class);
        $workflow->assertAllowed('defense', $fromState, $toState);
        $workflow->record($defense, 'defense', $action, $actor, null, $fromState, $toState, $description, $metadata, $revision);
    }
}
