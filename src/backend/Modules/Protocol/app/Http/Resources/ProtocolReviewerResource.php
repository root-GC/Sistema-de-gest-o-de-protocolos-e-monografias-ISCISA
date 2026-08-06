<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProtocolReviewerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $myAssignment = $this->relationLoaded('reviewAssignments')
            ? $this->reviewAssignments->firstWhere('organ_id', $this->current_organ_id) ?? $this->reviewAssignments->first()
            : null;

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
                'justification' => $this->topic?->justification,
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
            ] : null,
            'latest_document' => $this->whenLoaded('latestDocument', fn() => $this->latestDocument ? [
                'id' => $this->latestDocument->id,
                'file_name' => $this->latestDocument->file_name,
                'file_url' => Storage::disk('public')->url($this->latestDocument->file_path),
                'file_path' => $this->latestDocument->file_path,
                'download_url' => url("api/v1/protocols/{$this->id}/download"),
                'version' => $this->latestDocument->version,
                'version_label' => $this->latestDocument->version_label,
                'status' => $this->latestDocument->status,
            ] : null),
        ];
    }
}
