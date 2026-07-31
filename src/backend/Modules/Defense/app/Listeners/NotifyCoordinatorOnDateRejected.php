<?php
// Modules/Defense/app/Listeners/NotifyCoordinatorOnDateRejected.php
namespace Modules\Defense\app\Listeners;

use Modules\Defense\app\Events\DefenseDateRejected;
use Modules\Shared\Services\NotificationService;

class NotifyCoordinatorOnDateRejected
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(DefenseDateRejected $event): void
    {
        $coordinatorUserId = $event->defense->coordinator?->user_id;

        if (!$coordinatorUserId) {
            return;
        }

        $altText = $event->alternativeDateTime
            ? "Sugestão alternativa: {$event->alternativeDateTime}."
            : 'Sem sugestão de data alternativa.';

        $this->notifications->send(
            userId: $coordinatorUserId,
            type: 'defesa_data_recusada',
            title: 'Arguente recusou a data proposta',
            body: "{$event->juryMember->teacher->user->name} recusou a data para "
                . "\"{$event->defense->monograph->title}\". {$altText} "
                . ($event->note ? "Nota: {$event->note}" : ''),
        );
    }
}