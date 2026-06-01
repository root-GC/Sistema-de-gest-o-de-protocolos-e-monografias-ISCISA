<?php

namespace Modules\Auth\Services;

use App\Models\User;

/**
 * Constrói o payload completo de autenticação.
 *
 * Baseia-se EXCLUSIVAMENTE nas tabelas existentes:
 *   users, roles, permissions, user_roles, role_permissions,
 *   teacher_profiles, student_profiles, coordinator_profiles,
 *   secretary_profiles, admin_profiles,
 *   scientific_areas, courses, organs
 */
class AuthPayloadBuilder
{
    public function build(User $user): array
    {
        $user->load([
            'roles.permissions',
            'teacherProfile.scientificArea',
            'studentProfile.course',
            'studentProfile.supervisor',
            'coordinatorProfile.course',
            'coordinatorProfile.scientificArea',
            'secretaryProfile.organ',
            'adminProfile.organ',
        ]);

        $roles = $user->roles->pluck('name')->toArray();

        // Permissões únicas de todas as roles
        $permissions = $user->roles
            ->flatMap(fn($role) => $role->permissions->pluck('code'))
            ->unique()
            ->values()
            ->toArray();

        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'status'      => $user->status,
            'roles'       => $roles,
            'permissions' => $permissions,
            'profiles'    => $this->buildProfiles($user, $roles),
        ];
    }

    private function buildProfiles(User $user, array $roles): array
    {
        $profiles = [];

        // teacher_profiles → scientific_area
        if (in_array('teacher', $roles) && $tp = $user->teacherProfile) {
            $profiles['teacher'] = [
                'id'              => $tp->id,
                'department'      => $tp->department,
                'academic_degree' => $tp->academic_degree,
                'is_internal'     => $tp->is_Internal,
                'scientific_area' => $tp->scientificArea ? [
                    'id'   => $tp->scientificArea->id,
                    'name' => $tp->scientificArea->name,
                ] : null,
            ];
        }

        // supervisor — usa teacher_profiles (mesma tabela, role distinta)
        // Um docente pode ter ambas: teacher + supervisor.
        // O frontend usa este perfil para mostrar o menu de supervisão
        // e para saber que pode executar supervision.approve.
        if (in_array('supervisor', $roles) && $tp = $user->teacherProfile) {
            $profiles['supervisor'] = [
                'id'              => $tp->id,
                'department'      => $tp->department,
                'academic_degree' => $tp->academic_degree,
                'is_internal'     => $tp->is_Internal,
                'scientific_area' => $tp->scientificArea ? [
                    'id'   => $tp->scientificArea->id,
                    'name' => $tp->scientificArea->name,
                ] : null,
                // Lista de tutorandos carregada pelo módulo Supervision, não aqui
            ];
        }

        // student_profiles → course + supervisor (teacher_profile)
        if (in_array('student', $roles) && $sp = $user->studentProfile) {
            $profiles['student'] = [
                'id'             => $sp->id,
                'student_number' => $sp->student_number,
                'course'         => $sp->course ? [
                    'id'   => $sp->course->id,
                    'name' => $sp->course->name,
                ] : null,
                'supervisor_id'  => $sp->supervisorID,
            ];
        }

        // coordinator_profiles → course + scientific_area
        if (in_array('coordinator', $roles) && $cp = $user->coordinatorProfile) {
            $profiles['coordinator'] = [
                'id'             => $cp->id,
                'office'         => $cp->office,
                'course'         => $cp->course ? [
                    'id'   => $cp->course->id,
                    'name' => $cp->course->name,
                ] : null,
                'scientific_area' => $cp->scientificArea ? [
                    'id'   => $cp->scientificArea->id,
                    'name' => $cp->scientificArea->name,
                ] : null,
            ];
        }

        // secretary_profiles → organ
        if (in_array('secretary', $roles) && $sec = $user->secretaryProfile) {
            $profiles['secretary'] = [
                'id'     => $sec->id,
                'office' => $sec->office,
                'organ'  => $sec->organ ? [
                    'id'   => $sec->organ->id,
                    'name' => $sec->organ->name,
                    'type' => $sec->organ->type,
                ] : null,
            ];
        }

        // admin_profiles → organ (nullable — acesso global ou por órgão)
        if (in_array('admin', $roles) && $adm = $user->adminProfile) {
            $profiles['admin'] = [
                'id'           => $adm->id,
                'access_scope' => $adm->access_scope,
                'organ'        => $adm->organ ? [
                    'id'   => $adm->organ->id,
                    'name' => $adm->organ->name,
                ] : null,
            ];
        }

        // reviewer — usa teacher_profile, sem tabela própria
        // A role 'reviewer' acede ao perfil de docente
        if (in_array('reviewer', $roles) && !isset($profiles['teacher']) && $tp = $user->teacherProfile) {
            $profiles['reviewer'] = [
                'id'              => $tp->id,
                'department'      => $tp->department,
                'scientific_area' => $tp->scientificArea?->name,
            ];
        }

        return $profiles;
    }
}