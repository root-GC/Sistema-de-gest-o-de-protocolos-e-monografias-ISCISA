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

        $nucleoOrgan = Organ::where('type', 'nucleus')->first();

        if (!$nucleoOrgan) {
            return response()->json([
                'message' => 'Núcleo Científico não encontrado.',
            ], 404);
        }

        $query->whereHas('teacherProfile', function ($q) use ($nucleoOrgan) {

            $q->whereHas('scientificArea', function ($q) use ($nucleoOrgan) {

                $q->where('organ_id', $nucleoOrgan->id);

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
 * Convidar/promover um docente para ser revisor do órgão.
 *
 * Regras:
 *
 * - Se o órgão for um Núcleo:
 *   o docente precisa pertencer a esse próprio Núcleo.
 *
 * - Se o órgão for um Comité/outro órgão:
 *   o docente precisa pertencer ao Núcleo Científico.
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
     * Órgão do presidente autenticado.
     */
    $organ = Organ::findOrFail($actorProfile->organ_id);

    /*
     * Validar utilizador recebido.
     */
    $data = $request->validate([
        'user_id' => [
            'required',
            'integer',
            'exists:users,id',
        ],
    ]);

    /*
     * Buscar docente.
     */
    $teacher = User::findOrFail($data['user_id']);

    /*
     * ============================================================
     * VALIDAR SE O DOCENTE PODE SER CONVIDADO
     * ============================================================
     */

    if ($organ->type === 'nucleus') {

        /*
         * O próprio órgão é um Núcleo.
         *
         * Portanto, o professor precisa pertencer
         * EXATAMENTE a este Núcleo.
         */
        $allowed = $teacher->teacherProfile()
            ->whereHas('scientificArea', function ($q) use ($organ) {

                $q->where('organ_id', $organ->id);

            })
            ->exists();

    } else {

        /*
         * O órgão é um Comité/outro órgão.
         *
         * O professor precisa pertencer ao Núcleo Científico.
         */
        $nucleoOrgan = Organ::where('type', 'nucleus')->first();

        if (!$nucleoOrgan) {
            return response()->json([
                'message' => 'Núcleo Científico não encontrado.',
            ], 404);
        }

        $allowed = $teacher->teacherProfile()
            ->whereHas('scientificArea', function ($q) use ($nucleoOrgan) {

                $q->where('organ_id', $nucleoOrgan->id);

            })
            ->exists();
    }

    /*
     * Docente não pertence ao Núcleo permitido.
     */
    if (!$allowed) {

        return response()->json([
            'message' =>
                'Este docente não pertence ao Núcleo Científico permitido para este órgão.',
        ], 422);
    }

    /*
     * Garantir que o utilizador é realmente docente.
     */
    if (!$teacher->hasRole('teacher')) {

        return response()->json([
            'message' => 'Este utilizador não possui a função de docente.',
        ], 422);
    }

    /*
     * ============================================================
     * VERIFICAR MEMBRO ATIVO
     * ============================================================
     *
     * Se já existe OrganMember ativo neste órgão,
     * não podemos criar outro.
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
     * CONVIDAR / PROMOVER
     * ============================================================
     *
     * O service é responsável por:
     *
     * - criar o OrganMember;
     * - ou restaurar um soft-deleted;
     * - definir role = reviewer;
     * - enviar o email;
     * - executar eventual rollback.
     */
    try {

        $member = $this->inviteService->invite(
            $teacher,
            $organ
        );

        /*
         * O service pode ter restaurado um membro soft-deleted
         * em vez de criar um novo.
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