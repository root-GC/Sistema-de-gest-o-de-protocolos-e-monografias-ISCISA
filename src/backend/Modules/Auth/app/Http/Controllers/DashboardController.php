<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\User\app\Models\User;

class DashboardController extends Controller
{
    public function __construct(
        private AuthPayloadBuilder $payloadBuilder
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $requestedWidgets = $request->input('widgets', []);

        $authorized = $this->filterAuthorizedWidgets($requestedWidgets, $user);

        $widgets = [];

        foreach ($authorized as $widgetId) {
            $widgets[$widgetId] = match ($widgetId) {
                'profile' => $this->payloadBuilder->build($user),

                'permissions' => [
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->getPermissions()->pluck('code'),
                ],

                default => [],
            };
        }

        return response()->json([
            'widgets' => $widgets,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }

    private function filterAuthorizedWidgets(array $requested, User $user): array
    {
        $config = config('dashboard', []);

        return array_values(array_filter($requested, function (string $widgetId) use ($user, $config) {

            $widgetConfig = $config[$widgetId] ?? null;

            if (!$widgetConfig) {
                return false;
            }

            $permissions = $widgetConfig['permissions'] ?? [];

            if (empty($permissions)) {
                return true;
            }

            return ($widgetConfig['any_permission'] ?? false)
                ? $user->hasAnyPermission($permissions)
                : $user->hasAllPermissions($permissions);
        }));
    }
}