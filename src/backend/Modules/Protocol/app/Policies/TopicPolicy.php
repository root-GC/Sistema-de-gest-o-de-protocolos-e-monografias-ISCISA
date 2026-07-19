<?php

namespace Modules\Protocol\app\Policies;

use Modules\User\app\Models\User;
use Modules\User\app\Models\TeacherProfile;
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

    /**
     * viewForSecretary: Secretaria só vê temas do seu núcleo (organ) em estado topic_pending_nucleo.
     *
     * Verifica:
     *   - User tem permissão 'protocol.assign' (secretaria)
     *   - Secretary_profile.organ_id === Topic.scientific_area.organ_id
     *   - Topic está em topic_pending_nucleo (não revisor/aprovado/rejeitado)
     */
    public function viewForSecretary(User $user, Topic $topic): bool
    {
        if (! $user->hasPermission('protocol.assign')) {
            return false;
        }

        $secretary = $user->secretaryProfile;
        if (! $secretary) {
            return false;
        }

        // Verifica se o tema está no estado correto para alocação
        if ($topic->status !== Topic::STATUS_PENDING_NUCLEO) {
            return false;
        }

        // Verifica se o núcleo da secretaria é o mesmo do tema
        $topicOrgan = $topic->scientificArea?->organ_id;

        if ($secretary->organ_id !== $topicOrgan) {
            return false;
        }

        // Se a secretaria tem uma área científica atribuída, só vê temas dessa área
        if ($secretary->scientific_area_id && (int) $secretary->scientific_area_id !== (int) $topic->scientific_area_id) {
            return false;
        }

        return true;
    }

    /**
     * assignReviewers: Secretaria pode atribuir avaliadores.
     *
     * Verifica:
     *   - viewForSecretary() já passou (secretaria do núcleo correto)
     *   - Reviewer é docente do mesmo núcleo
     *   - Reviewer tem permissão 'reviewer.assign'
     */
    public function assignReviewers(User $user, Topic $topic, TeacherProfile $reviewer): bool
    {
        if (! $this->viewForSecretary($user, $topic)) {
            return false;
        }

        // Verifica se o avaliador é do mesmo núcleo
        $secretary = $user->secretaryProfile;
        $reviewerOrgan = $reviewer->scientificArea?->organ_id;

        return $secretary->organ_id === $reviewerOrgan;
    }

    public function viewForReviewer(User $user, Topic $topic): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (! $teacherProfile || ! $user->hasPermission('protocol.evaluate')) {
            return false;
        }

        return $topic->reviewAssignments()
            ->where('reviewer_id', $teacherProfile->id)
            ->exists();
    }

    public function submitEvaluation(User $user, Topic $topic): bool
    {
        return $this->viewForReviewer($user, $topic);
    }
}
