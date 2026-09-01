<?php
// Modules/Defense/app/Events/DefenseDateProposed.php
namespace Modules\Defense\app\Events;

use Modules\Defense\app\Models\Defense;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class DefenseDateProposed implements ShouldDispatchAfterCommit
{
    use Dispatchable;
    public function __construct(public readonly Defense $defense) {}
}
