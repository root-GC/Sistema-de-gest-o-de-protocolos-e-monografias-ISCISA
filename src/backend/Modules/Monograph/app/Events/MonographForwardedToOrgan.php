<?php

namespace Modules\Monograph\app\Events;

use Modules\Monograph\app\Models\Monograph;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class MonographForwardedToOrgan implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly Monograph $monograph) {}
}
