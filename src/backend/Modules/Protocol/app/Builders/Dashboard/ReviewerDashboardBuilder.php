<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\User\app\Models\User;

class ReviewerDashboardBuilder implements DashboardBuilder
{
    public function build(User $user): array
    {
        // Ajusta: TeacherProfile do utilizador — ReviewerEvaluation.reviewer_id
        // aponta para TeacherProfile, não para User diretamente.
        $teacherProfileId = $user->teacherProfile?->id;

        $pending = ReviewerEvaluation::query()
            ->where('reviewer_id', $teacherProfileId)
            ->whereIn('status', [ReviewerEvaluation::STATUS_PENDING, ReviewerEvaluation::STATUS_IN_PROGRESS])
            ->with('evaluationForm.protocol.topic')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (ReviewerEvaluation $r) => [
                'evaluation_form_id' => $r->evaluation_form_id,
                'title'              => $r->evaluationForm?->protocol?->topic?->title,
                'organ'              => $r->evaluationForm?->organ,
                'status'             => $r->status,
            ])
            ->all();

        return [
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'pending_evaluations' => $pending,
            'notifications'       => [],
        ];
    }
}