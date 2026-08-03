<?php

namespace Modules\Monograph\app\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\Protocol\app\Events\ProtocolApproved;
use Modules\Monograph\app\Events\{MonographForwardedToOrgan, MonographReturned, MonographVerified};
use Modules\Monograph\app\Listeners\{OnProtocolApproved, NotifyOrganOnForward, NotifyStudentOnReturn, LogWorkflowTransition};

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        ProtocolApproved::class => [
            OnProtocolApproved::class,
        ],
        MonographForwardedToOrgan::class => [
            NotifyOrganOnForward::class,
            LogWorkflowTransition::class,
        ],
        MonographReturned::class => [
            NotifyStudentOnReturn::class,
            LogWorkflowTransition::class,
        ],
        MonographVerified::class => [
            LogWorkflowTransition::class,
        ],
    ];
}
