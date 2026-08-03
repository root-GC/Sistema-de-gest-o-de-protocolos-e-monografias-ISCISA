<?php
// Modules/Defense/app/Policies/DefensePolicy.php

namespace Modules\Defense\app\Policies;

use Modules\User\app\Models\User;
use Modules\Defense\app\Models\Defense;
use Illuminate\Support\Facades\DB;

class DefensePolicy
{
    public function view(User $user, Defense $d): bool
    {
        return $user->hasPermission('defense.view')
            || $user->hasPermission('defense.view.all')
            || $user->id === $d->monograph->student_id
            || $user->teacherProfile?->id === $d->monograph->supervisor_id;
    }

    public function assignJury(User $user, Defense $d): bool
    {
        return $user->hasPermission('defense.jury.assign') && $this->isCoordinatorOfArea($user, $d);
    }

    public function schedule(User $user, Defense $d): bool
    {
        return $user->hasPermission('defense.schedule') && $this->isCoordinatorOfArea($user, $d);
    }

    public function recordGrade(User $user, Defense $d): bool
    {
        return $user->hasPermission('defense.grade.record') && $this->isCoordinatorOfArea($user, $d);
    }

    public function uploadMinutes(User $user, Defense $d): bool
    {
        return $user->hasPermission('defense.minutes.upload') && $this->isCoordinatorOfArea($user, $d);
    }

    public function submitFinalDocument(User $user, Defense $d): bool
    {
        return $d->monograph->student_id === $user->id;
    }

    public function validateFinalDocument(User $user, Defense $d): bool
    {
        return $user->hasPermission('defense.grade.record') && $this->isCoordinatorOfArea($user, $d);
    }

    /**
     * O coordenador só pode gerir defesas associadas ao seu curso e/ou área.
     * O critério usa a cadeia monografia → protocolo → tópico e aceita:
     * 1. coincidência de área científica; ou
     * 2. coincidência de curso, que é o critério mais robusto para o fluxo real.
     */
    private function isCoordinatorOfArea(User $user, Defense $d): bool
    {
        $coordinatorProfile = $user->coordinatorProfile;

        if (!$coordinatorProfile) {
            return false;
        }

        $topicData = DB::table('topics')
            ->join('protocols', 'protocols.topic_id', '=', 'topics.id')
            ->where('protocols.id', $d->monograph->protocol_id)
            ->select('topics.scientific_area_id', 'topics.course_id')
            ->first();

        if (!$topicData) {
            return false;
        }

        $sameScientificArea = (int) ($coordinatorProfile->scientific_area_id ?? 0) === (int) ($topicData->scientific_area_id ?? 0);
        $sameCourse = (int) ($coordinatorProfile->course_id ?? 0) === (int) ($topicData->course_id ?? 0);

        return $sameScientificArea || $sameCourse;
    }
}