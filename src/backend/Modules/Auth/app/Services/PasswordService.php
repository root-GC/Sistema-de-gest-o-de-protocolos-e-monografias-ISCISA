<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\User\app\Models\User;

class PasswordService
{
    private int $expiresMinutes = 10;

    public function __construct(private BrevoMailerService $mailer) {}

    // ── Forgot ────────────────────────────────────────────────────────

    public function sendResetLink(string $email): void
    {
        $user = User::where('email', $email)->where('status', 'active')->first();

        // Resposta genérica — não revelar se o email existe (segurança)
        if (! $user) return;

        $plainToken = $this->createToken($email);

        $link = rtrim(config('app.frontend_url'), '/')
            . '/reset-password?email=' . urlencode($user->email)
            . '&token=' . $plainToken;

        try {
            $this->mailer->send(
                ['email' => $user->email, 'name' => $user->name],
                'Redefinição de palavra-passe — SGPMC ISCISA',
                view('auth::emails.reset-password', [
                    'name'           => $user->name,
                    'link'           => $link,
                    'expiresMinutes' => $this->expiresMinutes,
                ])->render()
            );
        } catch (\Throwable $e) {
            // Ao contrário do convite, aqui NÃO fazemos rollback de nada
            // (não criámos user nenhum) — só logamos. A resposta ao
            // frontend continua genérica, não revelamos a falha.
            Log::error('[PasswordService] falha ao enviar email de reset', [
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Gera e persiste um novo token de reset para o email indicado.
     * Reaproveitado tanto pelo "esqueci-me da senha" como pelo convite de admin.
     */
    public function createToken(string $email): string
    {
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

        $user->forceFill([
            'password'            => Hash::make($newPassword),
            'status'              => 'active',
            'must_reset_password' => false,
        ])->save();

        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $email)->delete();
    }

    // ── Validar token ───────────────────────────────────────────────

    public function tokenIsValid(string $email, string $plainToken): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', hash('sha256', $plainToken))
            ->first();

        if (! $record) return false;

        return now()->diffInMinutes($record->created_at) <= $this->expiresMinutes;
    }

    // PasswordService.php

    public function secondsRemaining(string $email, string $plainToken): ?int
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', hash('sha256', $plainToken))
            ->first();

        if (! $record) {
            return null; // token inválido
        }

        $expiresAt = \Carbon\Carbon::parse($record->created_at)->addMinutes($this->expiresMinutes);
        $remaining = now()->diffInSeconds($expiresAt, false);

        return $remaining > 0 ? (int) $remaining : 0;
    }
}