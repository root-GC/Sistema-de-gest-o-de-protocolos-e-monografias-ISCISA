<?php

namespace Modules\User\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class OrganAdminsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        DB::table('roles')->updateOrInsert(
            ['name' => 'admin'],
            [
                'description' => 'Administrador técnico global',
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $roleId = DB::table('roles')->where('name', 'admin')->value('id');

        $admins = [
            [
                'name' => 'Admin Comité Científico',
                'email' => 'admin.comite.cientifico@iscisa.ac.mz',
                'organ' => 'Comité Científico',
            ],
            [
                'name' => 'Admin Comité de Bioética',
                'email' => 'admin.comite.bioetica@iscisa.ac.mz',
                'organ' => 'Comité de Bioética',
            ],
            [
                'name' => 'Admin Núcleo de Medicina',
                'email' => 'admin.nucleo.medicina@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Medicina',
            ],
            [
                'name' => 'Admin Núcleo de Saúde Pública',
                'email' => 'admin.nucleo.saude.publica@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Saúde Pública',
            ],
            [
                'name' => 'Admin Núcleo de Enfermagem',
                'email' => 'admin.nucleo.enfermagem@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Enfermagem',
            ],
            [
                'name' => 'Admin Núcleo de Reabilitação',
                'email' => 'admin.nucleo.reabilitacao@iscisa.ac.mz',
                'organ' => 'Núcleo Científico de Reabilitação',
            ],
        ];

        foreach ($admins as $admin) {
            $organId = DB::table('organs')->where('name', $admin['organ'])->value('id');

            if (! $organId) {
                throw new RuntimeException("Órgão não encontrado: {$admin['organ']}");
            }

            DB::table('users')->updateOrInsert(
                ['email' => $admin['email']],
                [
                    'name' => $admin['name'],
                    'password' => $password,
                    'status' => 'active',
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ] + (Schema::hasColumn('users', 'must_reset_password') ? ['must_reset_password' => false] : [])
            );

            $userId = DB::table('users')->where('email', $admin['email'])->value('id');

            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $userId, 'role_id' => $roleId],
                [
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            DB::table('admin_profiles')->updateOrInsert(
                ['user_id' => $userId],
                [
                    'organ_id' => $organId,
                    'access_scope' => 'organ',
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
