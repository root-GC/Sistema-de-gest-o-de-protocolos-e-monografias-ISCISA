<?php

namespace Modules\Password\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Password\app\Notifications\ResetPasswordNotification;
use Modules\User\app\Models\User;

class PasswordResetService
{
    private int $expiresInMinutes = 60;

    public function sendResetLink(User $user): void
    {
        // Apagar tokens anteriores do mesmo email
        DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->delete();

        $token = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email'      => $user->email,
            'token'      => hash('sha256', $token), // guardar hash, não plain text
            'created_at' => now(),
        ]);

        $user->notify(new ResetPasswordNotification($token));
    }

    public function tokenIsValid(string $token): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('token', hash('sha256', $token))
            ->first();

        if (! $record) return false;

        return now()->diffInMinutes($record->created_at) < $this->expiresInMinutes;
    }

    public function getUserByToken(string $token): ?User
    {
        if (! $this->tokenIsValid($token)) return null;

        $record = DB::table('password_reset_tokens')
            ->where('token', hash('sha256', $token))
            ->first();

        return User::where('email', $record->email)->first();
    }

    public function deleteToken(string $token): void
    {
        DB::table('password_reset_tokens')
            ->where('token', hash('sha256', $token))
            ->delete();
    }
}