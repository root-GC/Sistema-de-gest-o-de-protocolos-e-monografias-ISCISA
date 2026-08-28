<?php

namespace Modules\Protocol\app\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Event;
use Modules\Protocol\app\Events\DeliberationMeetingChanged;
use Modules\Protocol\app\Listeners\NotifyDeliberationMeetingChanged;
use Illuminate\Support\ServiceProvider;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Policies\EvaluationFormPolicy;
use Modules\Protocol\app\Policies\TopicPolicy;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\Protocol\app\Services\DeliberationMeetingService;
use Modules\Protocol\app\Services\TopicService;

class ProtocolServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(TopicService::class);
        $this->app->bind(EvaluationService::class);
        $this->app->bind(DeliberationMeetingService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . "/../../routes/api.php");
        $this->loadMigrationsFrom(__DIR__ . "/../../database/migrations");
        $this->loadViewsFrom(__DIR__ . "/../../resources/views", 'protocol');

        Gate::policy(Topic::class, TopicPolicy::class);
        Gate::policy(EvaluationForm::class, EvaluationFormPolicy::class);

        Event::listen(DeliberationMeetingChanged::class, NotifyDeliberationMeetingChanged::class);
    }
}
