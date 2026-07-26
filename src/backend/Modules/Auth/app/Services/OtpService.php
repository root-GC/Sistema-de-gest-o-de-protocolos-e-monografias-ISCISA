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

        if ($last && now()->diffInSeconds($last->created_at) < self::RESEND_COOLDOWN_SECONDS) {
            throw ValidationException::withMessages([
                'email' => 'Aguarde alguns segundos antes de solicitar um novo código.',
            ]);
        }
    }
}