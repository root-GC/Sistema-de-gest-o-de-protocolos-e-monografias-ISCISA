<?php

namespace Modules\Monograph\app\Events;

use Modules\Monograph\app\Models\Monograph;
use Illuminate\Foundation\Events\Dispatchable;

class MonographForwardedToOrgan
{
    use Dispatchable;

    public function __construct(public readonly Monograph $monograph) {}
}