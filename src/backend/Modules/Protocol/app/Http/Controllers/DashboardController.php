<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Builders\Dashboard\DashboardBuilderFactory;

class DashboardController extends Controller
{
    public function __construct(private DashboardBuilderFactory $factory) {}

    /**
     * Um único endpoint, payload diferente por role.
     * GET /api/v1/dashboard?role=student
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $request->query('role', $user->roles->first()?->name);

        return response()->json(
            $this->factory->for($role)->build($user)
        );
    }

    /**
     * Mantido só se ainda tiveres algo a consumir este endpoint antigo.
     * Podes remover assim que o frontend passar a usar /dashboard.
     */
    public function myProtocols(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'total' => $user->protocols()->count(),
            'items' => $user->protocols()->latest()->take(5)->get(),
        ]);
    }
}