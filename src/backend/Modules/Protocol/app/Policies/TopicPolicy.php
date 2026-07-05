<?php

namespace Modules\Protocol\app\Policies;

use Modules\User\app\Models\User;
use Modules\Protocol\app\Models\Topic;

class TopicPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('topic.view') || $user->hasPermission('topic.view.all');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('topic.create');
    }

    public function update(User $user, Topic $topic): bool
    {
        return $user->hasPermission('topic.update');
    }

    public function delete(User $user, Topic $topic): bool
    {
        return $user->hasPermission('topic.delete');
    }

    public function approveBySupervisor(User $user, Topic $topic): bool
    {
        $teacherProfile = $user->teacherProfile;

        return $teacherProfile
            && $teacherProfile->id === $topic->supervisor_id
            && $user->hasPermission('supervision.approve');
    }

    public function rejectBySupervisor(User $user, Topic $topic): bool
    {
        $teacherProfile = $user->teacherProfile;

        return $teacherProfile
            && $teacherProfile->id === $topic->supervisor_id
            && $user->hasPermission('supervision.approve');
    }
}
