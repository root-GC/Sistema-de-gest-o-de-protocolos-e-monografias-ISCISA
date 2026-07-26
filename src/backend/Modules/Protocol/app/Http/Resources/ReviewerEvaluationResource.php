<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewerEvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $teacherProfile = $user?->teacherProfile;
        $isReviewer = $teacherProfile && $teacherProfile->id === $this->reviewer_id;
        $isSecretary = $user?->hasPermission('protocol.assign') ?? false;

        $base = [
            'id' => $this->id,
            'evaluation_form_id' => $this->evaluation_form_id,
            'reviewer_id' => $this->reviewer_id,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at,
            'reviewer' => $this->whenLoaded('reviewer', fn() => [
                'id' => $this->reviewer->id,
                'user' => $this->reviewer->relationLoaded('user') && $this->reviewer->user ? [
                    'id' => $this->reviewer->user->id,
                    'name' => $this->reviewer->user->name,
                ] : null,
            ]),
        ];

        if ($isReviewer || ! $isSecretary) {
            $base['overall_comment'] = $this->overall_comment;
            $base['decision'] = $this->decision;
            $base['criterion_reviews'] = EvaluationCriterionReviewResource::collection(
                $this->whenLoaded('criterionReviews')
            );
        }

        return $base;
    }
}
