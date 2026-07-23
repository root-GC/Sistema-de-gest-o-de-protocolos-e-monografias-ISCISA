<?php

namespace Modules\Auth\app\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTechnicalAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user    = $request->user();
        $profile = $user?->adminProfile;

        // Camada 1: tem de ter perfil admin com scope global
        if (! $profile || $profile->access_scope !== 'global') {
            abort(403, 'Apenas o administrador técnico pode aceder a este recurso.');
        }

        // Camada 2: confirma a permission também (redundante hoje, protege no futuro)
        if (! $user->hasAnyPermission(['admin.roles', 'admin.settings'])) {
            abort(403, 'Permissão insuficiente.');
        }

        return $next($request);
    }
}