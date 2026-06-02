<?php

namespace Modules\Password\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    public function __construct(private string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // A URL aponta para o frontend React — não para o Laravel
        $url = config('app.frontend_url') . '/reset-password?token=' . $this->token
             . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Redefinição de palavra-passe — SGPMC ISCISA')
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line('Recebemos um pedido de redefinição da sua palavra-passe.')
            ->action('Redefinir palavra-passe', $url)
            ->line('Este link expira em 60 minutos.')
            ->line('Se não fez este pedido, ignore este email.');
    }
}