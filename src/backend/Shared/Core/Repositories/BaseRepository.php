<?php

namespace Shared\Core\Repositories;

use Illuminate\Database\Eloquent\Model;

abstract class BaseRepository
{
    public function __construct(protected Model $model) {}

    public function findById(int $id): ?Model      { return $this->model->find($id); }
    public function findOrFail(int $id): Model     { return $this->model->findOrFail($id); }
    public function create(array $data): Model     { return $this->model->create($data); }

    public function update(int $id, array $data): Model
    {
        $r = $this->findOrFail($id);
        $r->update($data);
        return $r->fresh();
    }

    public function softDelete(int $id): void { $this->findOrFail($id)->delete(); }
}