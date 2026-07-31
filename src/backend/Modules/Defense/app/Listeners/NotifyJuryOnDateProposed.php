<?php
// Modules/Defense/app/Listeners/NotifyJuryOnDateProposed.php
namespace Modules\Defense\app\Listeners;

use Modules\Defense\app\Events\DefenseDateProposed;
use Modules\Shared\Services\NotificationService;

class NotifyJuryOnDateProposed
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(DefenseDateProposed $event): void
    {
        foreach ($event->defense->jury as $member) {
            $this->notifications->send(
                userId: $member->teacher->user_id,
                type: 'defesa_data_proposta',
                title: 'Nova data de defesa proposta',
                body: "Foi proposta a data {$event->defense->scheduled_at->format('d/m/Y H:i')} "
                    . "para a defesa de \"{$event->defense->monograph->title}\".",
            );
        }
    }
}