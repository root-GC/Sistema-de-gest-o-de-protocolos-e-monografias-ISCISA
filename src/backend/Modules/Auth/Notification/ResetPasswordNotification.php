<?php

namespace Modules\Auth\app\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    public function __construct(
        private readonly string $token,
        private readonly int $expiresMinutes = 60,
    ) {}

    public function via(object $notifiable): array
    {
        return ['brevo'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // URL aponta para o frontend React — não para o Laravel
        $url = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/')
             . '/reset-password'
             . '?token=' . $this->token
             . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Redefinição de palavra-passe — SGPMC ISCISA')
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line('Recebemos um pedido de redefinição da sua palavra-passe.')
            ->action('Redefinir palavra-passe', $url)
            ->line("Este link expira em {$this->expiresMinutes} minutos.")
            ->line('Se não fez este pedido, pode ignorar este email com segurança.');
    }
}