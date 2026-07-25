<?php

namespace Modules\Monograph\app\Listeners;

use Modules\Monograph\app\Events\MonographForwardedToOrgan;
use Modules\Shared\Services\NotificationService;
use Modules\User\app\Models\SecretaryProfile;

class NotifyOrganOnForward
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(MonographForwardedToOrgan $event): void
    {
        SecretaryProfile::query()
            ->pluck('user_id')
            ->each(fn ($userId) => $this->notifications->send(
                userId: $userId,
                type: 'monografia_para_verificacao',
                title: 'Nova monografia para verificação documental',
                body: "Monografia \"{$event->monograph->title}\" aguarda verificação.",
            ));
    }
}