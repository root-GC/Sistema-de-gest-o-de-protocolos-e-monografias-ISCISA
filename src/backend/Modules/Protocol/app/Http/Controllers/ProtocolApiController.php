<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Http\Requests\SubmitProtocolRequest;
use Modules\Protocol\app\Http\Resources\ProtocolResource;
use Modules\Protocol\app\Http\Resources\ProtocolReviewerResource;

class ProtocolApiController extends Controller
{
    use AuthorizesRequests;

    private function protocolService()
    {
        return app(\Modules\Protocol\app\Services\ProtocolService::class);
    }

    public function store(SubmitProtocolRequest $request)
    {
        $validated = $request->validated();

        $topic = \Modules\Protocol\app\Models\Topic::query()->findOrFail($validated['topic_id']);
        $protocol = $this->protocolService()->submit(
            $request->user(),
            $topic,
            $request->file('document'),
            $validated['protocol_type']
        );

        return response()->json([
            'message' => 'Protocolo submetido com sucesso e aguardando aprovacao do supervisor.',
            'protocol' => $protocol->load('topic:id,title,status')->toArray(),
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $protocols = $user->hasPermission('protocol.view.all')
            ? \Modules\Protocol\app\Models\Protocol::query()->with('topic:id,title,status')->latest('submitted_at')->get()
            : $this->protocolService()->listForStudent($user);

        return response()->json([
            'protocols' => $protocols->map(fn($protocol) => $protocol->load('topic:id,title,status')->toArray())->values(),
        ]);
    }

    public function show(Request $request, string $protocol)
    {
        $user = $request->user();
        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);

        if ((int) $protocol->student !== (int) $user->id && ! $user->hasPermission('protocol.view.all')) {
            abort(403);
        }

        return response()->json([
            'protocol' => $protocol->load('topic:id,title,status')->toArray(),
        ]);
    }

    public function getForSupervisor(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('supervision.view')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver protocolos supervisionados.',
            ], 403);
        }

        $protocols = $this->protocolService()->getForSupervisor($user);

        return response()->json([
            'protocols' => ProtocolResource::collection($protocols),
            'total' => $protocols->count(),
        ]);
    }

    public function approveBySupervisor(Request $request, string $protocol)
    {
        $user = $request->user()->load('teacherProfile');
        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);

        $result = $this->protocolService()->approveBySupervisor($protocol, $user);

        return response()->json([
            'message' => 'Protocolo aprovado pelo supervisor.',
            'protocol' => $result->load('topic:id,title,status')->toArray(),
        ]);
    }

    public function rejectBySupervisor(Request $request, string $protocol)
    {
        $user = $request->user()->load('teacherProfile');
        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);
        $validated = $request->validate([
            'justification' => 'nullable|string|max:5000',
        ]);

        $result = $this->protocolService()->rejectBySupervisor($protocol, $user, $validated['justification'] ?? null);

        return response()->json([
            'message' => 'Protocolo rejeitado pelo supervisor.',
            'protocol' => $result->load('topic:id,title,status')->toArray(),
        ]);
    }

    public function getForSecretary(Request $request)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            abort(403);
        }

        $protocols = $this->protocolService()->listForSecretary($user);

        return response()->json([
            'protocols' => $protocols->values(),
        ]);
    }

    public function getEligibleReviewers(Request $request, string $protocol)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            abort(403);
        }

        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);
        $reviewers = $this->protocolService()->getEligibleReviewers($protocol);

        return response()->json([
            'reviewers' => $reviewers->values(),
        ]);
    }

    public function assignReviewers(Request $request, string $protocol)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            abort(403);
        }

        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);

        $validated = $request->validate([
            'reviewer_one_id' => 'required|integer|exists:teacher_profiles,id',
            'reviewer_two_id' => 'required|integer|exists:teacher_profiles,id|different:reviewer_one_id',
        ]);

        $reviewerIds = [
            (int) $validated['reviewer_one_id'],
            (int) $validated['reviewer_two_id'],
        ];

        $result = $this->protocolService()->assignReviewers($protocol, $reviewerIds, $user);

        return response()->json([
            'message' => 'Revisores atribuidos com sucesso ao protocolo.',
            'protocol' => $result->toArray(),
        ]);
    }

    public function getForReviewer(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('protocol.evaluate')) {
            return response()->json([
                'message' => 'Utilizador nao tem permissao para ver protocolos atribuidos.',
            ], 403);
        }

        return response()->json([
            'protocols' => ProtocolReviewerResource::collection(
                $this->protocolService()->listForReviewer($user)
            ),
        ]);
    }
}
