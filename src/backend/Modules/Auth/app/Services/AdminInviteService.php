<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\User\app\Models\User;
use RuntimeException;

class AdminInviteService
{
    public function __construct(
        private BrevoMailerService $mailer,
        private PasswordService $passwordService,
    ) {}

    public function invite(array $data): User
{
    return DB::transaction(function () use ($data) {

        $user = User::create([
            'name'                => $data['name'],
            'email'               => $data['email'],
            'password'            => Hash::make(Str::random(32)),
            'status'              => 'pending',
            'must_reset_password' => true,
        ]);

        $roleId = DB::table('roles')
            ->where('name', 'admin')
            ->value('id');

        if (!$roleId) {
            throw new RuntimeException("Role admin não encontrada.");
        }

        DB::table('user_roles')->insert([
            'user_id' => $user->id,
            'role_id' => $roleId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user->adminProfile()->create([
            'access_scope' => 'organ',
            'organ_id' => $data['organ_id'],
        ]);

        $plainToken = $this->passwordService->createToken($user->email);

        $link = rtrim(config('app.frontend_url'), '/')
            . '/reset-password?email='
            . urlencode($user->email)
            . '&token='
            . $plainToken;

        $this->mailer->send(
            ['email' => $user->email, 'name' => $user->name],
            'Bem-vindo ao SGPMC-ISCISA — Defina a sua senha',
            view('auth::emails.admin-invite', [
                'name' => $user->name,
                'link' => $link,
                'ttlMinutes' => 60,
            ])->render()
        );

        return $user;
    });
}

}