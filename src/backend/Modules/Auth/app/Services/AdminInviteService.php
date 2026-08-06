<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\User\app\Models\User;

class AdminInviteService
{
    public function __construct(
        private BrevoMailerService $mailer,
        private PasswordService $passwordService,
    ) {}

    public function invite(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name'                => $data['name'],
                'email'               => $data['email'],
                'password'            => Hash::make(Str::random(32)),
                'status'              => 'pending',
                'must_reset_password' => true,
            ]);

            $roleId = DB::table('roles')->where('name', 'admin')->value('id');
            if (! $roleId) throw new \RuntimeException("Role 'admin' não encontrada — corre o RoleSeeder.");

            DB::table('user_roles')->insert([
                'user_id' => $user->id, 'role_id' => $roleId,
                'created_at' => now(), 'updated_at' => now(),
            ]);

            $user->adminProfile()->create([
                'access_scope' => 'organ', // imposto aqui, nunca vindo do request
                'organ_id'     => $data['organ_id'],
            ]);

            return $user;
        });

        try {
            $plainToken = $this->passwordService->createToken($user->email);
            $link = rtrim(config('app.frontend_url'), '/')
                . '/reset-password?email=' . urlencode($user->email)
                . '&token=' . $plainToken;

            $this->mailer->send(
                ['email' => $user->email, 'name' => $user->name],
                'Bem-vindo ao SGPMC-ISCISA — Defina a sua senha',
                view('auth::emails.admin-invite', ['name' => $user->name, 'link' => $link, 'ttlMinutes' => 60])->render()
            );
        } catch (\Throwable $e) {
            Log::error('[AdminInviteService] falha ao enviar convite', ['email' => $user->email, 'error' => $e->getMessage()]);
            $this->rollbackUser($user);
            throw new \RuntimeException('Não foi possível enviar o email de convite. Detalhe: ' . $e->getMessage());
        }

        return $user;
    }

    private function rollbackUser(User $user): void
    {
        DB::transaction(function () use ($user) {
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $user->adminProfile()?->delete();
            DB::table('user_roles')->where('user_id', $user->id)->delete();
            $user->forceDelete();
        });
    }
}