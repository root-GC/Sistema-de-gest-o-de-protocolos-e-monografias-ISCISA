<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Auth\app\Notifications\ResetPasswordNotification;
use Modules\User\app\Models\User;

class PasswordService
{
    private int $expiresMinutes = 60;

    // ── Forgot ────────────────────────────────────────────────────────

    public function sendResetLink(string $email): void
    {
        $user = User::where('email', $email)->where('status', 'active')->first();

        // Resposta genérica — não revelar se o email existe (segurança)
        if (! $user) return;

        $plainToken = $this->createToken($email);

        $user->notify(new ResetPasswordNotification($plainToken, $this->expiresMinutes));
    }

    /**
     * Gera e persiste um novo token de reset para o email indicado.
     * Reaproveitado tanto pelo "esqueci-me da senha" como pelo convite de admin.
     */
    public function createToken(string $email): string
    {
        // Apagar tokens anteriores do mesmo email
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        $plainToken = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email'      => $email,
            'token'      => hash('sha256', $plainToken),
            'created_at' => now(),
        ]);

        return $plainToken;
    }

    // ── Reset ─────────────────────────────────────────────────────────

    public function reset(string $email, string $plainToken, string $newPassword): void
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', hash('sha256', $plainToken))
            ->first();

        if (! $record) {
            throw ValidationException::withMessages([
                'token' => ['Token inválido ou expirado.'],
            ]);
        }

        if (now()->diffInMinutes($record->created_at) > $this->expiresMinutes) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'token' => ['O link expirou. Solicite um novo.'],
            ]);
        }

        $user = User::where('email', $email)->firstOrFail();

        // 'active' + must_reset_password=false cobre tanto o reset comum
        // (já estava active) como a primeira definição de senha de um admin
        // convidado (estava 'pending' e com must_reset_password=true).
        $user->forceFill([
            'password'            => Hash::make($newPassword),
            'status'              => 'active',
            'must_reset_password' => false,
        ])->save();

        // Revogar todas as sessões activas
        $user->tokens()->delete();

        // Apagar token usado
        DB::table('password_reset_tokens')->where('email', $email)->delete();
    }

    // ── Validar token (para feedback no frontend) ─────────────────────

    public function tokenIsValid(string $email, string $plainToken): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', hash('sha256', $plainToken))
            ->first();

        if (! $record) return false;

        return now()->diffInMinutes($record->created_at) <= $this->expiresMinutes;
    }
}