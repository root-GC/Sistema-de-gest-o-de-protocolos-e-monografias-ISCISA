<?php

namespace Modules\Auth\app\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Modules\User\Models\User;

class UserLoggedIn
{
    use Dispatchable;

    public function __construct(public readonly User $user) {}
}