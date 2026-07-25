<?php

// Modules/Monograph/app/Listeners/NotifyStudentOnReturn.php
namespace Modules\Monograph\app\Listeners;

use Modules\Monograph\app\Events\MonographReturned;
use Modules\Shared\Services\NotificationService;

class NotifyStudentOnReturn
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(MonographReturned $event): void
    {
        $this->notifications->send(
            userId: $event->monograph->student->user_id,
            type: 'monografia_devolvida',
            title: $event->stage === 'supervisor'
                ? 'Supervisor devolveu a monografia'
                : 'Órgão devolveu a monografia',
            body: $event->reason,
        );
    }
}