<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('users')->with('permissions:id,code,description')->get();
        return response()->json(['data' => $roles]);
    }

    public function show(int $id)
    {
        $role = Role::with('permissions')->withCount('users')->findOrFail($id);
        return response()->json(['data' => $role]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => [
                'required', 'string', 'max:100',
                Rule::unique('roles', 'name')->whereNull('deleted_at'),
            ],
            'description'   => ['required', 'string'],
            'permissions'   => ['array'],
            'permissions.*' => ['string', 'exists:permissions,code'],
        ]);

        $existingTrashed = Role::onlyTrashed()->where('name', $data['name'])->first();
        if ($existingTrashed) {
            $existingTrashed->restore();
            $existingTrashed->update(['description' => $data['description']]);
            $role = $existingTrashed;
        } else {
            $role = Role::create([
                'name'        => $data['name'],
                'description' => $data['description'],
            ]);
        }

        $this->syncPermissions($role, $data['permissions'] ?? []);

        return response()->json(['message' => 'Role criada com sucesso.', 'role' => $role->load('permissions')], 201);
    }

    public function update(Request $request, int $id)
    {
        $role = Role::findOrFail($id);

        $data = $request->validate([
            'description'   => ['sometimes', 'string'],
            'permissions'   => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,code'],
        ]);

        if (isset($data['description'])) {
            $role->update(['description' => $data['description']]);
        }

        if (isset($data['permissions'])) {
            $this->syncPermissions($role, $data['permissions']);
        }

        return response()->json(['message' => 'Role actualizada com sucesso.', 'role' => $role->load('permissions')]);
    }

    public function destroy(int $id)
    {
        $role = Role::withCount('users')->findOrFail($id);

        if ($role->users_count > 0) {
            return response()->json([
                'message' => "Não é possível remover: {$role->users_count} utilizador(es) ainda tem(êm) esta role atribuída.",
            ], 422);
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->json(['message' => 'Role removida com sucesso.']);
    }

    private function syncPermissions(Role $role, array $codes): void
    {
        $permIds = Permission::whereIn('code', $codes)->pluck('id');
        $role->permissions()->sync($permIds);
    }
}