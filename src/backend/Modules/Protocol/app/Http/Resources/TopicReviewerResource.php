<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resposta do revisor — revisão cega (RF-039 / RNF-004).
 * Não expõe estudante nem supervisor; apenas conteúdo do tema e atribuição própria.
 */
class TopicReviewerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $teacherProfileId = $request->user()?->teacherProfile?->id;

        $myAssignment = $this->relationLoaded('reviewAssignments')
            ? $this->reviewAssignments->firstWhere('reviewer_id', $teacherProfileId)
            : null;

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
            'my_assignment' => $myAssignment
                ? TopicReviewAssignmentReviewerResource::make($myAssignment)
                : null,
        ];
    }
}
