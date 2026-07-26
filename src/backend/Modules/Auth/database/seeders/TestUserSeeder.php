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
            ['name' => 'Maria Coordenadora', 'email' => 'coord@iscisa.ac.mz',                 'roles' => ['docente']],
            ['name' => 'João Docente',        'email' => 'docente@iscisa.ac.mz',              'roles' => ['docente']],
            ['name' => 'Ana Revisora',        'email' => 'revisora@iscisa.ac.mz',             'roles' => ['docente']],
            ['name' => 'Pedro Secretário',    'email' => 'secretario@iscisa.ac.mz',           'roles' => ['secretaria']],
            ['name' => 'Sofia Estudante',     'email' => 'estudante@iscisa.ac.mz',            'roles' => ['estudante']],
            ['name' => 'Secretário de Enfermagem', 'email' => 'secretario.enfermagem@iscisa.ac.mz',   'roles' => ['secretaria']],
            ['name' => 'Secretário de Reabilitação', 'email' => 'secretario.reabilitacao@iscisa.ac.mz', 'roles' => ['secretaria']],
            ['name' => 'Docente Científico 1', 'email' => 'docente.cientifico1@iscisa.ac.mz',   'roles' => ['docente']],
            ['name' => 'Docente Científico 2', 'email' => 'docente.cientifico2@iscisa.ac.mz',   'roles' => ['docente']],
            ['name' => 'Revisor Científico 1', 'email' => 'revisor.cientifico1@iscisa.ac.mz',   'roles' => ['docente']],
            ['name' => 'Revisor Científico 2', 'email' => 'revisor.cientifico2@iscisa.ac.mz',   'roles' => ['docente']],
            ['name' => 'Docente de Bioética 1', 'email' => 'docente.bioetica1@iscisa.ac.mz',    'roles' => ['docente']],
            ['name' => 'Docente de Bioética 2', 'email' => 'docente.bioetica2@iscisa.ac.mz',    'roles' => ['docente']],
            ['name' => 'Revisor de Bioética 1', 'email' => 'revisor.bioetica1@iscisa.ac.mz',    'roles' => ['docente']],
            ['name' => 'Revisor de Bioética 2', 'email' => 'revisor.bioetica2@iscisa.ac.mz',    'roles' => ['docente']],
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

                DB::table('model_has_roles')->updateOrInsert(
                    [
                        'role_id'    => $roleId,
                        'model_type' => \Modules\Auth\App\Models\User::class,
                        'model_id'   => $userId,
                    ],
                    []
                );
            }
        }
    }
}