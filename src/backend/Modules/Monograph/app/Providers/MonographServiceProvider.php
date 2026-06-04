<?php

namespace Modules\Monograph\app\Providers;

use Illuminate\Support\ServiceProvider;

class MonographServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bindings do container (opcional)
    }

    public function boot(): void
    {
        // Inicialização do módulo (rotas, eventos, etc.)
    }
}