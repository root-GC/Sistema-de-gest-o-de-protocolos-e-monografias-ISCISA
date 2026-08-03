<?php
// Modules/Defense/app/Providers/AuthServiceProvider.php

namespace Modules\Defense\app\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Modules\Defense\app\Models\Defense;
use Modules\Defense\app\Policies\DefensePolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Defense::class => DefensePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}