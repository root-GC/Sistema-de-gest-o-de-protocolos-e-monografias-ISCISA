<?php

namespace Modules\Auth\app\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Auth\app\Services\AdminInviteService;
use Modules\User\app\Models\User;

class AdminUserController extends Controller
{
    public function __construct(private AdminInviteService $service) {}

    // GET /api/v1/admin/users — Listar todos os utilizadores
    public function index(Request $request)
    {
        Log::info('[AdminUserController] index chamado', [
            'user_id' => $request->user()?->id,
            'params' => $request->all(),
        ]);

        $users = User::with('roles')
            ->when($request->role, fn($q) => $q->whereHas('roles', fn($q) => $q->where('name', $request->role)))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->paginate($request->per_page ?? 15);

        Log::info('[AdminUserController] index — users retornados', [
            'count' => $users->count(),
            'total' => $users->total(),
        ]);

        return response()->json([
            'data' => $users->items(),
            'total' => $users->total(),
            'current_page' => $users->currentPage(),
        ]);
    }

    // GET /api/v1/admin/users/{id} — Ver um utilizador
    public function show($id)
    {
        Log::info('[AdminUserController] show chamado', ['id' => $id]);
        $user = User::with('roles.permissions', 'adminProfile.organ')->findOrFail($id);
        return response()->json(['data' => $user]);
    }

    // POST /api/v1/admin/users — Criar admin de órgão + enviar convite
    public function store(Request $request)
    {
        Log::info('[AdminUserController] store chamado', [
            'user_id' => $request->user()?->id,
            'payload' => $request->except(['password', 'password_confirmation']),
        ]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'organ_id' => ['required', 'integer', 'exists:organs,id'],
        ]);

        Log::info('[AdminUserController] store — dados validados', [
            'name'     => $data['name'],
            'email'    => $data['email'],
            'organ_id' => $data['organ_id'],
        ]);

        // Cria o utilizador com role 'admin'
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
            'status'   => 'active',
        ]);

        $roleId = \DB::table('roles')->where('name', 'admin')->value('id');
        $user->roles()->sync([$roleId]);

        Log::info('[AdminUserController] store — utilizador criado', [
            'user_id'  => $user->id,
            'role'     => 'admin',
        ]);

        // 🆕 Envia convite por email
        try {
            $this->service->invite([
                'name'         => $user->name,
                'email'        => $user->email,
                'organ_id'     => $data['organ_id'],
                'access_scope' => 'organ',
            ]);

            Log::info('[AdminUserController] store — convite enviado', [
                'user_id'  => $user->id,
                'organ_id' => $data['organ_id'],
            ]);

            return response()->json([
                'message' => 'Administrador criado e convite enviado com sucesso.',
                'user'    => $user->load('roles', 'adminProfile'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('[AdminUserController] store — ERRO no convite', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Admin criado, mas houve um erro ao enviar o convite: ' . $e->getMessage(),
                'user'    => $user->load('roles'),
            ], 201);
        }
    }

    // PUT /api/v1/admin/users/{id} — Atualizar utilizador
    public function update(Request $request, $id)
    {
        Log::info('[AdminUserController] update chamado', [
            'id'      => $id,
            'user_id' => $request->user()?->id,
            'payload' => $request->except(['password']),
        ]);

        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'   => ['sometimes', 'string', 'max:255'],
            'email'  => ['sometimes', 'email', 'unique:users,email,' . $id],
            'status' => ['sometimes', 'in:active,inactive'],
            'organ_id' => ['sometimes', 'integer', 'exists:organs,id'],
        ]);

        $user->update($data);

        // Atualiza o órgão no adminProfile se enviado
        if (isset($data['organ_id']) && $user->adminProfile) {
            $user->adminProfile->update(['organ_id' => $data['organ_id']]);
        }

        Log::info('[AdminUserController] update — utilizador atualizado', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Utilizador atualizado.',
            'user'    => $user->fresh()->load('roles', 'adminProfile'),
        ]);
    }

    // DELETE /api/v1/admin/users/{id} — Eliminar utilizador
    public function destroy($id)
    {
        Log::info('[AdminUserController] destroy chamado', ['id' => $id]);
        $user = User::findOrFail($id);
        $user->delete();
        Log::info('[AdminUserController] destroy — utilizador eliminado', ['id' => $id]);
        return response()->json(['message' => 'Utilizador eliminado.']);
    }

    // POST /api/v1/admin/users/admins — Convidar admin de órgão (usuário já existente)
    public function invite(Request $request)
    {
        Log::info('[AdminUserController] invite chamado', [
            'user_id' => $request->user()?->id,
            'payload' => $request->except(['password']),
        ]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'organ_id' => ['required', 'integer', 'exists:organs,id'],
        ]);

        try {
            $user = $this->service->invite([
                ...$data,
                'access_scope' => 'organ',
            ]);

            Log::info('[AdminUserController] invite — convite enviado', [
                'user_id'  => $user->id,
                'email'    => $user->email,
            ]);

            return response()->json([
                'message' => 'Convite enviado com sucesso.',
                'user'    => $user,
            ], 201);
        } catch (\Exception $e) {
            Log::error('[AdminUserController] invite — ERRO', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erro ao enviar o convite: ' . $e->getMessage(),
            ], 500);
        }
    }
}