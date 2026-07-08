<?php

namespace Modules\Organization\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CommitteeMembersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        $resolveRoleId = fn(string $name) => DB::table('roles')->where('name', $name)->value('id');
        $resolveOrganId = fn(string $type) => DB::table('organs')->where('type', $type)->value('id');
        $resolveAreaId = fn(string $name) => DB::table('scientific_areas')->where('name', $name)->value('id');
        $nucleusOrganId = $resolveOrganId('nucleus');

        $users = [
            [
                'name' => 'Secretário Científico',
                'email' => 'secretario.cientifico@iscisa.ac.mz',
                'roles' => ['secretary'],
                'profile' => ['type' => 'secretary', 'organ_type' => 'scientific_committee', 'office' => 'Secretaria do Comitê Científico'],
            ],
            [
                'name' => 'Secretário de Bioética',
                'email' => 'secretario.bioetica@iscisa.ac.mz',
                'roles' => ['secretary'],
                'profile' => ['type' => 'secretary', 'organ_type' => 'bioethics_committee', 'office' => 'Secretaria do Comitê de Bioética'],
            ],
            [
                'name' => 'Docente Científico 1',
                'email' => 'docente.cientifico1@iscisa.ac.mz',
                'roles' => ['teacher'],
                'profile' => ['type' => 'teacher', 'area' => 'Saúde Pública', 'department' => 'Núcleo Científico', 'degree' => 'doutoramento', 'organ_role' => 'member'],
            ],
            [
                'name' => 'Docente Científico 2',
                'email' => 'docente.cientifico2@iscisa.ac.mz',
                'roles' => ['teacher'],
                'profile' => ['type' => 'teacher', 'area' => 'Enfermagem', 'department' => 'Núcleo Científico', 'degree' => 'mestrado', 'organ_role' => 'member'],
            ],
            [
                'name' => 'Revisor Científico 1',
                'email' => 'revisor.cientifico1@iscisa.ac.mz',
                'roles' => ['teacher', 'reviewer'],
                'profile' => ['type' => 'teacher', 'area' => 'Saúde Pública', 'department' => 'Núcleo Científico', 'degree' => 'doutoramento', 'organ_role' => 'reviewer'],
            ],
            [
                'name' => 'Revisor Científico 2',
                'email' => 'revisor.cientifico2@iscisa.ac.mz',
                'roles' => ['teacher', 'reviewer'],
                'profile' => ['type' => 'teacher', 'area' => 'Enfermagem', 'department' => 'Núcleo Científico', 'degree' => 'mestrado', 'organ_role' => 'reviewer'],
            ],
            [
                'name' => 'Docente de Bioética 1',
                'email' => 'docente.bioetica1@iscisa.ac.mz',
                'roles' => ['teacher'],
                'profile' => ['type' => 'teacher', 'area' => 'Reabilitação', 'department' => 'Núcleo Científico', 'degree' => 'doutoramento', 'organ_role' => 'member'],
            ],
            [
                'name' => 'Docente de Bioética 2',
                'email' => 'docente.bioetica2@iscisa.ac.mz',
                'roles' => ['teacher'],
                'profile' => ['type' => 'teacher', 'area' => 'Farmácia e Ciências Laboratoriais', 'department' => 'Núcleo Científico', 'degree' => 'mestrado', 'organ_role' => 'member'],
            ],
            [
                'name' => 'Revisor de Bioética 1',
                'email' => 'revisor.bioetica1@iscisa.ac.mz',
                'roles' => ['teacher', 'reviewer'],
                'profile' => ['type' => 'teacher', 'area' => 'Reabilitação', 'department' => 'Núcleo Científico', 'degree' => 'doutoramento', 'organ_role' => 'reviewer'],
            ],
            [
                'name' => 'Revisor de Bioética 2',
                'email' => 'revisor.bioetica2@iscisa.ac.mz',
                'roles' => ['teacher', 'reviewer'],
                'profile' => ['type' => 'teacher', 'area' => 'Farmácia e Ciências Laboratoriais', 'department' => 'Núcleo Científico', 'degree' => 'mestrado', 'organ_role' => 'reviewer'],
            ],
        ];

        foreach ($users as $data) {
            DB::table('users')->updateOrInsert(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => $password,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $userId = DB::table('users')->where('email', $data['email'])->value('id');

            foreach ($data['roles'] as $roleName) {
                $roleId = $resolveRoleId($roleName);

                if (! $roleId) {
                    continue;
                }

                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $userId, 'role_id' => $roleId],
                    ['created_at' => $now, 'updated_at' => $now]
                );
            }

            if ($data['profile']['type'] === 'secretary') {
                $organId = $resolveOrganId($data['profile']['organ_type']);

                DB::table('secretary_profiles')->updateOrInsert(
                    ['user_id' => $userId],
                    [
                        'user_id' => $userId,
                        'organ_id' => $organId,
                        'office' => $data['profile']['office'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                DB::table('organ_members')->updateOrInsert(
                    ['organ_id' => $organId, 'user_id' => $userId],
                    [
                        'organ_id' => $organId,
                        'user_id' => $userId,
                        'role' => 'secretary',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                continue;
            }

            $areaId = $resolveAreaId($data['profile']['area']);

            DB::table('teacher_profiles')->updateOrInsert(
                ['user_id' => $userId],
                [
                    'user_id' => $userId,
                    'scientific_area_id' => $areaId,
                    'department' => $data['profile']['department'],
                    'academic_degree' => $data['profile']['degree'],
                    'is_internal' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('organ_members')->updateOrInsert(
                ['organ_id' => $nucleusOrganId, 'user_id' => $userId],
                [
                    'organ_id' => $nucleusOrganId,
                    'user_id' => $userId,
                    'role' => $data['profile']['organ_role'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
