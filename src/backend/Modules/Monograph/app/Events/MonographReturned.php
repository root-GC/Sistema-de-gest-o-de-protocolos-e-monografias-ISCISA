<?php

// Modules/Monograph/app/Events/MonographReturned.php
namespace Modules\Monograph\app\Events;

use Modules\Monograph\app\Models\Monograph;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class MonographReturned implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public readonly Monograph $monograph,
        public readonly string $stage,
        public readonly string $reason
    ) {}
}
