<?php

namespace Modules\Protocol\app\Listeners;

use Illuminate\Support\Facades\Log;
use Modules\Auth\app\Services\BrevoMailerService;
use Modules\Protocol\app\Events\DeliberationMeetingChanged;
use Modules\Shared\Services\NotificationService;

class NotifyDeliberationMeetingChanged
{
    public function __construct(
        private NotificationService $notifications,
        private BrevoMailerService $mailer,
    ) {}

    public function handle(DeliberationMeetingChanged $event): void
    {
        $meeting = $event->meeting->loadMissing([
            'organ:id,name,type',
            'items.evaluationForm.protocol.topic:id,title',
            'items.evaluationForm.reviewerEvaluations.reviewer.user:id,name,email',
        ]);
        $labels = [
            'scheduled' => ['Reunião de deliberação marcada', 'Foi marcada uma reunião de deliberação.'],
            'rescheduled' => ['Reunião de deliberação reagendada', 'A reunião de deliberação foi reagendada.'],
            'cancelled' => ['Reunião de deliberação cancelada', 'A reunião de deliberação foi cancelada.'],
        ];
        [$title, $lead] = $labels[$event->action] ?? ['Reunião de deliberação actualizada', 'A reunião de deliberação foi actualizada.'];

        $recipients = $meeting->items
            ->flatMap(fn ($item) => $item->evaluationForm->reviewerEvaluations)
            ->map(fn ($evaluation) => $evaluation->reviewer?->user)
            ->filter()
            ->unique('id');
        $protocols = $meeting->items
            ->map(fn ($item) => $item->evaluationForm->protocol?->code)
            ->filter()
            ->implode(', ');
        $body = sprintf(
            '%s %s, em %s. Protocolos: %s.',
            $lead,
            $meeting->scheduled_at?->timezone('Africa/Maputo')->format('d/m/Y H:i'),
            $meeting->location,
            $protocols ?: 'não indicados'
        );

        foreach ($recipients as $user) {
            $this->notifications->send($user->id, 'deliberation_meeting_'.$event->action, $title, $body);

            if (! $user->email) {
                continue;
            }

            try {
                $link = rtrim(config('app.frontend_url'), '/').'/reviewer/meetings';
                $html = '<p>Olá, '.e($user->name).'.</p>'
                    .'<p>'.e($body).'</p>'
                    .'<p><a href="'.e($link).'">Consultar reunião</a></p>';
                $this->mailer->send(
                    ['email' => $user->email, 'name' => $user->name],
                    $title.' — SGPMC ISCISA',
                    $html
                );
            } catch (\Throwable $exception) {
                Log::error('Falha ao enviar notificação de reunião por email.', [
                    'meeting_id' => $meeting->id,
                    'user_id' => $user->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }
    }
}
