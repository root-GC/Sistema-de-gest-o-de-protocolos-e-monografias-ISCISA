<?php

namespace Modules\Auth\app\Listeners;

use Illuminate\Support\Facades\Log;
use Modules\Auth\app\Events\UserLoggedIn;

class LogAuthActivity
{
    public function handle(UserLoggedIn $event): void
    {
        Log::channel('daily')->info('user.login', [
            'user_id' => $event->user->id,
            'email'   => $event->user->email,
            'ip'      => request()->ip(),
            'at'      => now()->toIso8601String(),
        ]);
    }
}