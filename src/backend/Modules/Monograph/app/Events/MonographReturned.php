<?php

// Modules/Monograph/app/Events/MonographReturned.php
namespace Modules\Monograph\app\Events;

use Modules\Monograph\app\Models\Monograph;
use Illuminate\Foundation\Events\Dispatchable;

class MonographReturned
{
    use Dispatchable;

    public function __construct(
        public readonly Monograph $monograph,
        public readonly string $stage,
        public readonly string $reason
    ) {}
}