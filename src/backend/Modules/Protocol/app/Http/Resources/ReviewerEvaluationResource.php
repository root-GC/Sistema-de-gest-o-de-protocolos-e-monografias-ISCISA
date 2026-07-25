<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewerEvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'evaluation_form_id' => $this->evaluation_form_id,
            'reviewer_id' => $this->reviewer_id,
            'overall_comment' => $this->overall_comment,
            'recommendation' => $this->recommendation,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at,
            'reviewer' => $this->whenLoaded('reviewer', fn() => [
                'id' => $this->reviewer->id,
                'user' => $this->reviewer->relationLoaded('user') && $this->reviewer->user ? [
                    'id' => $this->reviewer->user->id,
                    'name' => $this->reviewer->user->name,
                ] : null,
            ]),
            'criterion_reviews' => EvaluationCriterionReviewResource::collection(
                $this->whenLoaded('criterionReviews')
            ),
        ];
    }
}
