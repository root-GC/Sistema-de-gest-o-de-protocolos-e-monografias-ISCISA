<?php

namespace Modules\Protocol\app\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Protocol\app\Models\Topic;

class TopicReviewersAssigned implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    /**
     * @param array<int> $reviewerIds
     */
    public function __construct(
        public readonly Topic $topic,
        public readonly array $reviewerIds,
    ) {}
}
