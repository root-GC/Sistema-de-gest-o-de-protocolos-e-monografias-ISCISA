<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Http\Resources\EvaluationFormResource;
use Modules\Protocol\app\Http\Resources\TopicReviewerResource;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\Protocol\app\Services\TopicService;

class ComiteCientificoController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private EvaluationService $evaluationService,
        private TopicService $topicService,
    ) {}

    public function reviewerWorks(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('protocol.evaluate')) {
            return response()->json(['message' => 'Sem permissão para avaliar.'], 403);
        }

        $topics = $this->topicService->listForReviewer($user);
        $evaluations = $this->evaluationService->listForReviewer($user);

        return response()->json([
            'works' => [
                'topics' => TopicReviewerResource::collection($topics),
                'evaluations' => EvaluationFormResource::collection($evaluations),
            ],
            'total_active' => $topics->count() + $evaluations->count(),
        ]);
    }

    public function evaluations(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('protocol.evaluate')) {
            return response()->json(['message' => 'Sem permissão para ver avaliações.'], 403);
        }

        return response()->json([
            'evaluation_forms' => EvaluationFormResource::collection(
                $this->evaluationService->listForReviewer($user)
            ),
        ]);
    }

    public function secretaryEvaluations(Request $request)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        return response()->json([
            'evaluation_forms' => EvaluationFormResource::collection(
                $this->evaluationService->listForSecretary($user)
            ),
        ]);
    }
}
