<?php
// Modules/Defense/app/Listeners/OnMonographVerified.php
namespace Modules\Defense\app\Listeners;

use Modules\Monograph\app\Events\MonographVerified;
use Modules\Defense\app\Models\Defense;
use Modules\Defense\app\Enums\DefenseStatus;

class OnMonographVerified
{
    public function handle(MonographVerified $event): void
    {
        Defense::firstOrCreate(
            ['monograph_id' => $event->monograph->id],
            ['status' => DefenseStatus::AguardaJuri]
        );
    }
}