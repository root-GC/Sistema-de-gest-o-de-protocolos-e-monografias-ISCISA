<?php
// Modules/Defense/app/Events/DefenseGraded.php
namespace Modules\Defense\app\Events;

use Modules\Defense\app\Models\Defense;
use Illuminate\Foundation\Events\Dispatchable;

class DefenseGraded
{
    use Dispatchable;
    public function __construct(public readonly Defense $defense) {}
}