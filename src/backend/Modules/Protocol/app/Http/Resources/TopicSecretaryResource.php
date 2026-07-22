<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
        ];
    }
}
