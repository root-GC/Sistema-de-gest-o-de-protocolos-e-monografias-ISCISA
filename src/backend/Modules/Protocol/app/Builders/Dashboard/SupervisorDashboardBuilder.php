<?php

namespace Modules\Protocol\app\Builders\Dashboard;

use Modules\Protocol\app\Contracts\DashboardBuilder;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\StudentProfile;
use Modules\User\app\Models\User;

class SupervisorDashboardBuilder implements DashboardBuilder
{
    public function build(User $user): array
    {
        // O mesmo TeacherProfile serve para teacher/supervisor/reviewer —
        // aqui interessa-nos só o papel de supervisor, filtrando por
        // supervisor_id nos Topics e Protocols.
        $teacherProfileId = $user->teacherProfile?->id;

        $pendingTopics = Topic::query()
            ->where('supervisor_id', $teacherProfileId)
            ->where('status', Topic::STATUS_PENDING_SUPERVISOR)
            ->latest('submitted_at')
            ->take(10)
            ->get(['id', 'title', 'submitted_at'])
            ->map(fn (Topic $t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'submitted_at' => $t->submitted_at,
            ])
            ->all();

        $pendingProtocols = Protocol::query()
            ->where('supervisor_id', $teacherProfileId)
            ->where('status', Protocol::STATUS_PENDING_SUPERVISOR)
            ->with('topic')
            ->latest('submitted_at')
            ->take(10)
            ->get()
            ->map(fn (Protocol $p) => [
                'id'           => $p->id,
                'title'        => $p->topic?->title,
                'submitted_at' => $p->submitted_at,
            ])
            ->all();

        $superviseesCount = StudentProfile::query()
            ->where('supervisor_id', $teacherProfileId)
            ->count();

        return [
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'supervisees_count' => $superviseesCount,
            'pending_topics'    => $pendingTopics,
            'pending_protocols' => $pendingProtocols,
            'notifications'     => [],
        ];
    }
}