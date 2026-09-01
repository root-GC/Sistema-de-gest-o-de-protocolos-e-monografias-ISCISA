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

        return $this->canManageForOrgan($user, $m);
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
        return $this->canManageForOrgan($user, $m);
    }

    private function canManageForOrgan(User $user, Monograph $monograph): bool
    {
        if (! $user->hasPermission('monograph.validate')) return false;

        $secretary = $user->secretaryProfile;
        if (! $secretary?->organ_id || $secretary->organ?->type !== 'nucleus') return false;

        return (int) $monograph->protocol?->topic?->scientificArea?->organ_id === (int) $secretary->organ_id;
    }
}
