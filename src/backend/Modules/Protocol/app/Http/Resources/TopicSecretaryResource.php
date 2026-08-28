<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Protocol\app\Models\Topic;

/**
 * Resposta do Núcleo — revisão cega (RF-039 / RNF-004).
 * Não expõe estudante nem supervisor; apenas dados necessários para triagem e atribuição.
 */
class TopicSecretaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'justification' => $this->justification,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'document_path' => $this->document_path,
            'document_name' => $this->document_name,
            'submitted_at' => $this->submitted_at,
            'scientific_area' => $this->whenLoaded('scientificArea', fn () => [
                'id' => $this->scientificArea->id,
                'name' => $this->scientificArea->name,
            ]),
            'course' => $this->whenLoaded('course', fn () => [
                'id' => $this->course->id,
                'name' => $this->course->name,
                'code' => $this->course->code,
            ]),
            'review_assignments' => TopicReviewAssignmentSecretaryResource::collection(
                $this->whenLoaded('reviewAssignments')
            ),
            'histories' => $this->whenLoaded('histories', fn() => $this->histories->map(fn($history) => [
                'id' => $history->id,
                'organ_id' => $history->organ_id,
                'action' => $history->action,
                'action_label' => $this->historyActionLabel($history->action),
                'description' => $history->description,
                'old_status' => $history->old_status,
                'old_status_label' => $this->topicStatusLabel($history->old_status),
                'new_status' => $history->new_status,
                'new_status_label' => $this->topicStatusLabel($history->new_status),
                'metadata' => $history->metadata,
                'occurred_at' => $history->occurred_at,
                'actor' => $history->actor ? [
                    'id' => $history->actor->id,
                    'name' => $history->actor->name,
                    'email' => $history->actor->email,
                ] : null,
            ])->values()),
        ];
    }

    private function historyActionLabel(?string $action): ?string
    {
        if (! $action) {
            return null;
        }

        return match ($action) {
            'submitted' => 'Submetido',
            'supervisor_approved' => 'Aprovado pelo supervisor',
            'supervisor_rejected' => 'Nao aprovado pelo supervisor',
            'reviewers_assigned' => 'Revisores atribuídos',
            'review_submitted' => 'Avaliação submetida',
            'review_completed' => 'Avaliação concluída',
            default => $action,
        };
    }

    private function topicStatusLabel(?string $status): ?string
    {
        if (! $status) {
            return null;
        }

        return match ($status) {
            'topic_pending' => 'Aguardando aprovação do supervisor',
            'topic_approved' => 'Aguardando aprovação do Nucleo Cientifico',
            'topic_rejected' => 'Não aprovado pelo supervisor',
            Topic::STATUS_PENDING_SUPERVISOR => 'Aguardando aprovação do supervisor',
            Topic::STATUS_PENDING_NUCLEO => 'Aguardando atribuição de avaliadores',
            Topic::STATUS_ASSIGNED => 'Avaliadores atribuídos, em revisão',
            Topic::STATUS_IN_REVIEW => 'Em revisão pelo Nucleo Cientifico',
            Topic::STATUS_APPROVED_NUCLEO => 'Aprovado pelo Nucleo Cientifico',
            Topic::STATUS_REJECTED_SUPERVISOR => 'Não aprovado pelo supervisor',
            Topic::STATUS_REJECTED_NUCLEO => 'Não aprovado pelo Nucleo Cientifico',
            default => $status,
        };
    }
}
