<?php

namespace Modules\User\app\Services;

use Modules\User\app\Models\User;

class ProfileService
{
    /**
     * Actualiza o perfil contextual do utilizador
     * com base na sua role activa.
     */
    public function update(User $user, string $activeRole, array $data): void
    {
        match ($activeRole) {
            'teacher', 'supervisor', 'reviewer' => $this->updateTeacherProfile($user, $data),
            'student'                           => $this->updateStudentProfile($user, $data),
            'coordinator'                       => $this->updateCoordinatorProfile($user, $data),
            'secretary'                         => $this->updateSecretaryProfile($user, $data),
            default                             => null,
        };
    }

    private function updateTeacherProfile(User $user, array $data): void
    {
        $user->teacherProfile()->updateOrCreate(
            ['user_id' => $user->id],
            array_filter([
                'department'      => $data['department']      ?? null,
                'academic_degree' => $data['academic_degree'] ?? null,
                'scientific_area_id' => $data['scientific_area_id'] ?? null,
            ])
        );
    }

    private function updateStudentProfile(User $user, array $data): void
    {
        $user->studentProfile()->updateOrCreate(
            ['user_id' => $user->id],
            array_filter([
                'student_number' => $data['student_number'] ?? null,
                'course_id'      => $data['course_id']      ?? null,
            ])
        );
    }

    private function updateCoordinatorProfile(User $user, array $data): void
    {
        $user->coordinatorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            array_filter([
                'office'           => $data['office']           ?? null,
                'course_id'        => $data['course_id']        ?? null,
                'scientific_area'  => $data['scientific_area']  ?? null,
            ])
        );
    }

    private function updateSecretaryProfile(User $user, array $data): void
    {
        $user->secretaryProfile()->updateOrCreate(
            ['user_id' => $user->id],
            array_filter([
                'office'   => $data['office']   ?? null,
                'organ_id' => $data['organ_id'] ?? null,
            ])
        );
    }
}