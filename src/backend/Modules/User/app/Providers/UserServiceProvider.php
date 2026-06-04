<?php

namespace Modules\User\app\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\User\app\Services\UserService;
use Modules\User\app\Services\ProfileService;
use Modules\User\app\Repositories\UserRepository;

class UserServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserService::class);
        $this->app->bind(ProfileService::class);
        $this->app->singleton(UserRepository::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../../Routes/api.php');
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
    }
}