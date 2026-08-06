<?php
// Modules/Organization/app/Http/Controllers/OrganController.php

namespace Modules\Organization\app\Http\Controllers;

use Modules\Organization\app\Models\Organ;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class OrganController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $organs = Organ::all();
            
            return response()->json([
                'success' => true,
                'data' => $organs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar órgãos'
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $organ = Organ::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $organ
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Órgão não encontrado'
            ], 404);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'required|string|in:nucleus,scientific_committee,bioethics_committee,scientific_direction',
                'description' => 'nullable|string'
            ]);

            $organ = Organ::create($validated);
            
            return response()->json([
                'success' => true,
                'data' => $organ,
                'message' => 'Órgão criado com sucesso'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar órgão'
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $organ = Organ::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|string|in:nucleus,scientific_committee,bioethics_committee,scientific_direction',
                'description' => 'nullable|string'
            ]);

            $organ->update($validated);
            
            return response()->json([
                'success' => true,
                'data' => $organ,
                'message' => 'Órgão atualizado com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao atualizar órgão'
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $organ = Organ::findOrFail($id);
            $organ->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Órgão excluído com sucesso'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir órgão'
            ], 500);
        }
    }
}