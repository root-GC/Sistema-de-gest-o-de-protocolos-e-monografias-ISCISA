<?php

namespace Modules\Monograph\app\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;
use Modules\Monograph\app\Providers\EventServiceProvider;
use Modules\Monograph\app\Providers\RouteServiceProvider;
use Modules\Monograph\app\Providers\AuthServiceProvider;

class MonographServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Monograph';
    protected string $nameLower = 'monograph';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
        AuthServiceProvider::class,
    ];
}