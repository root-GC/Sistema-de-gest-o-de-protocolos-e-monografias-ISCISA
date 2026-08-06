<?php

namespace Modules\Auth\app\Listeners;

use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Events\ProtocolReviewersAssigned;

class AssignReviewerRoleFromProtocol
{
    public function handle(ProtocolReviewersAssigned $event): void
    {
        $roleId = DB::table('roles')
            ->where('name', 'reviewer')
            ->value('id');

        if (! $roleId) {
            return;
        }

        $userIds = DB::table('teacher_profiles')
            ->whereIn('id', $event->reviewerIds)
            ->pluck('user_id')
            ->all();

        foreach ($userIds as $userId) {
            DB::table('user_roles')->updateOrInsert(
                [
                    'user_id' => $userId,
                    'role_id' => $roleId,
                ],
                [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
