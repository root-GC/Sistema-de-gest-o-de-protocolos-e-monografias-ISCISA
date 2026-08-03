<?php
// Modules/Shared/Services/NotificationService.php

namespace Modules\Shared\Services;

use App\Models\Notification;

class NotificationService
{
    public function send(int $userId, string $type, string $title, ?string $body = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
        ]);
    }
}