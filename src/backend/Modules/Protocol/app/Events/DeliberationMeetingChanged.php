<?php

namespace Modules\Protocol\app\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Protocol\app\Models\DeliberationMeeting;

class DeliberationMeetingChanged implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly DeliberationMeeting $meeting,
        public readonly string $action,
    ) {}
}
