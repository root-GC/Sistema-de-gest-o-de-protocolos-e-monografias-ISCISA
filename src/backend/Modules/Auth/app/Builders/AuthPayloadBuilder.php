<?php

namespace Modules\Auth\app\Builders;

use Modules\User\app\Models\User;
use Illuminate\Support\Facades\Log;
/**
 * AuthPayloadBuilder — SGPMC-ISCISA
 *
 * Monta o payload de autenticação com base EXCLUSIVAMENTE
 * nas tabelas existentes na DB:
 *   users, roles, permissions, user_roles, role_permissions,
 *   teacher_profiles, student_profiles, coordinator_profiles,
 *   secretary_profiles, admin_profiles,
 *   scientific_areas, courses, organs
 *
 * Roles suportadas (com perfil distinto):
 *   student     → student_profiles
 *   teacher     → teacher_profiles  (docente genérico)
 *   supervisor  → teacher_profiles  (mesma tabela, role distinta)
 *   reviewer    → teacher_profiles  (avaliador de órgão)
 *   coordinator → coordinator_profiles
 *   secretary   → secretary_profiles
 *   admin       → admin_profiles
 */
class AuthPayloadBuilder
{
    public function build(User $user): array
    {

    Log::info('[PAYLOAD]', [
        'step' => 'build_start',
        'user_id' => $user->id ?? null,
    ]);

        // Uma query com eager loading — sem N+1
        $user->load([
            'roles.permissions',
            'teacherProfile.scientificArea',
            'studentProfile.course',
            'coordinatorProfile.course',
            'coordinatorProfile.scientificArea',
            'secretaryProfile.organ',
            'adminProfile.organ',
        ]);

        $roles = $user->roles->pluck('name')->toArray();

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

        // ── teacher_profiles (teacher, supervisor, reviewer partilham) ──
        $tp = $user->teacherProfile;

        if ($tp) {
            $teacherData = [
                'id'              => $tp->id,
                'department'      => $tp->department,
                'academic_degree' => $tp->academic_degree,
                'is_internal'     => (bool) $tp->is_Internal,
                'scientific_area' => $tp->scientificArea
                    ? ['id' => $tp->scientificArea->id, 'name' => $tp->scientificArea->name]
                    : null,
            ];

            if (in_array('teacher', $roles))    $profiles['teacher']    = $teacherData;
            // supervisor usa teacher_profile + indica que pode validar submissões
            if (in_array('supervisor', $roles)) $profiles['supervisor'] = $teacherData;
            // reviewer usa teacher_profile + filtragem por grau académico (RF-061)
            if (in_array('reviewer', $roles))   $profiles['reviewer']   = $teacherData;
        }

        // ── student_profiles ────────────────────────────────────────────
        if (in_array('student', $roles) && $sp = $user->studentProfile) {
            $profiles['student'] = [
                'id'             => $sp->id,
                'student_number' => $sp->student_number,
                'supervisor_id'  => $sp->supervisor_id,
                'course'         => $sp->course
                    ? ['id' => $sp->course->id, 'name' => $sp->course->name]
                    : null,
            ];
        }

        // ── coordinator_profiles ─────────────────────────────────────────
        if (in_array('coordinator', $roles) && $cp = $user->coordinatorProfile) {
            $profiles['coordinator'] = [
                'id'              => $cp->id,
                'office'          => $cp->office,
                'course'          => $cp->course
                    ? ['id' => $cp->course->id, 'name' => $cp->course->name]
                    : null,
                'scientific_area' => $cp->scientificArea
                    ? ['id' => $cp->scientificArea->id, 'name' => $cp->scientificArea->name]
                    : null,
            ];
        }

        // ── secretary_profiles ───────────────────────────────────────────
        if (in_array('secretary', $roles) && $sec = $user->secretaryProfile) {
            $profiles['secretary'] = [
                'id'     => $sec->id,
                'office' => $sec->office,
                'organ'  => $sec->organ
                    ? ['id' => $sec->organ->id, 'name' => $sec->organ->name, 'type' => $sec->organ->type]
                    : null,
            ];
        }

        // ── admin_profiles ───────────────────────────────────────────────
        if (in_array('admin', $roles) && $adm = $user->adminProfile) {
            $profiles['admin'] = [
                'id'           => $adm->id,
                'access_scope' => $adm->access_scope,  // global | organ
                'organ'        => $adm->organ
                    ? ['id' => $adm->organ->id, 'name' => $adm->organ->name]
                    : null,
            ];
        }
    Log::info('[PAYLOAD]', [
    'step' => 'loading_relations',
]);
        return $profiles;
    }
}