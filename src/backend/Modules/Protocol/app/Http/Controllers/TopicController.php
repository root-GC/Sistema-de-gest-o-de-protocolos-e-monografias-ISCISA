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
            'message' => 'Tema submetido com sucesso e enviado ao Nucleo Cientifico.',
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
}
