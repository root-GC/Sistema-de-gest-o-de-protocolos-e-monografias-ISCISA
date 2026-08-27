<?php

namespace Modules\User\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class ScientificDirectionAdminSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $email = 'Dulnerio@gmail.com';

        $organId = DB::table('organs')
            ->where('type', 'scientific_direction')
            ->where('name', 'Direção Científica')
            ->value('id');

        if (! $organId) {
            throw new RuntimeException('Órgão Direção Científica não encontrado. Execute o OrganSeeder antes.');
        }

        DB::table('users')->updateOrInsert(
            ['email' => $email],
            [
                'name' => 'Dulnerio sengo',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'email_verified_at' => $now,
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ] + (Schema::hasColumn('users', 'must_reset_password') ? ['must_reset_password' => false] : [])
        );

        DB::table('roles')->updateOrInsert(
            ['name' => 'admin'],
            [
                'description' => 'Administrador técnico global',
                'deleted_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $userId = DB::table('users')->where('email', $email)->value('id');
        $roleId = DB::table('roles')->where('name', 'admin')->value('id');

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
