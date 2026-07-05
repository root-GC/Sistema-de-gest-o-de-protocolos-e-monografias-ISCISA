<?php

namespace Modules\Auth\app\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Modules\Auth\app\Services\AuthService;
use Modules\Auth\app\Services\TokenService;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\Auth\app\Events\UserLoggedIn;
use Modules\Auth\app\Listeners\LogAuthActivity;
use Modules\User\app\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    protected string $moduleName = "Auth";

    public function register(): void
    {
        $this->app->bind(AuthService::class);
        $this->app->bind(TokenService::class);
        $this->app->singleton(AuthPayloadBuilder::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . "/../../routes/api.php");
        $this->loadMigrationsFrom(__DIR__ . "/../../database/migrations");

        // Registar listeners
        \Illuminate\Support\Facades\Event::listen(
            UserLoggedIn::class,
            LogAuthActivity::class
        );

        // Gates
        Gate::before(function (User $user, string $ability) {
            // Admin global pode tudo
            if ($user->hasRole("admin") && $user->adminProfile?->access_scope === "global") {
                return true;
            }
        });
    }
}