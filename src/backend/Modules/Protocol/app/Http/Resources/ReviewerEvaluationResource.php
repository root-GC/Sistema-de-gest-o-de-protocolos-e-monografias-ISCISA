<?php

namespace Modules\Protocol\app\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Modules\Protocol\app\Models\DeliberationMeeting;
use Modules\Protocol\app\Models\DeliberationMeetingItem;
use Modules\Protocol\app\Models\ReviewerEvaluation;

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
        $completedMeetingItem = DeliberationMeetingItem::query()
            ->where('evaluation_form_id', $this->evaluation_form_id)
            ->where('status', DeliberationMeetingItem::STATUS_DELIBERATED)
            ->whereHas('meeting', fn ($query) => $query
                ->where('status', DeliberationMeeting::STATUS_COMPLETED)
                ->whereNotNull('completed_at'))
            ->with('meeting:id,status,completed_at')
            ->latest('id')
            ->first();
        $deadlineStart = $completedMeetingItem?->meeting?->completed_at;
        $dueAt = $deadlineStart ? Carbon::parse($deadlineStart)->addDays(3) : null;
        $overdue = $dueAt && now()->gt($dueAt) && $this->status !== ReviewerEvaluation::STATUS_SUBMITTED;
        $days = $dueAt ? (int) ceil(abs(now()->diffInSeconds($dueAt, false)) / 86400) : null;

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
            'days_remaining' => $days === null ? null : ($overdue ? -$days : $days),
            'overdue' => (bool) $overdue,
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
