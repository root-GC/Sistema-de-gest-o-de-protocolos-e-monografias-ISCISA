<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Illuminate\Support\Carbon;

class ReviewerEvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $teacherProfile = $user?->teacherProfile;
        $isReviewer = $teacherProfile && $teacherProfile->id === $this->reviewer_id;
        $isSecretary = $user?->hasPermission('protocol.assign') ?? false;

        $assignedAt = $this->protocolReviewAssignment?->assigned_at
            ? Carbon::parse($this->protocolReviewAssignment->assigned_at)
            : Carbon::parse($this->created_at);
        $dueAt = $assignedAt->copy()->addDays(7);
        $overdue = now()->gt($dueAt) && $this->status !== ReviewerEvaluation::STATUS_SUBMITTED;
        $days = (int) ceil(abs(now()->diffInSeconds($dueAt, false)) / 86400);

        $base = [
            'id' => $this->id,
            'evaluation_form_id' => $this->evaluation_form_id,
            'reviewer_id' => $this->reviewer_id,
            'status' => $this->status,
            'is_evaluated' => $this->status === ReviewerEvaluation::STATUS_SUBMITTED,
            'is_primary' => (bool) $this->protocolReviewAssignment?->is_primary,
            'role' => $this->protocolReviewAssignment?->is_primary ? 'primary' : 'reviewer',
            'submitted_at' => $this->submitted_at,
            'evaluated_at' => $this->submitted_at,
            'assigned_at' => $assignedAt,
            'due_at' => $dueAt,
            'days_remaining' => $overdue ? -$days : $days,
            'overdue' => $overdue,
            'review_status' => $this->status === ReviewerEvaluation::STATUS_SUBMITTED ? 'reviewed' : 'not_reviewed',
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
            $base['preliminary_decision'] = $this->decision;
            $base['criterion_reviews'] = EvaluationCriterionReviewResource::collection(
                $this->whenLoaded('criterionReviews')
            );
        }

        return $base;
    }
}
