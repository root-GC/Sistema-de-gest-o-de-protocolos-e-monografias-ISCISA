<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Modules\User\app\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Permission::orderBy('code')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code'        => [
                'required', 'string', 'max:150',
                'regex:/^[a-z]+(\.[a-z_]+)+$/',
                Rule::unique('permissions', 'code')->whereNull('deleted_at'),
            ],
            'description' => ['required', 'string'],
        ]);

        $existingTrashed = Permission::onlyTrashed()->where('code', $data['code'])->first();
        if ($existingTrashed) {
            $existingTrashed->restore();
            $existingTrashed->update(['description' => $data['description']]);
            $permission = $existingTrashed;
        } else {
            $permission = Permission::create($data);
        }

        return response()->json(['message' => 'Permission criada com sucesso.', 'permission' => $permission], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate(['description' => ['required', 'string']]);

        $permission = Permission::findOrFail($id);
        $permission->update(['description' => $data['description']]);

        return response()->json(['message' => 'Permission actualizada com sucesso.']);
    }

    public function destroy(int $id)
    {
        $permission = Permission::findOrFail($id);

        $rolesUsing = $permission->roles()->count();
        if ($rolesUsing > 0) {
            return response()->json([
                'message' => "Não é possível remover: usada por {$rolesUsing} role(s). Remova-a dessas roles primeiro.",
            ], 422);
        }

        $permission->delete();

        return response()->json(['message' => 'Permission removida com sucesso.']);
    }
}