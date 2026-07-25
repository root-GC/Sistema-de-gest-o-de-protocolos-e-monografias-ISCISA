<?php

// Modules/Monograph/app/Events/MonographVerified.php
namespace Modules\Monograph\app\Events;

use Modules\Monograph\app\Models\Monograph;
use Illuminate\Foundation\Events\Dispatchable;

class MonographVerified
{
    use Dispatchable;

    public function __construct(public readonly Monograph $monograph) {}
}