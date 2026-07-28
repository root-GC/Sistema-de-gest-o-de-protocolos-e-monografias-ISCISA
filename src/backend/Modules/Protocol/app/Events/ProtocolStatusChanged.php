<?php

namespace Modules\Protocol\app\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class ProtocolStatusChanged implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Protocol $protocol,
        public readonly ?string $oldStatus,
        public readonly string $newStatus,
        public readonly ?User $actor = null,
    ) {}
}
