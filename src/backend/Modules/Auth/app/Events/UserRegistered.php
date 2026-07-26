<?php

namespace Modules\Auth\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Modules\User\Models\User;

class UserRegistered
{
    use Dispatchable;

    public function __construct(public readonly User $user) {}
}