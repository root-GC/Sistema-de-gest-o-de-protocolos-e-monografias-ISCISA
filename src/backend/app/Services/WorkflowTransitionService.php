<?php

namespace App\Services;

use App\Models\DocumentRevision;
use App\Models\WorkflowEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Modules\User\app\Models\User;
use Shared\Core\Exceptions\WorkflowException;

class WorkflowTransitionService
{
    public function transition(
        Model $subject,
        string $workflow,
        string $toState,
        ?User $actor,
        string $action,
        ?int $organId = null,
        ?string $description = null,
        array $metadata = [],
        ?DocumentRevision $documentRevision = null,
    ): Model {
        $fromState = $this->stateOf($subject);
        $this->assertAllowed($workflow, $fromState, $toState);

        $subject->setAttribute('status', $toState);
        $subject->save();

        $this->record($subject, $workflow, $action, $actor, $organId, $fromState, $toState, $description, $metadata, $documentRevision);

        return $subject;
    }

    public function assertAllowed(string $workflow, ?string $fromState, ?string $toState): void
    {
        if ($fromState === null || $toState === null || $fromState === $toState) {
            return;
        }

        $allowed = $this->allowedTransitions()[$workflow][$fromState] ?? [];

        if (! in_array($toState, $allowed, true)) {
            throw new WorkflowException(
                "Transição inválida de {$fromState} para {$toState} no fluxo {$workflow}.",
                $fromState,
                $toState,
            );
        }
    }

    public function record(
        Model $subject,
        string $workflow,
        string $action,
        ?User $actor = null,
        ?int $organId = null,
        ?string $fromState = null,
        ?string $toState = null,
        ?string $description = null,
        array $metadata = [],
        ?DocumentRevision $documentRevision = null,
        ?string $eventKey = null,
    ): WorkflowEvent {
        return WorkflowEvent::create([
            'event_key' => $eventKey ?? (string) Str::uuid(),
            'subject_type' => $workflow,
            'subject_id' => $subject->getKey(),
            'actor_id' => $actor?->id,
            'organ_id' => $organId,
            'document_revision_id' => $documentRevision?->id,
            'action' => $action,
            'from_state' => $fromState,
            'to_state' => $toState,
            'description' => $description,
            'metadata' => $metadata === [] ? null : $metadata,
            'occurred_at' => now(),
        ]);
    }

    private function stateOf(Model $subject): ?string
    {
        $state = $subject->getAttribute('status');

        return $state instanceof \BackedEnum ? $state->value : $state;
    }

    /** @return array<string, array<string, array<int, string>>> */
    private function allowedTransitions(): array
    {
        return [
            'topic' => [
                'topic_pending_supervisor' => ['topic_pending_nucleo', 'topic_rejected_supervisor'],
                'topic_pending_nucleo' => ['topic_assigned_for_review'],
                'topic_assigned_for_review' => ['topic_in_review', 'topic_approved_nucleo', 'topic_rejected_nucleo'],
                'topic_in_review' => ['topic_approved_nucleo', 'topic_rejected_nucleo'],
                'topic_rejected_supervisor' => ['topic_pending_supervisor'],
                'topic_rejected_nucleo' => ['topic_pending_supervisor'],
            ],
            'protocol' => [
                'protocol_pending_supervisor' => ['protocol_documents_pending_cc', 'protocol_rejected_supervisor'],
                'protocol_documents_pending_cc' => ['protocol_pending_comite_cientifico'],
                'protocol_pending_comite_cientifico' => ['protocol_in_review_comite_cientifico'],
                'protocol_in_review_comite_cientifico' => ['protocol_parecer_pending_cc_signature', 'protocol_rejected_cc'],
                'protocol_parecer_pending_cc_signature' => ['protocol_documents_pending_cibs'],
                'protocol_documents_pending_cibs' => ['protocol_pending_comite_bioetica'],
                'protocol_pending_comite_bioetica' => ['protocol_in_review_comite_bioetica'],
                'protocol_in_review_comite_bioetica' => ['protocol_parecer_pending_cibs_signature', 'protocol_rejected_bioetica'],
                'protocol_parecer_pending_cibs_signature' => ['protocol_approved_final'],
                'protocol_rejected_supervisor' => ['protocol_pending_supervisor'],
                'protocol_rejected_cc' => ['protocol_pending_supervisor'],
                'protocol_rejected_bioetica' => ['protocol_pending_supervisor'],
                'protocol_pending_nucleo' => ['protocol_documents_pending_cc'],
                'protocol_in_review_nucleo' => ['protocol_documents_pending_cc'],
            ],
            'monograph' => [
                'aguarda_submissao' => ['submetida'],
                'devolvida' => ['submetida'],
                'submetida' => ['verificacao_documental', 'devolvida'],
                'verificacao_documental' => ['verificada', 'devolvida'],
            ],
            'defense' => [
                'aguarda_juri' => ['juri_definido'],
                'juri_definido' => ['data_proposta'],
                'data_proposta' => ['defesa_agendada'],
                'defesa_agendada' => ['defendida'],
                'defendida' => ['aguarda_correcoes_finais', 'encerrada'],
                'aguarda_correcoes_finais' => ['correcoes_submetidas'],
                'correcoes_submetidas' => ['aguarda_correcoes_finais', 'encerrada'],
            ],
        ];
    }
}
