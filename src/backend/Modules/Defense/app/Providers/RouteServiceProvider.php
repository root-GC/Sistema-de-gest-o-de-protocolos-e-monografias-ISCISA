<?php
// Modules/Defense/app/Providers/RouteServiceProvider.php

namespace Modules\Defense\app\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'Defense';

    public function boot(): void
    {
        parent::boot();

        // Bind {defense} route parameter by monograph code (blind-review code)
        Route::bind('defense', function ($value) {
            return \Modules\Defense\app\Models\Defense::whereHas('monograph', function ($q) use ($value) {
                $q->where('code', $value);
            })->firstOrFail();
        });
    }

    public function map(): void
    {
        Route::middleware('api')->prefix('api')->name('api.')->group(module_path($this->name, '/routes/api.php'));
    }
}