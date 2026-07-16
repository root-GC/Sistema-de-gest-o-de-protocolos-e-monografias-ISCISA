<?php

namespace Modules\Auth\app\Notifications\Channels;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Modules\Auth\app\Services\BrevoMailerService;

/**
 * Canal de notificação "brevo" — usa a mesma view que o Laravel usa
 * internamente para o canal 'mail' (resources/views/email.blade.php do
 * pacote illuminate/notifications, registada sob o namespace 'notifications'
 * pelo próprio framework, sem necessidade de publish), mas em vez de entregar
 * via Mail/SMTP, envia o HTML resultante através da API do Brevo.
 *
 * Vantagem: mantém a API fluente do MailMessage (->greeting()->line()->action())
 * em qualquer Notification, com entrega sempre centralizada no BrevoMailerService.
 */
class BrevoChannel
{
    public function __construct(private BrevoMailerService $mailer) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toMail')) {
            return;
        }

        /** @var MailMessage $message */
        $message = $notification->toMail($notifiable);

        $email = method_exists($notifiable, 'routeNotificationFor')
            ? ($notifiable->routeNotificationFor('mail', $notification) ?: $notifiable->email)
            : $notifiable->email;

        $name = $notifiable->name ?? 'Utilizador';

        $html = view('notifications::email', $message->toArray())->render();

        try {
            $this->mailer->send(
                to: ['email' => $email, 'name' => $name],
                subject: $message->subject ?? 'Notificação — SGPMC ISCISA',
                htmlContent: $html,
            );
        } catch (\RuntimeException $e) {
            // já logado dentro do BrevoMailerService — não interrompe o fluxo do request
            Log::error('BrevoChannel: falha ao entregar notificação', [
                'notification' => get_class($notification),
                'to'           => $email,
            ]);
        }
    }
}