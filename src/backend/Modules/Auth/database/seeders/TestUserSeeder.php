<?php

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\{DB, Hash};

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        $users = [
            ['name' => 'Admin Sistema',      'email' => 'admin@iscisa.ac.mz',                'roles' => ['admin']],
            ['name' => 'Maria Coordenadora', 'email' => 'coord@iscisa.ac.mz',                 'roles' => ['teacher', 'supervisor', 'coordinator']],
            ['name' => 'João Docente',        'email' => 'docente@iscisa.ac.mz',              'roles' => ['teacher', 'supervisor']],
            ['name' => 'Ana Revisora',        'email' => 'revisora@iscisa.ac.mz',             'roles' => ['teacher', 'reviewer']],
            ['name' => 'Pedro Secretário',    'email' => 'secretario@iscisa.ac.mz',           'roles' => ['secretary']],
            ['name' => 'Sofia Estudante',     'email' => 'estudante@iscisa.ac.mz',            'roles' => ['student']],
            ['name' => 'Secretário de Enfermagem', 'email' => 'secretario.enfermagem@iscisa.ac.mz',   'roles' => ['secretary']],
            ['name' => 'Secretário de Reabilitação', 'email' => 'secretario.reabilitacao@iscisa.ac.mz', 'roles' => ['secretary']],
            ['name' => 'Docente Científico 1', 'email' => 'docente.cientifico1@iscisa.ac.mz',   'roles' => ['teacher']],
            ['name' => 'Docente Científico 2', 'email' => 'docente.cientifico2@iscisa.ac.mz',   'roles' => ['teacher']],
            ['name' => 'Revisor Científico 1', 'email' => 'revisor.cientifico1@iscisa.ac.mz',   'roles' => ['teacher', 'reviewer']],
            ['name' => 'Revisor Científico 2', 'email' => 'revisor.cientifico2@iscisa.ac.mz',   'roles' => ['teacher', 'reviewer']],
            ['name' => 'Docente de Bioética 1', 'email' => 'docente.bioetica1@iscisa.ac.mz',    'roles' => ['teacher']],
            ['name' => 'Docente de Bioética 2', 'email' => 'docente.bioetica2@iscisa.ac.mz',    'roles' => ['teacher']],
            ['name' => 'Revisor de Bioética 1', 'email' => 'revisor.bioetica1@iscisa.ac.mz',    'roles' => ['teacher', 'reviewer']],
            ['name' => 'Revisor de Bioética 2', 'email' => 'revisor.bioetica2@iscisa.ac.mz',    'roles' => ['teacher', 'reviewer']],
        ];

        foreach ($users as $data) {
            $userId = DB::table('users')->where('email', $data['email'])->value('id');

            if (!$userId) {
                $userId = DB::table('users')->insertGetId([
                    'name'       => $data['name'],
                    'email'      => $data['email'],
                    'password'   => $password,
                    'status'     => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            foreach ($data['roles'] as $roleName) {
                $roleId = DB::table('roles')->where('name', $roleName)->value('id');

                if (!$roleId) {
                    throw new \Exception("Role não encontrada: {$roleName}");
                }

                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $userId, 'role_id' => $roleId],
                    ['created_at' => $now, 'updated_at' => $now]
                );
            }
        }
    }
}