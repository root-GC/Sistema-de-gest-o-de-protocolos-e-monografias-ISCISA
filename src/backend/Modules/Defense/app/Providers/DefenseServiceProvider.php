<?php
// Modules/Defense/app/Providers/DefenseServiceProvider.php

namespace Modules\Defense\app\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class DefenseServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Defense';
    protected string $nameLower = 'defense';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
        AuthServiceProvider::class,
    ];
}