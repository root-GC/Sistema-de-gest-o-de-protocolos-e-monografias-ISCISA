<?php

namespace Modules\Organization\app\Providers;

use Illuminate\Support\ServiceProvider;

class OrganizationServiceProvider extends ServiceProvider
{
    protected string $moduleName = 'Organization';

    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        if (file_exists(__DIR__ . '/../../Routes/api.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../../Routes/api.php');
        }

        if (file_exists(__DIR__ . '/../../Routes/web.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../../Routes/web.php');
        }

        if (is_dir(__DIR__ . '/../../Database/Migrations')) {
            $this->loadMigrationsFrom(__DIR__ . '/../../Database/Migrations');
        }
    }
}