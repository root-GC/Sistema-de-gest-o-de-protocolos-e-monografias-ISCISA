<?php

namespace Modules\Protocol\app\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Protocol\app\Models\Protocol;

class ProtocolReviewersAssigned implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    /**
     * @param array<int> $reviewerIds
     */
    public function __construct(
        public readonly Protocol $protocol,
        public readonly array $reviewerIds,
    ) {}
}
