<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\User\Services\UserService;

class UserController extends Controller
{
    public function __construct(private UserService $service) {}

    public function index()
    {
        return response()->json($this->service->list());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'status'   => ['sometimes', 'in:active,inactive,suspended'],
            'roles'    => ['sometimes', 'array'],
            'roles.*'  => ['string', 'exists:roles,name'],
        ]);

        $user = $this->service->create($data);

        return response()->json($user->load('roles'), 201);
    }

    public function show(int $id)
    {
        return response()->json(
            \Modules\User\Repositories\UserRepository::class
        );
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'string'],
            'email'    => ['sometimes', 'email', "unique:users,email,{$id}"],
            'password' => ['sometimes', 'string', 'min:8'],
            'status'   => ['sometimes', 'in:active,inactive,suspended'],
        ]);

        return response()->json($this->service->update($id, $data));
    }

    public function destroy(int $id)
    {
        \Modules\User\Models\User::findOrFail($id)->delete();
        return response()->json(['message' => 'Utilizador removido.']);
    }

    public function assignRoles(Request $request, int $id)
    {
        $data = $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $user = $this->service->assignRoles($id, $data['roles']);

        return response()->json($user);
    }
}