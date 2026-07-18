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

        $widgetsData = [];
        foreach ($authorized as $widgetId) {
            $widgetsData[$widgetId] = $this->fetchWidgetData($widgetId, $user);
        }

        return response()->json([
            'widgets' => $widgetsData,
            'user' => $this->payloadBuilder->build($user),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'widgets_requested' => count($requestedWidgets),
                'widgets_authorized' => count($authorized),
            ],
        ]);
    }

    private function filterAuthorizedWidgets(array $requested, User $user): array
    {
        $config = config('dashboard', []);

        return array_values(array_filter($requested, function (string $widgetId) use ($user, $config) {
            $widgetConfig = $config[$widgetId] ?? null;

            if ($widgetConfig === null) {
                return false;
            }

            $permissions = $widgetConfig['permissions'] ?? null;

            if ($permissions === null) {
                return false;
            }

            if (empty($permissions)) {
                return true;
            }

            $any = $widgetConfig['any_permission'] ?? false;

            if ($any) {
                return $user->hasAnyPermission($permissions);
            }

            return $user->hasAllPermissions($permissions);
        }));
    }

    private function fetchWidgetData(string $widgetId, User $user): array
    {
        return match ($widgetId) {
            'myProtocols' => [
                'total' => $user->roles->contains('name', 'student')
                    ? $user->protocols()->count()
                    : 0,
            ],
            default => [],
        };
    }
}
