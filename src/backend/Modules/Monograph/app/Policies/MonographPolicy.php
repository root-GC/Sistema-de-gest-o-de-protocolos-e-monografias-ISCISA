<?php

namespace Modules\Monograph\app\Policies;

use Modules\User\app\Models\User;
use Modules\Monograph\app\Models\Monograph;

class MonographPolicy
{
    public function view(User $user, Monograph $m): bool
    {
        if ($user->hasPermission('monograph.view.all')) return true;
        if ($user->id === $m->student_id) return true;
        if ($user->teacherProfile?->id === $m->supervisor_id) return true;

        return $user->hasPermission('monograph.validate');
    }

    public function submit(User $user, Monograph $m): bool
    {
        return $user->hasPermission('monograph.submit')
            && $user->id === $m->student_id;
    }

    public function endorse(User $user, Monograph $m): bool
    {
        return $user->hasPermission('monograph.endorse')
            && $user->teacherProfile?->id === $m->supervisor_id;
    }

    public function verifyDocuments(User $user, Monograph $m): bool
    {
        return $user->hasPermission('monograph.validate');
    }
}