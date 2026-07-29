<?php

namespace Modules\Auth\app\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Modules\Auth\app\Services\AuthService;
use Modules\Auth\app\Services\TokenService;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\Auth\app\Events\UserLoggedIn;
use Modules\Auth\app\Listeners\AssignReviewerRoleFromProtocol;
use Modules\Auth\app\Listeners\AssignReviewerRoleFromTopic;
use Modules\Auth\app\Listeners\LogAuthActivity;
use Modules\Auth\app\Listeners\NotifyProtocolStatus;
use Modules\Auth\app\Listeners\NotifyReviewerAssigned;
use Modules\Auth\app\Listeners\NotifyTopicStatus;
use Modules\Protocol\app\Events\ProtocolReviewersAssigned;
use Modules\Protocol\app\Events\ProtocolStatusChanged;
use Modules\Protocol\app\Events\TopicReviewersAssigned;
use Modules\Protocol\app\Events\TopicStatusChanged;
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
        $this->loadViewsFrom(
                module_path('Auth', 'resources/views'),
                'auth'
            );
        // Registar listeners
        \Illuminate\Support\Facades\Event::listen(
            UserLoggedIn::class,
            LogAuthActivity::class
        );

        \Illuminate\Support\Facades\Event::listen(
            'Modules\\Protocol\\app\\Events\\TopicReviewersAssigned',
            'Modules\\Auth\\app\\Listeners\\AssignReviewerRoleFromTopic'
        );

        \Illuminate\Support\Facades\Event::listen(
            'Modules\\Protocol\\app\\Events\\ProtocolReviewersAssigned',
            'Modules\\Auth\\app\\Listeners\\AssignReviewerRoleFromProtocol'
        );

        \Illuminate\Support\Facades\Event::listen(
            'Modules\\Protocol\\app\\Events\\TopicReviewersAssigned',
            'Modules\\Auth\\app\\Listeners\\NotifyReviewerAssigned@handleTopic'
        );

        \Illuminate\Support\Facades\Event::listen(
            'Modules\\Protocol\\app\\Events\\ProtocolReviewersAssigned',
            'Modules\\Auth\\app\\Listeners\\NotifyReviewerAssigned@handleProtocol'
        );

        \Illuminate\Support\Facades\Event::listen(
            'Modules\\Protocol\\app\\Events\\TopicStatusChanged',
            'Modules\\Auth\\app\\Listeners\\NotifyTopicStatus'
        );

        \Illuminate\Support\Facades\Event::listen(
            'Modules\\Protocol\\app\\Events\\ProtocolStatusChanged',
            'Modules\\Auth\\app\\Listeners\\NotifyProtocolStatus'
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
