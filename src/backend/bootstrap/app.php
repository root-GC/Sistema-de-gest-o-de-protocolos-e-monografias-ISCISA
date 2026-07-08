<?php

// bootstrap/app.php — Laravel 11
// Colocar na raiz do projecto Laravel em bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Shared\Core\Exceptions\WorkflowException;
use Shared\Core\Exceptions\PermissionDeniedException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Registar alias do middleware de permissão
        $middleware->alias([
            'permission' => \Shared\Core\Http\Middleware\PermissionMiddleware::class,
        ]);

        // Evita Route [login] not defined em requests sem token.
        $middleware->redirectGuestsTo(fn () => route('auth.login'));

        // Sanctum stateful domains para SPA (React)
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // WorkflowException → 422
        $exceptions->render(function (WorkflowException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json($e->toArray(), 422);
            }
        });

        // PermissionDeniedException → 403
        $exceptions->render(function (PermissionDeniedException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 403);
            }
        });
    })
    ->create();
