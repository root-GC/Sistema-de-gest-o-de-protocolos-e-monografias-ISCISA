<?php

namespace Modules\Protocol\app\Policies;

use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class EvaluationFormPolicy
{
    public function view(User $user, EvaluationForm $form): bool
    {
        if ($user->hasPermission('protocol.view.all')) {
            return true;
        }

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

        return $this->viewForSecretary($user, $form);
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
        if ($user->hasPermission('protocol.view.all')) {
            return true;
        }

        if (! $user->hasPermission('protocol.assign')) {
            return false;
        }

        $secretaryProfile = $user->secretaryProfile?->loadMissing('organ');
        $expectedOrganType = Protocol::organTypeFromFormOrgan($form->organ);

        if (! $secretaryProfile?->organ_id || ! $expectedOrganType || $secretaryProfile->organ?->type !== $expectedOrganType) {
            return false;
        }

        $protocol = $form->protocol()->with(['histories:id,protocol_id,organ_id', 'reviewAssignments:id,protocol_id,organ_id'])->first();
        if (! $protocol) {
            return false;
        }

        return (int) $protocol->current_organ_id === (int) $secretaryProfile->organ_id
            || $protocol->histories->contains('organ_id', $secretaryProfile->organ_id)
            || $protocol->reviewAssignments->contains('organ_id', $secretaryProfile->organ_id);
    }
}
