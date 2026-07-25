<?php

namespace Modules\Protocol\app\Policies;

use Modules\Protocol\app\Models\EvaluationForm;
use Modules\User\app\Models\User;

class EvaluationFormPolicy
{
    public function view(User $user, EvaluationForm $form): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile) {
            return false;
        }

        $isReviewer = $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();

        if ($isReviewer) {
            return true;
        }

        if ($user->hasPermission('protocol.assign')) {
            $secretaryProfile = $user->secretaryProfile;
            if ($secretaryProfile) {
                return true;
            }
        }

        return false;
    }

    public function submitEvaluation(User $user, EvaluationForm $form): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile || ! $user->hasPermission('protocol.evaluate')) {
            return false;
        }

        return $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();
    }

    public function decide(User $user, EvaluationForm $form): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile || ! $user->hasPermission('protocol.evaluate')) {
            return false;
        }

        return $form->reviewerEvaluations()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();
    }

    public function viewForSecretary(User $user, EvaluationForm $form): bool
    {
        if (! $user->hasPermission('protocol.assign')) {
            return false;
        }

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile) {
            return false;
        }

        return true;
    }
}
