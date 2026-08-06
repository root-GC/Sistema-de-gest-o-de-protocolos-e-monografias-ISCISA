<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Services\CoordinatorInviteService;
use Modules\User\app\Models\User;

class AdminCoordinatorController extends Controller
{
    public function __construct(private CoordinatorInviteService $inviteService) {}

    private function assertDirecaoCientifica(Request $request): void
    {
        $profile = $request->user()->adminProfile;

        abort_unless(
            $profile && $profile->isDirecaoCientifica(),
            403,
            'Só o executivo da Direção Científica pode gerir coordenadores.'
        );
    }

    public function store(Request $request)
    {
        $this->assertDirecaoCientifica($request);

        $data = $request->validate([
            'name'               => ['required', 'string', 'max:255'],
            'email'              => ['required', 'email', 'unique:users,email'],
            'scientific_area_id' => ['required', 'integer', 'exists:scientific_areas,id'],
            'course_id'          => ['required', 'integer', 'exists:courses,id'],
            'office'             => ['nullable', 'string', 'max:150'],
        ]);

        $user = $this->inviteService->invite($data);

        return response()->json([
            'message' => 'Convite enviado com sucesso.',
            'user'    => $user->load('coordinatorProfile.course', 'roles'),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $this->assertDirecaoCientifica($request);

        $data = $request->validate([
            'scientific_area_id' => ['sometimes', 'integer', 'exists:scientific_areas,id'],
            'course_id'          => ['sometimes', 'integer', 'exists:courses,id'],
            'office'             => ['sometimes', 'nullable', 'string', 'max:150'],
        ]);

        $user = User::findOrFail($id);
        abort_unless($user->hasRole('coordinator'), 404);

        $user->coordinatorProfile()->update($data);

        return response()->json(['message' => 'Coordenador actualizado.', 'user' => $user->fresh('coordinatorProfile')]);
    }

    public function index(Request $request)
    {
        $this->assertDirecaoCientifica($request);

        $users = User::with('coordinatorProfile.course.scientificArea')
            ->whereHas('roles', fn ($q) => $q->where('name', 'coordinator'))
            ->get();

        return response()->json(['data' => $users]);
    }
}