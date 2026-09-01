<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class LegacyNucleusProtocolController extends Controller
{
    public function gone(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'O Núcleo Científico deixou de tratar protocolos. Consulte o histórico ou continue o processo no Comité Científico.',
            'code' => 'nucleus_protocol_flow_retired',
            'replacement' => '/api/v1/comite-cientifico/secretary/protocols',
        ], 410)->header('Deprecation', 'true');
    }
}
