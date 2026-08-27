<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Auth\app\Services\AdminInviteService;
use Modules\Organization\app\Models\Organ;
use Modules\User\app\Models\User;

class AdminUserController extends Controller
{
    public function __construct(private AdminInviteService $inviteService) {}

    // GET /api/v1/admin/users — Listar todos os utilizadores
    public function index(Request $request)
    {
        Log::info('[AdminUserController] index chamado', [
            'user_id' => $request->user()?->id,
            'params'  => $request->all(),
        ]);

        $users = User::with('roles', 'adminProfile.organ')
            ->when($request->role, fn ($q) => $q->whereHas('roles', fn ($q) => $q->where('name', $request->role)))
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->paginate($request->per_page ?? 15);

        Log::info('[AdminUserController] index — users retornados', [
            'count' => $users->count(),
            'total' => $users->total(),
        ]);

        return response()->json([
            'data'         => collect($users->items())->map(fn ($u) => $this->transform($u)),
            'total'        => $users->total(),
            'current_page' => $users->currentPage(),
        ]);
    }

    // GET /api/v1/admin/users/{id} — Ver um utilizador
    public function show($id)
    {
        Log::info('[AdminUserController] show chamado', ['id' => $id]);

        $user = User::with('roles.permissions', 'adminProfile.organ')->findOrFail($id);

        return response()->json(['data' => $this->transform($user)]);
    }

    /**
     * POST /api/v1/admin/users — Adicionar executivo de órgão + enviar email de acesso
     *
     * Duplo portão:
     *   Técnico (access_scope = global)        → só pode criar o executivo da Direção Científica.
     *   Executivo da Direção Científica (organ) → só pode criar os outros 3 executivos.
     *   Qualquer outro                          → 403.
     */
    public function store(Request $request)
    {
        Log::info('[AdminUserController] store chamado', [
            'user_id' => $request->user()?->id,
            'payload' => $request->except(['password', 'password_confirmation']),
        ]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'organ_id' => ['required', 'integer', 'exists:organs,id'],
        ]);

        $actorProfile = $request->user()->adminProfile;

        if (! $actorProfile) {
            Log::warning('[AdminUserController] store — actor sem adminProfile', [
                'user_id' => $request->user()?->id,
            ]);
            return response()->json(['message' => 'Sem permissão para criar administradores.'], 403);
        }

        $targetOrgan = Organ::findOrFail($data['organ_id']);

        if (! $this->canManageOrgan($actorProfile, $targetOrgan)) {
            return response()->json([
                'message' => $actorProfile->isGlobal()
                    ? 'O Administrador Técnico só pode criar o executivo da Direção Científica.'
                    : 'Não é possível criar outro executivo para a Direção Científica.',
            ], 403);
        }

        // if ($targetOrgan->adminProfiles()->exists()) {
        //     return response()->json(['message' => 'Este órgão já tem um executivo atribuído.'], 422);
        // }

        // Verifica se já existe um executivo ativo neste órgão.
        // Executivos inativos ou eliminados (deleted_at) permitem nova criação.
        $hasActiveExecutive = $targetOrgan
            ->adminProfiles()
            ->whereHas('user', function ($query) {
                $query->where('status', 'active')
                    ->whereNull('deleted_at');
            })
            ->exists();

        if ($hasActiveExecutive) {
            return response()->json([
                'message' => 'Este órgão já possui um executivo ativo.',
            ], 422);
        }

        try {
            $user = $this->inviteService->invite([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'organ_id' => $targetOrgan->id,
            ]);

            Log::info('[AdminUserController] store — executivo adicionado e email enviado', [
                'user_id'  => $user->id,
                'organ_id' => $targetOrgan->id,
            ]);

            return response()->json([
                'message' => 'Administrador/a adicionado/a com sucesso. Email enviado.',
                'user'    => $this->transform($user->load('roles', 'adminProfile.organ')),
            ], 201);
        } catch (\Exception $e) {
            Log::error('[AdminUserController] store — ERRO', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Erro ao criar administrador: ' . $e->getMessage(),
            ], 500);
        }
    }

    // PUT /api/v1/admin/users/{id} — Atualizar utilizador (inclui activar/desativar)
    public function update(Request $request, $id)
    {
        Log::info('[AdminUserController] update chamado', [
            'id'      => $id,
            'user_id' => $request->user()?->id,
            'payload' => $request->except(['password']),
        ]);

        $user = User::with('adminProfile.organ')->findOrFail($id);

        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', 'unique:users,email,' . $id],
            'status'   => ['sometimes', 'in:active,inactive'],
            'organ_id' => ['sometimes', 'integer', 'exists:organs,id'],
        ]);

        // Trocar o organ_id de um executivo é tão sensível quanto criá-lo —
        // aplica-se o mesmo portão do store().
        if (isset($data['organ_id']) && $user->adminProfile) {
            $actorProfile = $request->user()->adminProfile;
            $newOrgan     = Organ::findOrFail($data['organ_id']);

            if (! $actorProfile || ! $this->canManageOrgan($actorProfile, $newOrgan)) {
                Log::warning('[AdminUserController] update — tentativa de mudar organ_id sem permissão', [
                    'actor_id' => $request->user()->id,
                    'target'   => $id,
                ]);
                return response()->json(['message' => 'Sem permissão para atribuir este órgão.'], 403);
            }

            $user->adminProfile->update(['organ_id' => $data['organ_id']]);
        }

        // Activar/desativar/editar nome/email — protegido apenas por ser preciso
        // ter adminProfile próprio (já garantido pela rota + middleware do grupo).
        // Não deixa ninguém desactivar-se a si próprio por engano/acidente.
        if (isset($data['status']) && $user->id === $request->user()->id) {
            return response()->json(['message' => 'Não pode alterar o seu próprio estado por aqui.'], 422);
        }

        $user->update(collect($data)->except('organ_id')->toArray());

        Log::info('[AdminUserController] update — utilizador atualizado', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Utilizador atualizado.',
            'user'    => $this->transform($user->fresh()->load('roles', 'adminProfile.organ')),
        ]);
    }

    // DELETE /api/v1/admin/users/{id} — Eliminar utilizador
    public function destroy(Request $request, $id)
    {
        Log::info('[AdminUserController] destroy chamado', ['id' => $id]);

        $user = User::with('adminProfile.organ')->findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Não pode eliminar a sua própria conta.'], 422);
        }

        $actorProfile = $request->user()->adminProfile;

        // Só pode eliminar executivos dentro do mesmo âmbito que pode criar/editar.
        if ($user->adminProfile) {
            if (! $actorProfile || ! $this->canManageOrgan($actorProfile, $user->adminProfile->organ)) {
                Log::warning('[AdminUserController] destroy — tentativa sem permissão', [
                    'actor_id' => $request->user()->id,
                    'target'   => $id,
                ]);
                return response()->json(['message' => 'Sem permissão para eliminar este administrador.'], 403);
            }
        }

        $user->delete();

        Log::info('[AdminUserController] destroy — utilizador eliminado', ['id' => $id]);

        return response()->json(['message' => 'Utilizador eliminado.']);
    }

    /**
     * Regra central do duplo portão — reutilizada em store/update/destroy
     * para não haver 3 cópias da mesma lógica a desalinhar com o tempo.
     */
    private function canManageOrgan($actorProfile, ?Organ $targetOrgan): bool
    {
        if (! $targetOrgan) {
            return false;
        }

        if ($actorProfile->isGlobal()) {
            return $targetOrgan->isScientificDirection();
        }

        if ($actorProfile->isDirecaoCientifica()) {
            return ! $targetOrgan->isScientificDirection();
        }

        return false;
    }

    /**
     * Molda a resposta para o formato que o frontend espera:
     * user.profiles.admin.organ_id / user.profiles.admin.organ
     */
    private function transform(User $user): array
    {
        $data = $user->toArray();

        $data['profiles'] = [
            'admin' => $user->adminProfile ? [
                'id'        => $user->adminProfile->id,
                'organ_id'  => $user->adminProfile->organ_id,
                'organ'     => $user->adminProfile->organ,
            ] : null,
        ];

        return $data;
    }
}
