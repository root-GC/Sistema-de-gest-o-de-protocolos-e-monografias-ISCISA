<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\User\app\Models\Organ;

class AdminOrganController extends Controller
{
    // GET /api/v1/admin/organs — Listar órgãos
    public function index()
    {
        $organs = Organ::orderBy('name')->get();

        return response()->json([
            'data' => $organs,
        ]);
    }

    // GET /api/v1/admin/organs/{id} — Ver um órgão
    public function show($id)
    {
        $organ = Organ::with('scientificAreas.courses')->findOrFail($id);

        return response()->json([
            'data' => $organ,
        ]);
    }
}