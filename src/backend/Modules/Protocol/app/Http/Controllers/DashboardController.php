<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    public function myProtocols(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'total' => $user->protocols()->count(),
            'items' => $user->protocols()
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }
}