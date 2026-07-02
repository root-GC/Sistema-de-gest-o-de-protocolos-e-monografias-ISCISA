<?php

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Utilizadores de teste — um por role principal.
 * APENAS para ambiente de desenvolvimento.
 * Password padrão: password123
 */
class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        $users = [
            ['name' => 'Admin Sistema',      'email' => 'admin@iscisa.ac.mz',       'roles' => ['admin']],
            ['name' => 'Maria Coordenadora', 'email' => 'coord@iscisa.ac.mz',        'roles' => ['teacher', 'supervisor', 'coordinator']],
            ['name' => 'João Docente',        'email' => 'docente@iscisa.ac.mz',     'roles' => ['teacher', 'supervisor']],
            ['name' => 'Ana Revisora',        'email' => 'revisora@iscisa.ac.mz',    'roles' => ['teacher', 'reviewer']],
            ['name' => 'Pedro Secretário',    'email' => 'secretario@iscisa.ac.mz',  'roles' => ['secretary']],
            ['name' => 'Sofia Estudante',     'email' => 'estudante@iscisa.ac.mz',   'roles' => ['student']],
        ];

        foreach ($users as $data) {
            $userId = DB::table('users')->insertGetId([
                'name'       => $data['name'],
                'email'      => $data['email'],
                'password'   => $password,
                'status'     => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($data['roles'] as $roleName) {
                $roleId = DB::table('roles')->where('name', $roleName)->value('id');
                if (! $roleId) {
                    throw new \Exception("Role não encontrada: $roleName");
                }
                if ($roleId) {
                    DB::table('user_roles')->insertOrIgnore([
                        'user_id'    => $userId,
                        'role_id'    => $roleId,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        // $this->command->info('Utilizadores de teste criados.');
        // $this->command->line('  Password para todos: password123');
    }
}
