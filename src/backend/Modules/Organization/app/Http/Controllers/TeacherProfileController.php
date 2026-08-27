<?php

namespace Modules\Organization\App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Organization\app\Models\TeacherProfile;

class TeacherProfileController extends Controller
{
    // GET /api/v1/teacher/profile
    public function show(Request $request)
    {
        $user = $request->user()
            ->loadMissing('roles.permissions', 'teacherProfile.scientificArea', 'teacherProfile.course');

        return response()->json([
            'data'              => $user,
            'permissions'       => $this->flattenPermissions($user),
            'profile_complete'  => $this->isProfileComplete($user),
        ]);
    }

    // PUT /api/v1/teacher/profile
    public function update(Request $request)
    {
        $user = $request->user();
        $profile = $user->teacherProfile;

        if (!$profile) {
            $profile = TeacherProfile::create([
                'user_id' => $user->id,
            ]);
        }

        $data = $request->validate([
            'department'      => ['sometimes', 'nullable', 'string', 'max:150'],
            'academic_degree' => ['sometimes', 'nullable', 'string', 'in:' . implode(',', TeacherProfile::DEGREES)],
        ]);

        if (isset($data['department'])) {
            $profile->department = $data['department'];
        }

        if (isset($data['academic_degree'])) {
            $profile->academic_degree = $data['academic_degree'];
        }

        $profile->save();

        if ($request->filled('name')) {
            $validatedName = $request->validate([
                'name' => ['required', 'string', 'max:255']
            ]);

            $user->update([
                'name' => $validatedName['name']
            ]);
        }

        // 🔑 Agora carrega também roles + permissions, senão o frontend
        // recebe roles/permissions vazios e o UserPayload fica incompleto.
        $user = $user->fresh()->load('roles.permissions', 'teacherProfile.scientificArea', 'teacherProfile.course');

        return response()->json([
            'message'           => 'Perfil atualizado com sucesso.',
            'data'              => $user,
            'permissions'       => $this->flattenPermissions($user),
            'profile_complete'  => $this->isProfileComplete($user),
        ]);
    }

    /**
     * Achata as permissions de todas as roles do user numa lista única
     * de códigos (ex: ['document.view', 'workload.view', ...]).
     */
    private function flattenPermissions($user): array
    {
        return $user->roles
            ->flatMap(fn ($role) => $role->permissions->pluck('code'))
            ->unique()
            ->values()
            ->all();
    }

    private function isProfileComplete($user): bool
    {
        $teacherProfile = $user->teacherProfile;

        if (!$teacherProfile) {
            return false;
        }

        return $teacherProfile->isComplete();
    }
}
