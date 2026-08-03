<?php

namespace Modules\Monograph\app\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Modules\Monograph\app\Models\Monograph;
use Modules\Monograph\app\Policies\MonographPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Monograph::class => MonographPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}