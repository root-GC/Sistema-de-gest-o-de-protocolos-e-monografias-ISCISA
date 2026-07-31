<?php
// Modules/Defense/app/Events/DefenseClosed.php
namespace Modules\Defense\app\Events;

use Modules\Defense\app\Models\Defense;
use Illuminate\Foundation\Events\Dispatchable;

class DefenseClosed
{
    use Dispatchable;
    public function __construct(public readonly Defense $defense) {}
}