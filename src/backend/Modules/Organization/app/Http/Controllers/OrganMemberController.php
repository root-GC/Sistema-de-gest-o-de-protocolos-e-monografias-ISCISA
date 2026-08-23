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
 *
 * Listar docentes disponíveis para serem membros/revisores
 * do órgão do presidente autenticado.
 *
 * Regras:
 *
 * 1. Se o órgão atual for um Núcleo:
 *    - mostrar apenas docentes pertencentes a esse próprio Núcleo;
 *
 * 2. Se o órgão atual for um Comité/órgão:
 *    - mostrar docentes pertencentes ao Núcleo Científico;
 *
 * 3. Em ambos os casos:
 *    - excluir docentes que já possuem OrganMember ativo
 *      neste órgão.
 */
public function availableTeachers(Request $request)
{
    $actorProfile = $request->user()->adminProfile;

    if (!$actorProfile || !$actorProfile->organ_id) {
        return response()->json([
            'message' => 'Sem permissão.',
        ], 403);
    }

    // Órgão do presidente autenticado
    $organ = Organ::findOrFail($actorProfile->organ_id);

    /*
     * IDs dos utilizadores que já são membros ATIVOS
     * deste órgão.
     *
     * Um professor pode continuar a existir como membro
     * soft-deleted e, nesse caso, poderá ser reativado
     * pelo inviteService.
     */
    $existingMemberIds = OrganMember::where('organ_id', $organ->id)
        ->whereNull('deleted_at')
        ->pluck('user_id')
        ->toArray();

    /*
     * Começamos pelos docentes.
     */
    $query = User::whereHas('roles', function ($q) {
        $q->where('name', 'teacher');
    });

    /*
     * ============================================================
     * CASO 1 — O PRÓPRIO ÓRGÃO É UM NÚCLEO
     * ============================================================
     *
     * O docente precisa pertencer a este Núcleo específico.
     */
    if ($organ->type === 'nucleus') {

        $query->whereHas('teacherProfile', function ($q) use ($organ) {

            $q->whereHas('scientificArea', function ($q) use ($organ) {

                $q->where('organ_id', $organ->id);

            });

        });

    /*
     * ============================================================
     * CASO 2 — O ÓRGÃO É UM COMITÉ / OUTRO ÓRGÃO
     * ============================================================
     *
     * O docente precisa pertencer ao Núcleo Científico.
     */
    } else {

        $nucleoIds = Organ::where('type', 'nucleus')
        ->pluck('id');

        if (!$nucleoIds) {
            return response()->json([
                'message' => 'Núcleo Científico não encontrado.',
            ], 404);
        }

        $query->whereHas('teacherProfile', function ($q) use ($nucleoIds) {

            $q->whereHas('scientificArea', function ($q) use ($nucleoIds) {

                $q->whereIn('organ_id', $nucleoIds);

            });

        });
    }

    /*
     * Não mostrar quem já é membro ATIVO deste órgão.
     */
    $query->whereNotIn('id', $existingMemberIds);

    /*
     * Pesquisa.
     *
     * O whereNested é importante para o OR não quebrar
     * as outras condições da query.
     */
    $query->when($request->search, function ($q, $search) {

        $q->where(function ($q) use ($search) {

            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");

        });

    });

    /*
     * Dados necessários para o frontend.
     */
    $teachers = $query
        ->select('id', 'name', 'email', 'status')
        ->where('status', 'active')
        ->with([
            'teacherProfile' => function ($q) {

                $q->select(
                    'id',
                    'user_id',
                    'scientific_area_id',
                    'academic_degree'
                )
                ->with([
                    'scientificArea' => function ($q) {

                        $q->select(
                            'id',
                            'name',
                            'organ_id'
                        );

                    },
                ]);

            },
        ])
        ->orderBy('name')
        ->paginate($request->per_page ?? 20);

    return response()->json([
        'data' => collect($teachers->items())->map(fn ($t) => [

            'id' => $t->id,

            'name' => $t->name,

            'email' => $t->email,

            'status' => $t->status,

            'academic_degree' =>
                $t->teacherProfile?->academic_degree,

            'scientific_area' =>
                $t->teacherProfile?->scientificArea?->name,

            'scientific_area_id' =>
                $t->teacherProfile?->scientificArea?->id,

        ]),

        'total' => $teachers->total(),

        'current_page' => $teachers->currentPage(),

        'last_page' => $teachers->lastPage(),
    ]);
}


  /**
 * POST /api/v1/organ-members/invite
 *
 * Promover um docente a revisor do órgão.
 *
 * Regras:
 *
 * - Se o órgão for um Núcleo:
 *   o docente precisa pertencer ao próprio Núcleo.
 *
 * - Se o órgão for um Comité:
 *   qualquer docente pode ser promovido.
 *
 * A ScientificArea NÃO é critério de elegibilidade
 * para os Comitês.
 *
 * Em ambos os casos, o resultado é:
 *
 * OrganMember {
 *     user_id,
 *     organ_id,
 *     role = reviewer
 * }
 */
public function invite(Request $request)
{
    $actorProfile = $request->user()->adminProfile;

    if (!$actorProfile || !$actorProfile->organ_id) {
        return response()->json([
            'message' => 'Sem permissão.',
        ], 403);
    }

    /*
     * ============================================================
     * ÓRGÃO DO PRESIDENTE AUTENTICADO
     * ============================================================
     */
    $organ = Organ::findOrFail($actorProfile->organ_id);

    /*
     * ============================================================
     * VALIDAR UTILIZADOR
     * ============================================================
     */
    $data = $request->validate([
        'user_id' => [
            'required',
            'integer',
            'exists:users,id',
        ],
    ]);

    /*
     * Buscar o utilizador.
     */
    $teacher = User::findOrFail($data['user_id']);

    /*
     * ============================================================
     * GARANTIR QUE É DOCENTE
     * ============================================================
     *
     * Esta é a regra geral:
     *
     * Para ser revisor, o utilizador precisa ser teacher.
     *
     * Não verificamos ScientificArea aqui.
     */
    if (!$teacher->hasRole('teacher')) {

        return response()->json([
            'message' => 'Este utilizador não possui a função de docente.',
        ], 422);
    }

    /*
     * ============================================================
     * REGRA ESPECÍFICA DOS NÚCLEOS
     * ============================================================
     *
     * Se o presidente pertence a um Núcleo,
     * só pode promover docentes desse próprio Núcleo.
     *
     * Para Comitês NÃO fazemos esta verificação.
     */
    if ($organ->type === 'nucleus') {

        $belongsToOrgan = $teacher->teacherProfile()
            ->whereHas('scientificArea', function ($q) use ($organ) {
                $q->where('organ_id', $organ->id);
            })
            ->exists();

        if (!$belongsToOrgan) {

            return response()->json([
                'message' =>
                    'Este docente não pertence a este Núcleo.',
            ], 422);
        }
    }

    /*
     * ============================================================
     * VERIFICAR MEMBRO ATIVO
     * ============================================================
     *
     * Um utilizador não pode ter dois OrganMember ativos
     * para o mesmo órgão.
     */
    $existingActiveMember = OrganMember::where('organ_id', $organ->id)
        ->where('user_id', $teacher->id)
        ->whereNull('deleted_at')
        ->first();

    if ($existingActiveMember) {

        return response()->json([
            'message' =>
                'Este docente já é membro ativo deste órgão.',
        ], 422);
    }

    /*
     * ============================================================
     * PROMOVER / ADICIONAR COMO REVISOR
     * ============================================================
     *
     * O ReviewerInviteService é responsável por:
     *
     * - criar o OrganMember;
     * - restaurar um membro soft-deleted, se existir;
     * - definir role = reviewer;
     * - enviar a notificação/email;
     * - executar rollback em caso de erro.
     */
    try {

        $member = $this->inviteService->invite(
            $teacher,
            $organ
        );

        /*
         * Verificar se o service restaurou um membro
         * anteriormente removido.
         */
        $wasRestored = $member->wasRecentlyCreated === false;

        return response()->json([

            'message' => $wasRestored
                ? 'Docente reativado como revisor. Email enviado.'
                : 'Docente promovido como revisor. Email enviado.',

            'member' => $member->load([
                'user',
            ]),

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