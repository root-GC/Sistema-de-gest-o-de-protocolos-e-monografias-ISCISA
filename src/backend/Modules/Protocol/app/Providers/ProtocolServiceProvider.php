<?php

namespace Modules\Protocol\app\Providers;

use Illuminate\Support\ServiceProvider;

class ProtocolServiceProvider extends ServiceProvider
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