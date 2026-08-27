<?php

namespace Modules\Auth\app\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Wrapper único para a API transacional do Brevo (https://api.brevo.com/v3/smtp/email).
 *
 * Centraliza o que já tinhas duplicado no sendInvite: headers, payload, log de
 * sucesso/erro. Qualquer fluxo que precise de mandar email (OTP, acessos,
 * notificações) passa a chamar isto em vez de montar o pedido HTTP à mão.
 */
class BrevoMailerService
{
    /**
     * @param  array{email: string, name?: string}  $to
     *
     * @throws \RuntimeException  se o Brevo devolver um erro
     */
    public function send(array $to, string $subject, string $htmlContent): void
    {
        $response = Http::withHeaders([
            'api-key'      => config('services.brevo.api_key'),
            'accept'       => 'application/json',
            'content-type' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', [
            'sender' => [
                'name'  => config('mail.from.name'),
                'email' => config('mail.from.address'),
            ],
            'to' => [
                [
                    'email' => $to['email'],
                    'name'  => $to['name'] ?? 'Utilizador',
                ],
            ],
            'subject'    => $subject,
            'htmlContent' => $htmlContent,
        ]);

        if (! $response->successful()) {
            Log::error('BREVO EMAIL FAILED', [
                'to'     => $to['email'],
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            throw new \RuntimeException('Falha ao enviar email via Brevo.');
        }

        Log::info('BREVO EMAIL SENT', ['to' => $to['email'], 'subject' => $subject]);
    }
}
