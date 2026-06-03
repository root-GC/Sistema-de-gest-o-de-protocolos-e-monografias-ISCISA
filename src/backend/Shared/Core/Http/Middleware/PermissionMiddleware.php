<?php

namespace Shared\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Shared\Core\Exceptions\PermissionDeniedException;

/**
 * Middleware: permission:<code>
 *
 * Registo em bootstrap/app.php (Laravel 11) ou Kernel.php (Laravel 10):
 *
 *   Laravel 11:
 *     ->withMiddleware(function (Middleware $middleware) {
 *         $middleware->alias(['permission' => PermissionMiddleware::class]);
 *     })
 *
 *   Laravel 10 — Kernel.php $routeMiddleware:
 *     'permission' => \Shared\Core\Http\Middleware\PermissionMiddleware::class,
 *
 * Uso nas rotas:
 *   Route::middleware('permission:protocol.assign')->...
 */
class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermission($permission)) {
            throw new PermissionDeniedException($permission);
        }

        return $next($request);
    }
}