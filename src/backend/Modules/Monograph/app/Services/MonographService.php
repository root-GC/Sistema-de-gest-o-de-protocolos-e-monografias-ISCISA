<?php

namespace Modules\Monograph\app\Services;

use App\Services\DocumentTraceService;
use App\Services\WorkflowTransitionService;
use Modules\Monograph\app\Models\Monograph;
use Modules\Monograph\app\Enums\MonographStatus;
use Modules\Monograph\app\Events\{MonographForwardedToOrgan, MonographReturned, MonographVerified};
use App\Models\MonographDocument;
use Modules\User\app\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Modules\Monograph\app\Models\MonographComment;

class MonographService
{
    public function submit(Monograph $m, User $student, UploadedFile $file): Monograph
    {
        $this->assertStatus($m, [MonographStatus::AguardaSubmissao, MonographStatus::Devolvida]);
        abort_unless($m->student_id === $student->id, 403);

        return DB::transaction(function () use ($m, $student, $file) {
            $oldStatus = $m->status->value;
            $nextVersion = ($m->submissions()->max('version') ?? 0) + 1;

            $document = MonographDocument::create([
                'monograph_id'  => $m->id,
                'submitted_by'  => $student->id,
                'document_type' => 'monografia_final',
                'file_name'     => $file->getClientOriginalName(),
                'file_path'     => $file->store('monographs/' . $m->id),
                'version'       => $nextVersion,
                'status'        => 'pendente',
            ]);

            $m->submissions()->create([
                'monograph_document_id' => $document->id,
                'version'               => $nextVersion,
                'submitted_at'          => now(),
            ]);

            $m->update(['status' => MonographStatus::Submetida, 'submitted_at' => now()]);

            $revision = app(DocumentTraceService::class)->capture(
                $m,
                'monograph_documents',
                $document->id,
                $document->file_name,
                $document->file_path,
                $nextVersion,
                $document->document_type,
                $student,
            );

            $this->recordTransition($m, $student, 'submitted', $oldStatus, MonographStatus::Submetida->value, 'Monografia submetida pelo estudante.', $revision);

            return $m->fresh();
        });
    }

    public function endorse(Monograph $m, User $supervisor, bool $approved, ?string $reason = null): Monograph
    {
        $this->assertStatus($m, MonographStatus::Submetida);
        abort_unless($m->supervisor_id === $supervisor->teacherProfile->id, 403);
        $oldStatus = $m->status->value;

        $this->recordDecision($m, 'supervisor', $supervisor, $approved, $reason);

        $m->update([
            'status' => $approved ? MonographStatus::VerificacaoDocumental : MonographStatus::Devolvida,
            'supervisor_endorsed_at' => $approved ? now() : null,
        ]);

        $this->recordTransition(
            $m,
            $supervisor,
            $approved ? 'supervisor_endorsed' : 'supervisor_returned',
            $oldStatus,
            $m->status->value,
            $approved ? 'Monografia autorizada pelo supervisor.' : 'Monografia devolvida pelo supervisor.',
        );

        $approved
            ? MonographForwardedToOrgan::dispatch($m)
            : MonographReturned::dispatch($m, 'supervisor', $reason);

        return $m->fresh();
    }

    public function verifyDocuments(Monograph $m, User $reviewer, string $role, bool $approved, ?string $reason = null): Monograph
    {
        $this->assertStatus($m, MonographStatus::VerificacaoDocumental);
        abort_unless(in_array($role, ['secretary', 'coordinator'], true), 422, 'Role inválida.');
        $oldStatus = $m->status->value;

        $this->recordDecision($m, 'orgao', $reviewer, $approved, $reason, $role);

        $m->update(['status' => $approved ? MonographStatus::Verificada : MonographStatus::Devolvida]);

        $this->recordTransition(
            $m,
            $reviewer,
            $approved ? 'documents_verified' : 'documents_returned',
            $oldStatus,
            $m->status->value,
            $approved ? 'Documentos da monografia verificados.' : 'Documentos da monografia devolvidos.',
        );

        $approved
            ? MonographVerified::dispatch($m)
            : MonographReturned::dispatch($m, 'orgao', $reason);

        return $m->fresh();
    }

    private function recordDecision(
        Monograph $m,
        string $stage,
        User $decider,
        bool $approved,
        ?string $reason,
        ?string $roleOverride = null
    ): void {
        abort_if(!$approved && blank($reason), 422, 'Motivo da devolução é obrigatório.');

        $submission = $m->submissions()->latest('version')->firstOrFail();

        $submission->reviews()->create([
            'stage'              => $stage,
            'decision'           => $approved ? 'aprovado' : 'devolvido',
            'reason'             => $reason,
            'decided_at'         => now(),
            'decided_by_user_id' => $decider->id,
            'decided_by_role'    => $roleOverride ?? $stage,
        ]);
    }

    private function assertStatus(Monograph $m, MonographStatus|array $expected): void
    {
        $expected = is_array($expected) ? $expected : [$expected];

        abort_unless(in_array($m->status, $expected, true), 409,
            "Transição inválida: estado actual é '{$m->status->value}'.");
    }



public function addComment(Monograph $m, User $author, string $role, string $comment): MonographComment
{
    abort_unless(in_array($role, ['supervisor', 'secretary', 'coordinator'], true), 422, 'Role inválida.');

    $submission = $m->submissions()->latest('version')->firstOrFail();

    $created = $submission->comments()->create([
        'commented_by_user_id' => $author->id,
        'commented_by_role'    => $role,
        'comment'              => $comment,
    ]);

    app(WorkflowTransitionService::class)->record(
        $m,
        'monograph',
        'comment_added',
        $author,
        null,
        $m->status->value,
        $m->status->value,
        'Comentário registado na monografia.',
        ['role' => $role, 'submission_version' => $submission->version, 'comment_id' => $created->id],
    );

    return $created;
}

    private function recordTransition(
        Monograph $monograph,
        User $actor,
        string $action,
        string $fromState,
        string $toState,
        string $description,
        ?\App\Models\DocumentRevision $revision = null,
    ): void {
        $workflow = app(WorkflowTransitionService::class);
        $workflow->assertAllowed('monograph', $fromState, $toState);
        $workflow->record($monograph, 'monograph', $action, $actor, null, $fromState, $toState, $description, [], $revision);
    }
}
