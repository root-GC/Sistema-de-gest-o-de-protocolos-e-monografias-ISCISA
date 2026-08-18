<?php

// Modules/Organization/App/Http/Controllers/TeacherProfileController.php

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
            ->loadMissing('teacherProfile.scientificArea');
        
        return response()->json([
            'data' => $user,
            'profile_complete' => $this->isProfileComplete($user),
        ]);
    }

    // PUT /api/v1/teacher/profile
    public function update(Request $request)
    {
        $user = $request->user();
        $profile = $user->teacherProfile;
        
        if (!$profile) {
            // Criar perfil se não existir
            $profile = TeacherProfile::create([
                'user_id' => $user->id,
            ]);
        }

        // Validação apenas dos campos do perfil
        $data = $request->validate([
            'department'      => ['sometimes', 'nullable', 'string', 'max:150'],
            'academic_degree' => ['sometimes', 'nullable', 'string', 'in:' . implode(',', TeacherProfile::DEGREES)],
        ]);

        // Atualizar apenas department e academic_degree
        if (isset($data['department'])) {
            $profile->department = $data['department'];
        }
        
        if (isset($data['academic_degree'])) {
            $profile->academic_degree = $data['academic_degree'];
        }
        
        $profile->save();

        // Atualizar nome se fornecido (opcional)
        if ($request->filled('name')) {
            $validatedName = $request->validate([
                'name' => ['required', 'string', 'max:255']
            ]);
            
            $user->update([
                'name' => $validatedName['name']
            ]);
        }

        // Recarregar APENAS o perfil do professor
        $user = $user->fresh()->load('teacherProfile.scientificArea');

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'data' => $user,
            'profile_complete' => $this->isProfileComplete($user),
        ]);
    }

    /**
     * Verificar se o perfil do docente está completo
     */
    private function isProfileComplete($user): bool
    {
        $teacherProfile = $user->teacherProfile;
        
        if (!$teacherProfile) {
            return false;
        }
        
        return $teacherProfile->isComplete();
    }
}