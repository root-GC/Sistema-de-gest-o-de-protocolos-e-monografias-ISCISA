<?php

namespace Modules\Protocol\app\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProtocolApproved implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $submissionId,
        public readonly int $studentId,
        public readonly int $supervisorId,
        public readonly string $title,
        public readonly int $courseId,
        public readonly int $scientificAreaId,
    ) {}
}
