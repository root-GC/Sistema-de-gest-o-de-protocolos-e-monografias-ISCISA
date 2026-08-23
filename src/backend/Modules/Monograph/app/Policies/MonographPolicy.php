<?php

namespace Modules\Monograph\app\Policies;

use Modules\User\app\Models\User;
use Modules\Monograph\app\Models\Monograph;
use Illuminate\Support\Facades\DB;

class MonographPolicy
{
    public function view(User $user, Monograph $m): bool
    {
        if ($user->hasPermission('monograph.view.all')) return true;
        if ($user->id === $m->student_id) return true;
        if ($user->teacherProfile?->id === $m->supervisor_id) return true;

        // Allow jury members (presidente/arguente) of the associated defense to view
        if ($m->defense && $user->teacherProfile) {
            $isJury = $m->defense->jury()->where('teacher_id', $user->teacherProfile->id)->exists();
            if ($isJury) return true;
        }

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
        if (!$user->hasPermission('monograph.validate')) {
            return false;
        }

        // Secretária só pode validar se pertencer à Direção Científica
        if ($user->secretaryProfile) {
            return $user->secretaryProfile->organ?->type === 'scientific_direction';
        }

        // Coordenador pode validar se for coordenador da área/curso do tópico
        if ($user->coordinatorProfile) {
            $coordinatorProfile = $user->coordinatorProfile;

            $topicData = DB::table('topics')
                ->join('protocols', 'protocols.topic_id', '=', 'topics.id')
                ->where('protocols.id', $m->protocol_id)
                ->select('topics.scientific_area_id', 'topics.course_id')
                ->first();

            if (!$topicData) {
                return false;
            }

            $sameScientificArea = (int) ($coordinatorProfile->scientific_area_id ?? 0) === (int) ($topicData->scientific_area_id ?? 0);
            $sameCourse = (int) ($coordinatorProfile->course_id ?? 0) === (int) ($topicData->course_id ?? 0);

            return $sameScientificArea || $sameCourse;
        }

        return false;
    }
}