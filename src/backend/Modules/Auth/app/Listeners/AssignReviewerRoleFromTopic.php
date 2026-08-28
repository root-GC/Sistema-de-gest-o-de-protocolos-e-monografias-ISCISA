<?php

namespace Modules\Auth\app\Listeners;

use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Events\TopicReviewersAssigned;

class AssignReviewerRoleFromTopic
{
    public function handle(TopicReviewersAssigned $event): void
    {
        $roleIds = DB::table('roles')
            ->whereIn('name', ['teacher', 'supervisor', 'reviewer'])
            ->pluck('id');

        if ($roleIds->isEmpty()) {
            return;
        }

        $userIds = DB::table('teacher_profiles')
            ->whereIn('id', $event->reviewerIds)
            ->pluck('user_id')
            ->all();

        foreach ($userIds as $userId) {
            foreach ($roleIds as $roleId) {
                DB::table('user_roles')->updateOrInsert(
                    [
                        'user_id' => $userId,
                        'role_id' => $roleId,
                    ],
                    [
                        'deleted_at' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
