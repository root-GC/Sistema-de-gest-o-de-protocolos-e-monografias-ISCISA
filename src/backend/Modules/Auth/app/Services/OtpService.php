<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\View;
use Illuminate\Validation\ValidationException;
use Modules\Auth\app\Services\BrevoMailerService;

/**
 * OtpService — geração e verificação de códigos de uso único.
 *
 * Usado em dois contextos (campo `purpose`):
 *   - 'register'        → verificação de email no registo público
 *   - 'password_reset'  → poderá substituir/reforçar o PasswordService no futuro
 */
class OtpService
{
    private const CODE_LENGTH = 6;
    private const TTL_MINUTES = 10;
    private const MAX_ATTEMPTS = 5;
    private const RESEND_COOLDOWN_SECONDS = 60;

    public function __construct(private BrevoMailerService $mailer) {}

    public function generateAndSend(string $email, string $purpose = 'register', ?string $name = null): void
    {
        $this->assertCanResend($email, $purpose);

        $code = (string) random_int(100000, 999999);

        // Invalida OTPs anteriores não verificados para este email/purpose
        DB::table('otps')
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('verified_at')
            ->delete();

        DB::table('otps')->insert([
            'email'      => $email,
            'code'       => Hash::make($code),
            'purpose'    => $purpose,
            'attempts'   => 0,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $html = View::make('auth::emails.otp', [
          'code'       => $code,
          'ttlMinutes' => self::TTL_MINUTES,
        ])->render();

        // Falha de envio não deve impedir o registo já persistido; fica registada
        // no log do BrevoMailerService e o utilizador pode pedir reenvio.
        try {
            $this->mailer->send(
                to: ['email' => $email, 'name' => $name ?? 'Utilizador'],
                subject: 'O seu código de verificação — SGPMC ISCISA',
                htmlContent: $html,
            );
        } catch (\RuntimeException $e) {
            // já logado dentro do BrevoMailerService
        }
    }

    /**
     * @throws ValidationException
     */
    public function verify(string $email, string $code, string $purpose = 'register'): void
    {
        $otp = DB::table('otps')
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('verified_at')
            ->orderByDesc('id')
            ->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'code' => 'Código inválido ou já utilizado. Solicite um novo.',
            ]);
        }

        if (now()->greaterThan($otp->expires_at)) {
            throw ValidationException::withMessages([
                'code' => 'Código expirado. Solicite um novo.',
            ]);
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            throw ValidationException::withMessages([
                'code' => 'Número máximo de tentativas excedido. Solicite um novo código.',
            ]);
        }

        if (! Hash::check($code, $otp->code)) {
            DB::table('otps')->where('id', $otp->id)->increment('attempts');

            throw ValidationException::withMessages([
                'code' => 'Código incorrecto.',
            ]);
        }

        DB::table('otps')->where('id', $otp->id)->update(['verified_at' => now()]);
    }

    /**
     * @throws ValidationException
     */
    private function assertCanResend(string $email, string $purpose): void
{
    $last = DB::table('otps')
        ->where('email', $email)
        ->where('purpose', $purpose)
        ->orderByDesc('id')
        ->first();

    if (! $last) {
        return;
    }

    $elapsed = now()->diffInSeconds($last->created_at);

    if ($elapsed < self::RESEND_COOLDOWN_SECONDS) {
        $remaining = self::RESEND_COOLDOWN_SECONDS - $elapsed;

        throw ValidationException::withMessages([
            'email' => "Aguarde {$remaining} segundos antes de solicitar um novo código.",
        ]);
    }
}

    // OtpService.php — adicionar

public function secondsRemaining(string $email, string $purpose = 'register'): ?int
{
    $otp = DB::table('otps')
        ->where('email', $email)
        ->where('purpose', $purpose)
        ->whereNull('verified_at')
        ->orderByDesc('id')
        ->first();

    if (! $otp) {
        return null;
    }

    $remaining = now()->diffInSeconds($otp->expires_at, false);
    $max = self::TTL_MINUTES * 60;

    return max(0, min($remaining, $max));
}

public function resendCooldownRemaining(string $email, string $purpose = 'register'): int
{
    $last = DB::table('otps')
        ->where('email', $email)
        ->where('purpose', $purpose)
        ->orderByDesc('id')
        ->first();

    if (! $last) {
        return 0;
    }

    $elapsed   = now()->diffInSeconds($last->created_at);
    $remaining = self::RESEND_COOLDOWN_SECONDS - $elapsed;

    // Clamp: nunca pode ser negativo nem maior que o próprio cooldown
    return max(0, min($remaining, self::RESEND_COOLDOWN_SECONDS));
}

}