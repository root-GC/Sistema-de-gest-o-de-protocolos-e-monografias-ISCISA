<?php
// Modules/Defense/app/Events/DefenseDateRejected.php
namespace Modules\Defense\app\Events;

use Modules\Defense\app\Models\{Defense, DefenseJury};
use Illuminate\Foundation\Events\Dispatchable;

class DefenseDateRejected
{
    use Dispatchable;
    public function __construct(
        public readonly Defense $defense,
        public readonly DefenseJury $juryMember,
        public readonly ?string $alternativeDateTime,
        public readonly ?string $note
    ) {}
}