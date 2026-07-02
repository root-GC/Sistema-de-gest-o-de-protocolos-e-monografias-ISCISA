<?php

namespace Modules\Protocol\app\Policies;

use Modules\User\app\Models\User;

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
}
