<?php

namespace Modules\Auth\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Builders\AuthPayloadBuilder;

class MeController extends Controller
{
    public function __construct(private AuthPayloadBuilder $payloadBuilder) {}

    public function __invoke(Request $request)
    {
        return response()->json([
            'user' => $this->payloadBuilder->build($request->user()),
        ]);
    }
}