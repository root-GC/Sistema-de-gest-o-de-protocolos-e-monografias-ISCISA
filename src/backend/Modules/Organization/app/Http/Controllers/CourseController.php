<?php

namespace Modules\Organization\app\Http\Controllers;

use Modules\Organization\app\Services\CourseService;
use Modules\Organization\app\Http\Requests\Course\StoreCourseRequest;
use Modules\Organization\app\Http\Requests\Course\UpdateCourseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $courses = $request->has('scientific_area_id')
                ? $this->courseService->getByScientificArea($request->scientific_area_id)
                : $this->courseService->getPaginated();

            return response()->json([
                'success' => true,
                'data' => $courses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar cursos'
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $course = $this->courseService->getById($id);
            return response()->json([
                'success' => true,
                'data' => $course
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Curso não encontrado'
            ], 404);
        }
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        try {
            $course = $this->courseService->create($request->validated());
            return response()->json([
                'success' => true,
                'data' => $course,
                'message' => 'Curso criado com sucesso'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar curso'
            ], 500);
        }
    }

    public function update(UpdateCourseRequest $request, int $id): JsonResponse
    {
        try {
            $course = $this->courseService->update($id, $request->validated());
            return response()->json([
                'success' => true,
                'data' => $course,
                'message' => 'Curso atualizado com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar curso'
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->courseService->delete($id);
            return response()->json([
                'success' => true,
                'message' => 'Curso excluído com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir curso'
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        try {
            $courses = $this->courseService->search($request->q);
            return response()->json([
                'success' => true,
                'data' => $courses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro na pesquisa'
            ], 500);
        }
    }

    public function getByCode(string $code): JsonResponse
    {
        try {
            $course = $this->courseService->getByCode($code);
            
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso não encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $course
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar curso'
            ], 500);
        }
    }
}