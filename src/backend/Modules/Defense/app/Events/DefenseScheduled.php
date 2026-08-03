<?php
// Modules/Defense/app/Events/DefenseScheduled.php
namespace Modules\Defense\app\Events;

use Modules\Defense\app\Models\Defense;
use Illuminate\Foundation\Events\Dispatchable;

class DefenseScheduled
{
    use Dispatchable;
    public function __construct(public readonly Defense $defense) {}
}