<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationFormCriterionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_name' => $this->group_name,
            'criterion_name' => $this->criterion_name,
            'order_column' => $this->order_column,
            'criterion_reviews' => EvaluationCriterionReviewResource::collection(
                $this->whenLoaded('criterionReviews')
            ),
        ];
    }
}
