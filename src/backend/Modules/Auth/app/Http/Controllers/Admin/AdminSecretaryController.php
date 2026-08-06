<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Services\SecretaryInviteService;
use Modules\Organization\app\Models\Organ;
use Modules\User\app\Models\Permission;
use Modules\User\app\Models\User;

class AdminSecretaryController extends Controller
{
    public function __construct(private SecretaryInviteService $inviteService) {}

    private function actorOrgan(Request $request): Organ
    {
        $profile = $request->user()->adminProfile;
        abort_unless($profile && $profile->organ, 403, 'Sem permissão para gerir secretárias.');
        return $profile->organ;
    }

    public function store(Request $request)
    {
        $organ = $this->actorOrgan($request);

        $data = $request->validate([
            'name'               => ['required', 'string', 'max:255'],
            'email'              => ['required', 'email', 'unique:users,email'],
            'scientific_area_id' => ['nullable', 'integer', 'exists:scientific_areas,id'],
            'office'             => ['nullable', 'string', 'max:150'],
        ]);

        $data['organ_id'] = $organ->id; // nunca vindo do request

        $user = $this->inviteService->invite($data);

        return response()->json([
            'message' => 'Convite enviado com sucesso.',
            'user'    => $user->load('secretaryProfile.organ', 'roles'),
        ], 201);
    }

    public function index(Request $request)
    {
        $organ = $this->actorOrgan($request);

        $users = User::with('secretaryProfile')
            ->whereHas('roles', fn ($q) => $q->where('name', 'secretary'))
            ->whereHas('secretaryProfile', fn ($q) => $q->where('organ_id', $organ->id))
            ->get();

        return response()->json(['data' => $users]);
    }

    // POST /api/v1/admin/secretaries/{id}/permissions
    public function grantPermission(Request $request, int $id)
    {
        $organ = $this->actorOrgan($request);
        $secretary = $this->findOwnSecretary($id, $organ->id);

        $data = $request->validate(['code' => ['required', 'string', 'exists:permissions,code']]);
        $permission = Permission::where('code', $data['code'])->first();

        $secretary->directPermissions()->syncWithoutDetaching([$permission->id]);

        return response()->json(['message' => 'Permissão atribuída.']);
    }

    // DELETE /api/v1/admin/secretaries/{id}/permissions/{code}
    public function revokePermission(Request $request, int $id, string $code)
    {
        $organ = $this->actorOrgan($request);
        $secretary = $this->findOwnSecretary($id, $organ->id);

        $permission = Permission::where('code', $code)->firstOrFail();
        $secretary->directPermissions()->detach($permission->id);

        return response()->json(['message' => 'Permissão retirada.']);
    }

    private function findOwnSecretary(int $id, int $organId): User
    {
        $secretary = User::with('secretaryProfile')->findOrFail($id);

        abort_unless(
            $secretary->hasRole('secretary') && $secretary->secretaryProfile?->organ_id === $organId,
            403,
            'Esta secretária não pertence ao teu órgão.'
        );

        return $secretary;
    }
}