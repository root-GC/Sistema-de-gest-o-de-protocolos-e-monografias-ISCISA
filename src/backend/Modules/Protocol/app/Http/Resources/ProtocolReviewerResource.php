<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Protocol\app\Models\Protocol;

class ProtocolReviewerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $myAssignment = $this->relationLoaded('reviewAssignments')
            ? $this->reviewAssignments->sortByDesc('assigned_at')->first()
            : null;
        $assignmentOrganType = $myAssignment?->organ?->type;
        $formOrgan = $assignmentOrganType ? Protocol::formOrganFromOrganType($assignmentOrganType) : null;
        $attachments = $this->relationLoaded('protocolDocumentRequirements') && $formOrgan
            ? $this->protocolDocumentRequirements
                ->where('required_for_organ', $formOrgan)
                ->values()
            : collect();
        $history = $this->relationLoaded('histories') && $myAssignment?->organ_id
            ? $this->histories
                ->where('organ_id', $myAssignment->organ_id)
                ->values()
            : collect();

        return [
            'id' => $this->id,
            'code' => $this->code,
            'protocol_type' => $this->protocol_type,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'version' => $this->version,
            'submitted_at' => $this->submitted_at,
            'topic' => $this->whenLoaded('topic', fn () => [
                'id' => $this->topic?->id,
                'title' => $this->topic?->title,
                'status' => $this->topic?->status,
                'scientific_area' => $this->topic?->relationLoaded('scientificArea') && $this->topic->scientificArea ? [
                    'id' => $this->topic->scientificArea->id,
                    'name' => $this->topic->scientificArea->name,
                ] : null,
                'course' => $this->topic?->relationLoaded('course') && $this->topic->course ? [
                    'id' => $this->topic->course->id,
                    'name' => $this->topic->course->name,
                    'code' => $this->topic->course->code,
                ] : null,
            ]),
            'my_assignment' => $myAssignment ? [
                'id' => $myAssignment->id,
                'assigned_at' => $myAssignment->assigned_at,
                'status' => $myAssignment->status,
                'review_order' => $myAssignment->review_order,
                'is_primary' => (bool) $myAssignment->is_primary,
                'organ' => $myAssignment->relationLoaded('organ') && $myAssignment->organ ? [
                    'id' => $myAssignment->organ->id,
                    'name' => $myAssignment->organ->name,
                    'type' => $myAssignment->organ->type,
                ] : null,
            ] : null,
            'latest_document' => $this->whenLoaded('latestDocument', fn() => $this->latestDocument ? [
                'id' => $this->latestDocument->id,
                'file_name' => $this->latestDocument->file_name,
                'download_url' => url("api/v1/protocols/{$this->id}/download"),
                'version' => $this->latestDocument->version,
                'version_label' => $this->latestDocument->version_label,
                'status' => $this->latestDocument->status,
            ] : null),
            'reviewer_attachments' => $attachments->map(fn($requirement) => [
                'id' => $requirement->id,
                'name' => $requirement->nome,
                'file_name' => $requirement->file_name,
                'download_url' => $requirement->download_url,
                'is_optional' => (bool) $requirement->is_optional,
                'uploaded' => (bool) $requirement->enviado,
                'approved' => $requirement->aprovado,
                'status_label' => $requirement->status_label,
            ])->values(),
            'review_history' => $history->map(fn($item) => [
                'id' => $item->id,
                'action' => $item->action,
                'description' => $item->description,
                'old_status' => $item->old_status,
                'new_status' => $item->new_status,
                'occurred_at' => $item->occurred_at,
                'actor' => $item->actor ? [
                    'id' => $item->actor->id,
                    'name' => $item->actor->name,
                ] : null,
            ])->values(),
        ];
    }
}
