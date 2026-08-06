<?php

namespace Modules\Organization\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Organization\app\Models\Organ;
use Modules\Organization\app\Models\OrganMember;
use Modules\Organization\app\Services\ReviewerInviteService as InviteService;
use Modules\User\app\Models\User;
use Modules\User\app\Models\Role;

class OrganMemberController extends Controller
{
    protected $inviteService;

     public function __construct(InviteService $inviteService)
    {
        $this->inviteService = $inviteService;
    }

    /**
     * GET /api/v1/organ-members
     * Listar membros do órgão do presidente autenticado
     */
    public function index(Request $request)
    {
        $actorProfile = $request->user()->adminProfile;
        
        if (!$actorProfile || !$actorProfile->organ_id) {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $organId = $actorProfile->organ_id;

        $members = OrganMember::with(['user' => function ($q) {
                $q->select('id', 'name', 'email', 'status');
            }])
            ->where('organ_id', $organId)
            ->orderBy('role')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $members->map(fn ($m) => [
                'id'         => $m->id,
                'user_id'    => $m->user_id,
                'organ_id'   => $m->organ_id,
                'role'       => $m->role,
                'user'       => $m->user,
                'created_at' => $m->created_at,
            ]),
        ]);
    }

    /**
     * GET /api/v1/organ-members/available-teachers
     * Listar docentes do Núcleo Científico disponíveis para convidar
     * (que ainda NÃO são membros do órgão do presidente)
     */
   public function availableTeachers(Request $request)
{
    $actorProfile = $request->user()->adminProfile;
    
    if (!$actorProfile || !$actorProfile->organ_id) {
        return response()->json(['message' => 'Sem permissão.'], 403);
    }

    $organId = $actorProfile->organ_id;

    // Buscar o Núcleo Científico
    $nucleoOrgan = Organ::where('type', 'nucleus')->first();
    
    if (!$nucleoOrgan) {
        return response()->json(['message' => 'Núcleo Científico não encontrado.'], 404);
    }

    // 🆕 IDs dos membros que já pertencem ao órgão (incluindo soft-deleted)
    $existingMemberIds = OrganMember::withTrashed()
        ->where('organ_id', $organId)
        ->whereNull('deleted_at') // Apenas os ativos (não soft-deleted)
        ->pluck('user_id')
        ->toArray();

    // Buscar docentes do Núcleo que NÃO são membros ativos deste órgão
    $teachers = User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))
        ->whereHas('teacherProfile', function ($q) use ($nucleoOrgan) {
            $q->whereHas('scientificArea', function ($q) use ($nucleoOrgan) {
                $q->where('organ_id', $nucleoOrgan->id);
            });
        })
        ->whereNotIn('id', $existingMemberIds)
        ->where('status', 'active')
        ->select('id', 'name', 'email', 'status')
        ->with(['teacherProfile' => function ($q) {
            $q->select('id', 'user_id', 'scientific_area_id', 'academic_degree')
              ->with(['scientificArea' => function ($q) {
                  $q->select('id', 'name');
              }]);
        }])
        ->when($request->search, fn ($q) => 
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('email', 'like', "%{$request->search}%")
        )
        ->orderBy('name')
        ->paginate($request->per_page ?? 20);

    return response()->json([
        'data' => collect($teachers->items())->map(fn ($t) => [
            'id'                => $t->id,
            'name'              => $t->name,
            'email'             => $t->email,
            'status'            => $t->status,
            'academic_degree'   => $t->teacherProfile?->academic_degree,
            'scientific_area'   => $t->teacherProfile?->scientificArea?->name,
            'scientific_area_id' => $t->teacherProfile?->scientific_area_id,
        ]),
        'total'        => $teachers->total(),
        'current_page' => $teachers->currentPage(),
        'last_page'    => $teachers->lastPage(),
    ]);
}

    /**
     * POST /api/v1/organ-members/invite
     * Convidar docente do Núcleo para ser revisor no órgão do presidente
     */
       // ... (index, availableTeachers - mantêm-se iguais)

    /**
     * POST /api/v1/organ-members/invite
     */
    public function invite(Request $request)
    {
        $actorProfile = $request->user()->adminProfile;
        
        if (!$actorProfile || !$actorProfile->organ_id) {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $organId = $actorProfile->organ_id;
        $organ = Organ::findOrFail($organId);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $teacher = User::findOrFail($data['user_id']);

        // Verificar se é um docente do Núcleo Científico
        $hasTeacherProfile = $teacher->teacherProfile()
            ->whereHas('scientificArea', function ($q) {
                $q->whereHas('organ', fn ($q) => $q->where('type', 'nucleus'));
            })
            ->exists();

        if (!$hasTeacherProfile) {
            return response()->json([
                'message' => 'Este utilizador não é um docente do Núcleo Científico.',
            ], 422);
        }

        // Verificar se já é membro ATIVO deste órgão
        $existingActiveMember = OrganMember::where('organ_id', $organId)
            ->where('user_id', $teacher->id)
            ->whereNull('deleted_at')
            ->first();

        if ($existingActiveMember) {
            return response()->json([
                'message' => 'Este docente já é membro ativo deste órgão.',
            ], 422);
        }

        try {
            $member = $this->inviteService->invite($teacher, $organ);

            $wasRestored = $member->wasRecentlyCreated === false;

            return response()->json([
                'message' => $wasRestored 
                    ? 'Docente reativado como revisor. Email enviado.'
                    : 'Docente convidado como revisor. Email enviado.',
                'member'  => $member->load('user'),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/v1/organ-members/{id}
     */
    public function update(Request $request, $id)
    {
        $actorProfile = $request->user()->adminProfile;
        
        if (!$actorProfile || !$actorProfile->organ_id) {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $member = OrganMember::where('organ_id', $actorProfile->organ_id)
            ->findOrFail($id);

        $data = $request->validate([
            'role' => ['required', 'string', 'in:president,coordinator,reviewer,member'],
        ]);

        $oldRole = $member->role;
        $member->update(['role' => $data['role']]);

        // Atualizar roles do utilizador
        $user = $member->user;
        $newRole = Role::firstOrCreate(['name' => $data['role']]);
        if (!$user->hasRole($data['role'])) {
            $user->roles()->syncWithoutDetaching([$newRole->id]);
        }

        // Enviar email se a role mudou
        if ($oldRole !== $data['role']) {
            $this->inviteService->notifyRoleChange($user, $member->organ, $data['role']);
        }

        return response()->json([
            'message' => 'Função atualizada com sucesso.',
            'member'  => $member->fresh()->load('user'),
        ]);
    }

    /**
     * DELETE /api/v1/organ-members/{id}
     * Soft delete - remove o membro e opcionalmente a role
     */
    public function destroy(Request $request, $id)
    {
        $actorProfile = $request->user()->adminProfile;
        
        if (!$actorProfile || !$actorProfile->organ_id) {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $member = OrganMember::where('organ_id', $actorProfile->organ_id)
            ->findOrFail($id);

        if ($member->role === 'president') {
            return response()->json([
                'message' => 'Não é possível remover o presidente do órgão.',
            ], 422);
        }

        // 🆕 Usar o service para remover com rollback e email
        $removeRole = $request->input('remove_role', true);
        $this->inviteService->removeMember($member, $removeRole);

        return response()->json([
            'message' => 'Membro removido do órgão. Email enviado.',
        ]);
    }

    /**
     * DELETE /api/v1/organ-members/{id}/force
     * Force delete - remove permanentemente
     */
    public function forceDestroy(Request $request, $id)
    {
        $actorProfile = $request->user()->adminProfile;
        
        if (!$actorProfile || !$actorProfile->organ_id) {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $member = OrganMember::withTrashed()
            ->where('organ_id', $actorProfile->organ_id)
            ->findOrFail($id);

        if ($member->role === 'president') {
            return response()->json([
                'message' => 'Não é possível remover o presidente do órgão.',
            ], 422);
        }

        $this->inviteService->forceRemoveMember($member);

        return response()->json([
            'message' => 'Membro removido permanentemente.',
        ]);
    }
}