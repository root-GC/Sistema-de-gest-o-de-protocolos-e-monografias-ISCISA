<?php
// Modules/Defense/app/Providers/EventServiceProvider.php

namespace Modules\Defense\app\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\Monograph\app\Events\MonographVerified;
use Modules\Defense\app\Events\{DefenseDateProposed, DefenseDateRejected, DefenseScheduled, DefenseAssignedToJury};
use Modules\Defense\app\Listeners\{
    OnMonographVerified, NotifyJuryOnDateProposed,
    NotifyCoordinatorOnDateRejected, NotifyCoordinatorOnSchedule, NotifyJuryOnAssignment
};

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        MonographVerified::class => [
            OnMonographVerified::class,
        ],
        DefenseDateProposed::class => [
            NotifyJuryOnDateProposed::class,
        ],
        DefenseDateRejected::class => [
            NotifyCoordinatorOnDateRejected::class,
        ],
        DefenseScheduled::class => [
            NotifyCoordinatorOnSchedule::class,
        ],
        DefenseAssignedToJury::class => [
            NotifyJuryOnAssignment::class,
        ],
    ];
}