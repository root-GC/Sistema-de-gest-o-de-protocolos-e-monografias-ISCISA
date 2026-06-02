<?php

namespace Modules\User\Services;

use Illuminate\Support\Facades\Hash;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Modules\User\Repositories\UserRepository;

class UserService
{
    public function __construct(private UserRepository $repo) {}

    public function list()
    {
        return $this->repo->all();
    }

    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        $user = $this->repo->create($data);

        if (! empty($data['roles'])) {
            $ids = Role::whereIn('name', $data['roles'])->pluck('id')->toArray();
            $this->repo->syncRoles($user, $ids);
        }

        return $user;
    }

    public function update(int $id, array $data): User
    {
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return $this->repo->update($id, $data);
    }

    public function assignRoles(int $userId, array $roleNames): User
    {
        $user = $this->repo->findById($userId);
        $ids  = Role::whereIn('name', $roleNames)->pluck('id')->toArray();
        $this->repo->syncRoles($user, $ids);
        return $user->fresh('roles');
    }
}