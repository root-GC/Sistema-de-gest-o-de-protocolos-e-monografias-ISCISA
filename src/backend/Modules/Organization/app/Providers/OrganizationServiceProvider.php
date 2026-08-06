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
        if (file_exists(__DIR__ . '/../../routes/api.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../../routes/api.php');
        }

        if (file_exists(__DIR__ . '/../../routes/web.php')) {
            $this->loadRoutesFrom(__DIR__ . '/../../routes/web.php');
        }

        if (is_dir(__DIR__ . '/../../database/migrations')) {
            $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
        }

          // 🆕 Registar o hint path para as views do módulo
        $this->loadViewsFrom(
            __DIR__ . '/../../resources/views',
            'organization'
        );
    }
}