<?php

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $roles = [
            'student' => [
                'description' => 'Estudante - submete temas, protocolos e monografias',
                'permissions' => [
                    'topic.create', 'topic.view', 'topic.resubmit',
                    'protocol.create', 'protocol.submit', 'protocol.view', 'protocol.resubmit',
                    'document.upload', 'document.view', 'document.resubmit',
                    'evaluation.view.own', 'monograph.submit', 'monograph.view',
                ],
            ],
            'teacher' => [
                'description' => 'Docente - participa em juri e acompanha a carga de trabalho',
                'permissions' => [
                    'document.view', 'workload.view', 'defense.view',
                    'defense.jury.participate', 'reports.view',
                ],
            ],
            'supervisor' => [
                'description' => 'Supervisor - orienta tutorandos e valida submissões',
                'permissions' => [
                    'supervision.approve', 'supervision.view', 'supervision.comment',
                    'document.view', 'workload.view', 'defense.view',
                    'defense.jury.participate', 'reports.view',
                ],
            ],
            'reviewer' => [
                'description' => 'Revisor - avalia temas e protocolos',
                'permissions' => [
                    'topic.review', 'protocol.review', 'protocol.evaluate',
                    'evaluation.create', 'evaluation.accept', 'evaluation.harmonize',
                    'evaluation.view', 'document.view', 'workload.view',
                ],
            ],
            'coordinator' => [
                'description' => 'Coordenador - gere revisores, defesas e relatórios',
                'permissions' => [
                    'protocol.view.all', 'protocol.assign', 'protocol.forward', 'protocol.return', 'protocol.approve',
                    'topic.view.all', 'topic.review', 'document.view.all', 'document.validate',
                    'evaluation.view.all', 'reviewer.manage', 'reviewer.assign',
                    'workload.view', 'workload.view.all', 'defense.view', 'defense.schedule',
                    'defense.jury.assign', 'defense.grade.record', 'defense.minutes.upload',
                    'monograph.view.all', 'monograph.validate',
                    'reports.view', 'reports.view.all', 'reports.export',
                ],
            ],
            'secretary' => [
                'description' => 'Secretário - faz triagem e gestão administrativa do órgão',
                'permissions' => [
                    'protocol.view.all', 'protocol.triage', 'protocol.assign', 'protocol.forward', 'protocol.return',
                    'topic.view.all', 'document.view.all', 'document.validate', 'evaluation.view.all',
                    'reviewer.manage', 'reviewer.assign', 'workload.view.all', 'defense.view',
                    'monograph.view.all', 'monograph.validate', 'reports.view',
                ],
            ],
            'admin' => [
                'description' => 'Administrador - gere utilizadores, órgãos e sistema',
                'permissions' => [
                    'admin.users', 'admin.organs', 'admin.reports', 'admin.roles', 'admin.settings',
                    'reports.view.all', 'reports.export', 'workload.view.all',
                ],
            ],
        ];

        foreach ($roles as $name => $data) {
            DB::table('roles')->updateOrInsert(
                ['name' => $name],
                [
                    'description' => $data['description'],
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $permissionCodes = array_values(array_unique(array_merge(
            ...array_column($roles, 'permissions')
        )));

        foreach ($permissionCodes as $code) {
            DB::table('permissions')->updateOrInsert(
                ['code' => $code],
                [
                    'description' => $code,
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        foreach ($roles as $name => $data) {
            $roleId = DB::table('roles')->where('name', $name)->value('id');

            foreach ($data['permissions'] as $code) {
                $permissionId = DB::table('permissions')->where('code', $code)->value('id');

                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permissionId],
                    [
                        'deleted_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        $teacherRoleIds = DB::table('roles')
            ->whereIn('name', ['teacher', 'supervisor'])
            ->whereNull('deleted_at')
            ->pluck('id');

        $teacherUserIds = DB::table('teacher_profiles')
            ->whereNull('deleted_at')
            ->pluck('user_id');

        foreach ($teacherUserIds as $userId) {
            foreach ($teacherRoleIds as $roleId) {
                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $userId, 'role_id' => $roleId],
                    [
                        'deleted_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}
