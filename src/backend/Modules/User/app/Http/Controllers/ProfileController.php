<?php

namespace Modules\User\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Auth\app\Builders\AuthPayloadBuilder;
use Modules\User\app\Services\ProfileService;

class ProfileController extends Controller
{
    public function __construct(
        private ProfileService     $profileService,
        private AuthPayloadBuilder $payloadBuilder,
    ) {}

    /**
     * Devolve o payload completo do utilizador autenticado.
     * Mesmo formato do login — o frontend pode usar para refrescar o contexto.
     */
    public function show(Request $request)
    {
        return response()->json([
            'user' => $this->payloadBuilder->build($request->user()),
        ]);
    }

    /**
     * Actualiza dados do perfil contextual.
     * O frontend envia activeRole para saber qual perfil actualizar.
     */
    public function update(Request $request)
    {
        $request->validate([
            'active_role' => ['required', 'string'],
        ]);

        $this->profileService->update(
            $request->user(),
            $request->active_role,
            $request->except('active_role')
        );

        return response()->json([
            'message' => 'Perfil actualizado.',
            'user'    => $this->payloadBuilder->build($request->user()),
        ]);
    }
}