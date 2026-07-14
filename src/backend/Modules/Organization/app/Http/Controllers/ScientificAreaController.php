<?php

namespace Modules\Organization\app\Http\Controllers;

use Modules\Organization\app\Services\ScientificAreaService;
use Modules\Organization\app\Http\Requests\ScientificArea\StoreScientificAreaRequest;
use Modules\Organization\app\Http\Requests\ScientificArea\UpdateScientificAreaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;


class ScientificAreaController extends Controller
{
    public function __construct(
        private readonly ScientificAreaService $scientificAreaService
    ) {}

   public function index(Request $request): JsonResponse
{
    try {

        Log::info('A buscar áreas científicas', [
            'organ_id' => $request->organ_id,
            'query_params' => $request->all()
        ]);

        $scientificAreas = $request->has('organ_id')
            ? $this->scientificAreaService->getByOrgan($request->organ_id)
            : $this->scientificAreaService->getPaginated();


        Log::info('Áreas científicas retornadas', [
            'count' => is_countable($scientificAreas) ? count($scientificAreas) : null,
            'data' => $scientificAreas
        ]);


        return response()->json([
            'success' => true,
            'data' => $scientificAreas
        ]);

    } catch (\Exception $e) {

        Log::error('Erro ao buscar áreas científicas', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}

    public function show(int $id): JsonResponse
    {
        try {
            $scientificArea = $this->scientificAreaService->getById($id);
            return response()->json([
                'success' => true,
                'data' => $scientificArea
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar área científica', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Área científica não encontrada'
            ], 404);
        }
    }

    public function store(StoreScientificAreaRequest $request): JsonResponse
    {
        try {
            $scientificArea = $this->scientificAreaService->create($request->validated());
            return response()->json([
                'success' => true,
                'data' => $scientificArea,
                'message' => 'Área científica criada com sucesso'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar área científica'
            ], 500);
        }
    }

    public function update(UpdateScientificAreaRequest $request, int $id): JsonResponse
    {
        try {
            $scientificArea = $this->scientificAreaService->update($id, $request->validated());
            return response()->json([
                'success' => true,
                'data' => $scientificArea,
                'message' => 'Área científica atualizada com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar área científica'
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->scientificAreaService->delete($id);
            return response()->json([
                'success' => true,
                'message' => 'Área científica excluída com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir área científica'
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        try {
            $scientificAreas = $this->scientificAreaService->search($request->q);
            return response()->json([
                'success' => true,
                'data' => $scientificAreas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro na pesquisa'
            ], 500);
        }
    }
}