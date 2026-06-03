<?php

namespace Modules\Password\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Password\Services\PasswordResetService;

class PasswordServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PasswordResetService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
    }
}