<?php

namespace Modules\User\Repositories;

use Modules\User\Models\User;

class UserRepository
{
    public function all()
    {
        return User::with('roles')->orderBy('name')->get();
    }

    public function findById(int $id): User
    {
        return User::with(['roles.permissions', 'teacherProfile', 'studentProfile',
            'coordinatorProfile', 'secretaryProfile', 'adminProfile'])->findOrFail($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(int $id, array $data): User
    {
        $user = User::findOrFail($id);
        $user->update($data);
        return $user->fresh();
    }

    public function syncRoles(User $user, array $roleIds): void
    {
        $user->roles()->sync($roleIds);
    }
}