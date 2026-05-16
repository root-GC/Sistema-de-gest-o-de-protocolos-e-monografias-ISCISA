<?php

namespace Modules\Auth\App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
         $this->loadMigrationsFrom(module_path('Auth', 'database/migrations'));
        Route::middleware('api')
            ->prefix('api')
            ->group(module_path('Auth', 'routes/api.php'));
    }
}