<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Http\Requests\SubmitTopicRequest;
use Modules\Protocol\app\Http\Resources\EligibleReviewerResource;
use Modules\Protocol\app\Http\Resources\TopicEvaluationResource;
use Modules\Protocol\app\Http\Resources\TopicReviewAssignmentSecretaryResource;
use Modules\Protocol\app\Http\Resources\TopicReviewCommentResource;
use Modules\Protocol\app\Http\Resources\TopicReviewerResource;
use Modules\Protocol\app\Http\Resources\TopicSecretaryResource;
use Modules\Protocol\app\Http\Resources\TopicSupervisorResource;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicReviewComment;
use Modules\Protocol\app\Services\TopicService;
use Illuminate\Support\Facades\Log;


class TopicController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private TopicService $topicService) {}

//O user busca seus proprios temas aprovados pelo nucleo, para poder submeter o protocolo
 public function getMyApprovedTopics(Request $request)
{
    $user = $request->user();

    Log::info('Buscar temas aprovados do estudante', [
        'user_id' => $user?->id,
        'user_name' => $user?->name,
    ]);


    $allTopics = Topic::where('student_id', $user->id)->get();

    Log::info('Temas encontrados pelo student_id', [
        'count' => $allTopics->count(),
        'topics' => $allTopics->map(function ($topic) {
            return [
                'id' => $topic->id,
                'student_id' => $topic->student_id,
                'status' => $topic->status,
                'title' => $topic->title ?? null,
            ];
        }),
    ]);


    $approvedTopics = Topic::where('student_id', $user->id)
        ->where('status', Topic::STATUS_APPROVED_NUCLEO)
        ->get();


    Log::info('Temas aprovados encontrados', [
        'expected_status' => Topic::STATUS_APPROVED_NUCLEO,
        'count' => $approvedTopics->count(),
        'topics' => $approvedTopics->pluck('id'),
    ]);


    return response()->json([
        'success' => true,
        'data' => TopicReviewerResource::collection($approvedTopics)
    ]);
}

/**
 * getComments: Lista comentários de um tema.
 *
 * Filtros opcionais via query string:
 *   - status: active, inactive
 *   - search: termo de busca no conteúdo
 *   - order: asc, desc (padrão: desc)
 *
 * Acesso:
 *   - Supervisor do tema
 *   - Avaliadores atribuídos
 *   - Secretaria do núcleo
 *   - Admin
 */
public function getComments(Request $request, Topic $topic)
{
    $user = $request->user();

    // Futuramente:
    //$this->authorize('viewComments', $topic);


    // Validação dos filtros
    $validated = $request->validate([
        'status' => 'nullable|in:active,inactive',
        'search' => 'nullable|string|max:255',
        'order' => 'nullable|in:asc,desc',
    ]);


    // Query base
    $query = TopicReviewComment::query()
        ->where('topic_id', $topic->id)
        ->with([
            'user:id,name,email',
            'evaluations.reviewer.user:id,name,email',
        ]);


    // Filtro por status
    if (!empty($validated['status'])) {

        if ($validated['status'] === 'active') {
            $query->active();
        }

        if ($validated['status'] === 'inactive') {
            $query->where(
                'status',
                TopicReviewComment::STATUS_INACTIVE
            );
        }
    }


    // Pesquisa por texto
    if (!empty($validated['search'])) {
        $query->search($validated['search']);
    }


    // Ordenação
    $query->ordered(
        $validated['order'] ?? 'desc'
    );


    // Paginação
    $comments = $query->paginate(15);


    // Resposta preparada para React
    return response()->json([
        'success' => true,

        'comments' => TopicReviewCommentResource::collection(
            $comments->items()
        ),

        'pagination' => [
            'current_page' => $comments->currentPage(),
            'last_page' => $comments->lastPage(),
            'per_page' => $comments->perPage(),
            'total' => $comments->total(),
        ],
    ]);
}


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

    public function getForSupervisor(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('supervision.view')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver temas supervisionados.',
            ], 403);
        }

        $teacherProfileId = $user->teacherProfile?->id;

        if (! $teacherProfileId) {
            return response()->json([
                'topics' => [],
                'total' => 0,
            ]);
        }

        $topics = Topic::query()
            ->where('supervisor_id', $teacherProfileId)
            ->with([
                'student:id,name,email',
                'scientificArea:id,name',
                'course:id,name,code',
            ])
            ->latest('submitted_at')
            ->get();

        return response()->json([
            'topics' => TopicSupervisorResource::collection($topics),
            'total' => $topics->count(),
        ]);
    }

    public function approveBySupervisor(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('approveBySupervisor', $topic);

        $validated = $request->validate([
            'comment' => 'nullable|string|max:5000',
            'comments' => 'nullable|string|max:5000',
            'supervisor_comment' => 'nullable|string|max:5000',
        ]);

        $comment = $validated['comment'] ?? $validated['comments'] ?? $validated['supervisor_comment'] ?? null;

        $result = $this->topicService->approveBySupervisor($topic, $user, $comment);

        return response()->json([
            'message' => 'Tema aprovado com sucesso pelo supervisor e encaminhado ao Nucleo Cientifico.',
            'topic' => $result,
        ]);
    }

    public function rejectBySupervisor(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('rejectBySupervisor', $topic);

        $validated = $request->validate([
            'comment' => 'nullable|string|max:5000',
            'comments' => 'nullable|string|max:5000',
            'supervisor_comment' => 'nullable|string|max:5000',
        ]);

        $comment = $validated['comment'] ?? $validated['comments'] ?? $validated['supervisor_comment'] ?? null;

        $result = $this->topicService->rejectBySupervisor($topic, $user, $comment);

        return response()->json([
            'message' => 'Tema não aprovado pelo supervisor.',
            'topic' => $result,
        ]);
    }

    /**
     * getForSecretary: Lista temas pendentes de atribuição de avaliadores.
     *
     * Revisão cega (RF-039): não expõe estudante nem supervisor ao Núcleo.
     */
    public function getForSecretary(Request $request)
    {
        $user = $request->user()->load('secretaryProfile');

        if (! $user->hasPermission('protocol.assign')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para listar temas.',
            ], 403);
        }

        $topics = $this->topicService->listForSecretary($user);

        return response()->json([
            'topics' => TopicSecretaryResource::collection($topics),
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
            'reviewers' => EligibleReviewerResource::collection($reviewers),
            'total' => $reviewers->count(),
        ]);
    }

    public function getAssignedReviewers(Request $request, Topic $topic)
    {
        $user = $request->user()->load('secretaryProfile');

        if (! $user->hasPermission('protocol.assign')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver revisores atribuídos.',
            ], 403);
        }

        $topic->loadMissing('scientificArea:id,name,organ_id');

        $secretary = $user->secretaryProfile;
        if ($secretary && (int) $secretary->organ_id !== (int) $topic->scientificArea?->organ_id) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver revisores deste tema.',
            ], 403);
        }

        if (! $secretary && ! $user->hasPermission('protocol.view.all')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver revisores deste tema.',
            ], 403);
        }

        $assignments = $topic->reviewAssignments()
            ->with([
                'reviewer.user:id,name,email',
                'evaluation.comment:id,content,status,created_at',
            ])
            ->orderBy('assigned_at')
            ->get();

        $reviewers = $assignments
            ->map(fn($assignment) => [
                'id' => $assignment->reviewer?->id,
                'name' => $assignment->reviewer?->user?->name,
                'email' => $assignment->reviewer?->user?->email,
                'assignment_id' => $assignment->id,
                'assigned_at' => $assignment->assigned_at,
                'evaluation' => $assignment->evaluation ? [
                    'decision' => $assignment->evaluation->decision,
                    'comment' => $assignment->evaluation->comment ? [
                        'id' => $assignment->evaluation->comment->id,
                        'content' => $assignment->evaluation->comment->content,
                        'status' => $assignment->evaluation->comment->status,
                    ] : null,
                    'evaluated_at' => $assignment->evaluation->evaluated_at,
                ] : null,
            ])
            ->filter(fn($reviewer) => $reviewer['id'] !== null)
            ->values();

        return response()->json([
            'reviewers' => $reviewers,
            'review_assignments' => TopicReviewAssignmentSecretaryResource::collection($assignments),
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
            'topic' => TopicSecretaryResource::make($result),
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
            'topics' => TopicReviewerResource::collection(
                $this->topicService->listForReviewer($user)
            ),
        ]);
    }

    public function submitEvaluation(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('submitEvaluation', $topic);

        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'comment_id' => 'nullable|integer|exists:topic_review_comments,id',
        ]);

        $result = $this->topicService->submitEvaluation($topic, $user, $validated);

        return response()->json([
            'message' => 'Avaliação registada com sucesso.',
            'topic' => TopicReviewerResource::make($result['topic']),
            'evaluation' => TopicEvaluationResource::make($result['evaluation']),
        ]);
    }

    public function submitComment(Request $request, Topic $topic)
    {
        $user = $request->user()->load('teacherProfile');

        $this->authorize('submitEvaluation', $topic);

        $validated = $request->validate([
            'content' => 'required|string|min:3|max:5000',
        ]);

        $result = $this->topicService->submitReviewComment($topic, $user, $validated);

        return response()->json([
            'message' => 'Comentário registado com sucesso.',
            'comment' => TopicReviewCommentResource::make($result['comment']),
            'evaluation' => $result['evaluation'] ? TopicEvaluationResource::make($result['evaluation']) : null,
            'topic' => TopicReviewerResource::make($result['topic']),
        ]);
    }
}
