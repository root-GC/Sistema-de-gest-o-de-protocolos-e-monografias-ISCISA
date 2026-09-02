<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Services\ScientificDirectionActivityService;

class GeneralAdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(app(ScientificDirectionActivityService::class)->dashboard($request->user()));
    }
}
