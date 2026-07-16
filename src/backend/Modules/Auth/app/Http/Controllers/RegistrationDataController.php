<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\User\app\Models\Course;
use Modules\User\app\Models\ScientificArea;
use Modules\User\app\Models\TeacherProfile;

class RegistrationDataController extends Controller
{
    public function courses()
    {
        return response()->json(
            Course::select('id', 'name')->orderBy('name')->get()
        );
    }

    public function scientificAreas()
    {
        return response()->json(
            ScientificArea::select('id', 'name')->orderBy('name')->get()
        );
    }

    // Lista de docentes elegíveis para orientar estudantes no registo
    public function supervisors()
    {
        $teachers = TeacherProfile::with('user:id,name')
            ->whereHas('user', fn ($q) => $q->where('status', 'active'))
            ->get(['id', 'user_id', 'scientific_area_id', 'academic_degree']);

        return response()->json(
            $teachers->map(fn ($t) => [
                'id'              => $t->id,
                'name'            => $t->user->name,
                'academic_degree' => $t->academic_degree,
            ])->values()
        );
    }
}