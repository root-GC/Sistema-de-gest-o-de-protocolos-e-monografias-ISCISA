<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Http\Requests\SubmitTopicRequest;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Services\TopicService;

class TopicController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private TopicService $topicService) {}

    public function store(SubmitTopicRequest $request)
    {
        $user = $request->user();

        $this->authorize('create', Topic::class);

        $result = $this->topicService->submit($request->validated(), $user);

        return response()->json([
            'message' => 'Tema submetido com sucesso. Agora está aguardando aprovação do supervisor.',
            'topic' => $result['topic'],
            'similar_topics_warning' => [
                'has_similar' => ! empty($result['similar_topics']),
                'items' => $result['similar_topics'],
            ],
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $this->authorize('viewAny', Topic::class);

        return response()->json([
            'topics' => $this->topicService->listForUser($user),
        ]);
    }

    public function approveBySupervisor(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('approveBySupervisor', $topic);

        $result = $this->topicService->approveBySupervisor($topic, $user);

        return response()->json([
            'message' => 'Tema aprovado com sucesso pelo supervisor e encaminhado ao Nucleo Cientifico.',
            'topic' => $result,
        ]);
    }

    public function rejectBySupervisor(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('rejectBySupervisor', $topic);

        $justification = $request->input('justification');

        $result = $this->topicService->rejectBySupervisor($topic, $user, $justification);

        return response()->json([
            'message' => 'Tema rejeitado pelo supervisor.',
            'topic' => $result,
        ]);
    }

    /**
     * getForSecretary: Lista temas pendentes de atribuição de avaliadores.
     *
     * Retorna todos os temas em status topic_pending_nucleo do núcleo da secretaria.
     * Cada tema inclui:
     *   - student: id, name, email
     *   - supervisor: teacher_profile com user (id, name, email)
     *   - scientific_area: id, name, organ_id
     *   - course: id, name, code
     *   - reviewAssignments: avaliadores já atribuídos com user info
     */
    public function getForSecretary(Request $request)
    {
        $user = $request->user()->load('secretaryProfile');

        // Verifica que é secretaria
        if (! $user->hasPermission('protocol.assign')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para listar temas.',
            ], 403);
        }

        $topics = $this->topicService->listForSecretary($user);

        return response()->json([
            'topics' => $topics,
            'total' => $topics->count(),
        ]);
    }

    /**
     * getEligibleReviewers: Lista avaliadores elegíveis para um tema.
     *
     * Retorna docentes do mesmo núcleo que ainda não foram atribuídos
     * como avaliadores deste tema.
     */
    public function getEligibleReviewers(Request $request, Topic $topic)
    {
        $this->authorize('viewForSecretary', $topic);

        $reviewers = $this->topicService->getEligibleReviewers($topic);

        return response()->json([
            'reviewers' => $reviewers,
            'total' => $reviewers->count(),
        ]);
    }

    /**
     * assignReviewers: Atribui um ou mais avaliadores a um tema.
     *
     * Request body:
     * {
     *   "reviewer_ids": [1, 2, 3]  // array de teacher_profile IDs
     * }
     *
     * Valida:
     *   - Tema está em topic_pending_nucleo
     *   - Secretaria é do mesmo núcleo do tema
     *   - Cada avaliador é do mesmo núcleo
     *   - Cada avaliador ainda não foi atribuído
     *
     * Retorna: Tema actualizado com estado topic_assigned_for_review e assignments.
     */
    public function assignReviewers(Request $request, Topic $topic)
    {
        $user = $request->user()->load('secretaryProfile');

        $this->authorize('viewForSecretary', $topic);

        $validated = $request->validate([
            'reviewer_ids' => 'required|array|min:1',
            'reviewer_ids.*' => 'integer|distinct',
        ]);

        $result = $this->topicService->assignReviewers($topic, $validated['reviewer_ids'], $user);

        return response()->json([
            'message' => 'Avaliadores atribuídos com sucesso.',
            'topic' => $result,
        ]);
    }

    public function getForReviewer(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('protocol.evaluate')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver temas atribuídos.',
            ], 403);
        }

        return response()->json([
            'topics' => $this->topicService->listForReviewer($user),
        ]);
    }

    public function submitEvaluation(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('submitEvaluation', $topic);

        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'comments' => 'nullable|string',
        ]);

        $result = $this->topicService->submitEvaluation($topic, $user, $validated);

        return response()->json([
            'message' => 'Avaliação registada com sucesso.',
            'topic' => $result['topic'],
            'evaluation' => $result['evaluation'],
        ]);
    }
}
