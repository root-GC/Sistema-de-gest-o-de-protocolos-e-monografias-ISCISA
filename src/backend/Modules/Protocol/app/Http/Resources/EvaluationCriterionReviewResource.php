<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationCriterionReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'comment' => $this->comment,
            'reviewer_evaluation_id' => $this->reviewer_evaluation_id,
            'reviewer' => $this->whenLoaded('reviewerEvaluation.reviewer', fn() => [
                'id' => $this->reviewerEvaluation->reviewer->id,
                'name' => $this->reviewerEvaluation->reviewer->user->name ?? 'Desconhecido',
            ]),
        ];
    }
}
