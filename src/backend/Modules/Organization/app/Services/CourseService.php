<?php

namespace Modules\Organization\app\Services;

use Modules\Organization\app\Models\Course;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class CourseService
{
    public function getAll(): Collection
    {
        return Course::with('scientificArea')->get();
    }

    public function getPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return Course::with('scientificArea')->paginate($perPage);
    }

    public function getById(int $id): Course
    {
        return Course::with(['scientificArea', 'studentProfiles', 'coordinatorProfiles'])->findOrFail($id);
    }

    public function create(array $data): Course
    {
        return Course::create($data);
    }

    public function update(int $id, array $data): Course
    {
        $course = $this->getById($id);
        $course->update($data);
        return $course->fresh();
    }

    public function delete(int $id): bool
    {
        return $this->getById($id)->delete();
    }

    public function restore(int $id): bool
    {
        return Course::withTrashed()->findOrFail($id)->restore();
    }

    public function getByScientificArea(int $scientificAreaId): Collection
    {
        return Course::where('scientific_area_id', $scientificAreaId)
            ->with('scientificArea')
            ->get();
    }

    public function search(string $term): Collection
    {
        return Course::where('name', 'like', "%{$term}%")
            ->orWhere('code', 'like', "%{$term}%")
            ->with('scientificArea')
            ->get();
    }

    public function getByCode(string $code): ?Course
    {
        return Course::where('code', $code)->first();
    }
}