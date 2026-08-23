<?php

namespace Modules\Defense\app\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Defense\app\Models\Defense;

class DefenseAssignedToJury
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public readonly Defense $defense;
    public readonly array $assignments;

    public function __construct(Defense $defense, array $assignments)
    {
        $this->defense = $defense;
        $this->assignments = $assignments;
    }
}
