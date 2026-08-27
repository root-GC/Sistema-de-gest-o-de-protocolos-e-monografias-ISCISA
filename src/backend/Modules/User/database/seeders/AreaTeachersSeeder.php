<?php

namespace Modules\User\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

class AreaTeachersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        DB::table('roles')->updateOrInsert(
            ['name' => 'teacher'],
            [
                'description' => 'Docente',
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'supervisor'],
            [
                'description' => 'Supervisor - orienta tutorandos e valida submissões',
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $teacherPermissions = [
            'document.view',
            'workload.view',
            'defense.view',
            'defense.jury.participate',
            'reports.view',
        ];

        $supervisorPermissions = array_merge($teacherPermissions, [
            'supervision.approve',
            'supervision.view',
            'supervision.comment',
        ]);

        $permissions = array_values(array_unique(array_merge(
            $teacherPermissions,
            $supervisorPermissions,
        )));

        foreach ($permissions as $code) {
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

        $teacherRoleId = DB::table('roles')->where('name', 'teacher')->value('id');
        $supervisorRoleId = DB::table('roles')->where('name', 'supervisor')->value('id');

        foreach ($teacherPermissions as $code) {
            $permissionId = DB::table('permissions')->where('code', $code)->value('id');

            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $teacherRoleId, 'permission_id' => $permissionId],
                [
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        foreach ($supervisorPermissions as $code) {
            $permissionId = DB::table('permissions')->where('code', $code)->value('id');

            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $supervisorRoleId, 'permission_id' => $permissionId],
                [
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $areas = [
            'Medicina' => [
                'prefix' => 'medicina',
                'department' => 'Departamento de Medicina',
            ],
            'Saúde Pública' => [
                'prefix' => 'saude.publica',
                'department' => 'Departamento de Saúde Pública',
            ],
            'Enfermagem' => [
                'prefix' => 'enfermagem',
                'department' => 'Departamento de Enfermagem',
            ],
            'Reabilitação' => [
                'prefix' => 'reabilitacao',
                'department' => 'Departamento de Reabilitação',
            ],
        ];

        foreach ($areas as $areaName => $data) {
            $areaId = DB::table('scientific_areas')->where('name', $areaName)->value('id');

            if (! $areaId) {
                throw new RuntimeException("Área científica não encontrada: {$areaName}");
            }

            $courses = DB::table('courses')
                ->where('scientific_area_id', $areaId)
                ->orderBy('code')
                ->get(['id', 'name', 'code']);

            if ($courses->count() !== 5) {
                throw new RuntimeException("A área {$areaName} deve ter exatamente 5 cursos.");
            }

            $number = 0;

            foreach ($courses as $course) {
                for ($teacherNumber = 1; $teacherNumber <= 2; $teacherNumber++) {
                    $number++;
                    $legacyEmail = sprintf('docente.%s.%02d@iscisa.ac.mz', $data['prefix'], $number);
                    $abbreviatedEmail = sprintf('docente.%s.%02d@iscisa.ac.mz', strtolower($course->code), $teacherNumber);
                    $email = sprintf(
                        'docente.%s.%02d@iscisa.ac.mz',
                        Str::slug($course->name, '.'),
                        $teacherNumber
                    );
                    $degree = match ($number % 3) {
                        1 => 'mestrado',
                        2 => 'doutoramento',
                        default => 'licenciatura',
                    };

                    // Mantém os mesmos 40 docentes já criados por versões anteriores do seeder.
                    foreach (array_unique([$legacyEmail, $abbreviatedEmail]) as $previousEmail) {
                        if ($previousEmail !== $email && !DB::table('users')->where('email', $email)->exists()) {
                            DB::table('users')
                                ->where('email', $previousEmail)
                                ->update(['email' => $email, 'updated_at' => $now]);
                        }
                    }

                    DB::table('users')->updateOrInsert(
                        ['email' => $email],
                        [
                            'name' => sprintf('Docente %s %02d', $course->name, $teacherNumber),
                            'password' => $password,
                            'status' => 'active',
                            'email_verified_at' => $now,
                            'deleted_at' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ] + (Schema::hasColumn('users', 'must_reset_password') ? ['must_reset_password' => false] : [])
                    );

                    $userId = DB::table('users')->where('email', $email)->value('id');

                    DB::table('user_roles')->updateOrInsert(
                        ['user_id' => $userId, 'role_id' => $teacherRoleId],
                        [
                            'deleted_at' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );

                    DB::table('user_roles')->updateOrInsert(
                        ['user_id' => $userId, 'role_id' => $supervisorRoleId],
                        [
                            'deleted_at' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );

                    DB::table('teacher_profiles')->updateOrInsert(
                        ['user_id' => $userId],
                        [
                            'scientific_area_id' => $areaId,
                            'course_id' => $course->id,
                            'department' => $data['department'],
                            'academic_degree' => $degree,
                            'is_internal' => true,
                            'deleted_at' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }
        }
    }
}
