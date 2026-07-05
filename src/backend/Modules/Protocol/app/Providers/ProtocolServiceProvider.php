<?php

namespace Modules\Protocol\app\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Policies\TopicPolicy;
use Modules\Protocol\app\Services\TopicService;

class ProtocolServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(TopicService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . "/../../routes/api.php");
        $this->loadMigrationsFrom(__DIR__ . "/../../database/migrations");

        Gate::policy(Topic::class, TopicPolicy::class);
    }
}