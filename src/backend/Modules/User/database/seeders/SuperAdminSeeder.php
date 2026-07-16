<?php

namespace Modules\User\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Administrador Técnico (Super Admin) — Nível 1 da hierarquia.
 *
 *   - Não faz parte do fluxo académico.
 *   - Não é criado via registo público nem por nenhum outro admin.
 *   - Credenciais definidas por variáveis de ambiente (nunca hardcoded em produção).
 *   - access_scope = 'global' no AdminProfile.
 *
 * Correr apenas uma vez por ambiente. Idempotente via updateOrInsert.
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $email    = env('SUPER_ADMIN_EMAIL', 'superadmin@iscisa.ac.mz');
        $password = env('SUPER_ADMIN_PASSWORD');

        if (! $password) {
            $this->command?->warn(
                'SUPER_ADMIN_PASSWORD não definida no .env — a usar password temporária. MUDE-A imediatamente após o primeiro login.'
            );
            $password = 'MudeEstaPassword!123';
        }

        DB::table('users')->updateOrInsert(
            ['email' => $email],
            [
                'name'              => 'Administrador Técnico',
                'email'             => $email,
                'password'          => Hash::make($password),
                'status'            => 'active',
                'created_at'        => $now,
                'updated_at'        => $now,
            ]
        );

        $userId = DB::table('users')->where('email', $email)->value('id');
        $roleId = DB::table('roles')->where('name', 'admin')->value('id');

        if (! $roleId) {
            throw new \RuntimeException("Role 'admin' não encontrada — corre o RoleSeeder primeiro.");
        }

        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $userId, 'role_id' => $roleId],
            ['created_at' => $now, 'updated_at' => $now]
        );

        DB::table('admin_profiles')->updateOrInsert(
            ['user_id' => $userId],
            [
                'organ_id'     => null,
                'access_scope' => 'global',
                'created_at'   => $now,
                'updated_at'   => $now,
            ]
        );

        $this->command?->info("Administrador Técnico pronto: {$email}");
    }
}