<?php

namespace Modules\User\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class OrganSecretariesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        DB::table('roles')->updateOrInsert(
            ['name' => 'secretary'],
            [
                'description' => 'Secretário do órgão',
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $permissions = [
            'protocol.view.all',
            'protocol.triage',
            'protocol.assign',
            'protocol.forward',
            'protocol.return',
            'topic.view.all',
            'document.view.all',
            'document.validate',
            'evaluation.view.all',
            'reviewer.manage',
            'reviewer.assign',
            'workload.view.all',
            'defense.view',
            'monograph.view.all',
            'monograph.validate',
            'reports.view',
        ];

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

        $roleId = DB::table('roles')->where('name', 'secretary')->value('id');

        foreach ($permissions as $code) {
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

        $secretaries = [
            [
                'name' => 'Secretário Comité Científico',
                'email' => 'secretario.comite.cientifico@iscisa.ac.mz',
                'organ' => 'Comité Científico',
                'office' => 'Secretaria do Comité Científico',
            ],
            [
                'name' => 'Secretário Comité de Bioética',
                'email' => 'secretario.comite.bioetica@iscisa.ac.mz',
                'organ' => 'Comité de Bioética',
                'office' => 'Secretaria do Comité de Bioética',
            ],
            [
                'name' => 'Secretário Núcleo de Medicina',
                'email' => 'secretario.nucleo.medicina@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Medicina',
                'office' => 'Secretaria do Núcleo de Medicina',
            ],
            [
                'name' => 'Secretário Núcleo de Saúde Pública',
                'email' => 'secretario.nucleo.saude.publica@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Saúde Pública',
                'office' => 'Secretaria do Núcleo de Saúde Pública',
            ],
            [
                'name' => 'Secretário Núcleo de Enfermagem',
                'email' => 'secretario.nucleo.enfermagem@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Enfermagem',
                'office' => 'Secretaria do Núcleo de Enfermagem',
            ],
            [
                'name' => 'Secretário Núcleo de Reabilitação',
                'email' => 'secretario.nucleo.reabilitacao@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Reabilitação',
                'office' => 'Secretaria do Núcleo de Reabilitação',
            ],
        ];

        foreach ($secretaries as $secretary) {
            $organId = DB::table('organs')->where('name', $secretary['organ'])->value('id');

            if (! $organId) {
                throw new RuntimeException("Órgão não encontrado: {$secretary['organ']}");
            }

            DB::table('users')->updateOrInsert(
                ['email' => $secretary['email']],
                [
                    'name' => $secretary['name'],
                    'password' => $password,
                    'status' => 'active',
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ] + (Schema::hasColumn('users', 'must_reset_password') ? ['must_reset_password' => false] : [])
            );

            $userId = DB::table('users')->where('email', $secretary['email'])->value('id');

            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $userId, 'role_id' => $roleId],
                [
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('secretary_profiles')->updateOrInsert(
                ['user_id' => $userId],
                [
                    'organ_id' => $organId,
                    'scientific_area_id' => null,
                    'office' => $secretary['office'],
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
