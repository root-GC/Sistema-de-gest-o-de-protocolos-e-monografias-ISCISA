<?php
// Modules/Defense/app/Listeners/NotifyCoordinatorOnSchedule.php
namespace Modules\Defense\app\Listeners;

use Modules\Defense\app\Events\DefenseScheduled;
use Modules\Shared\Services\NotificationService;

class NotifyCoordinatorOnSchedule
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(DefenseScheduled $event): void
    {
        $this->notifications->send(
            userId: $event->defense->monograph->student_id,
            type: 'defesa_agendada',
            title: 'Defesa confirmada',
            body: "A defesa da sua monografia \"{$event->defense->monograph->title}\" foi confirmada.",
        );
    }
}