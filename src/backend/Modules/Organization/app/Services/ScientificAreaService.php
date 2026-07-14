<?php

namespace Modules\Organization\app\Services;

use Modules\Organization\app\Models\ScientificArea;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ScientificAreaService
{
    public function getAll(): Collection
    {
        return ScientificArea::with('organ')->get();
    }

    public function getPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return ScientificArea::with('organ')->paginate($perPage);
    }

    public function getById(int $id): ScientificArea
    {
        return ScientificArea::with(['organ', 'courses', 'teacherProfiles', 'coordinatorProfiles'])->findOrFail($id);
    }

    public function create(array $data): ScientificArea
    {
        return ScientificArea::create($data);
    }

    public function update(int $id, array $data): ScientificArea
    {
        $scientificArea = $this->getById($id);
        $scientificArea->update($data);
        return $scientificArea->fresh();
    }

    public function delete(int $id): bool
    {
        return $this->getById($id)->delete();
    }

    public function restore(int $id): bool
    {
        return ScientificArea::withTrashed()->findOrFail($id)->restore();
    }

    public function getByOrgan(int $organId): Collection
    {
        return ScientificArea::where('organ_id', $organId)->with('courses')->get();
    }

    public function search(string $term): Collection
    {
        return ScientificArea::where('name', 'like', "%{$term}%")
            ->with('organ')
            ->get();
    }
}