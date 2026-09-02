<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Models\DeliberationMeeting;
use Modules\Protocol\app\Models\DeliberationMeetingItem;
use Modules\Protocol\app\Services\DeliberationMeetingService;

class DeliberationMeetingController extends Controller
{
    public function __construct(private DeliberationMeetingService $meetings) {}

    public function queue(Request $request)
    {
        $validated = $request->validate(['organ_id' => 'nullable|integer|exists:organs,id']);

        return response()->json([
            'queue' => $this->meetings->queue($request->user(), $validated['organ_id'] ?? null),
        ]);
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:scheduled,in_progress,completed,cancelled',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'organ_id' => 'nullable|integer|exists:organs,id',
        ]);

        return response()->json(['meetings' => $this->meetings->meetings($request->user(), $validated)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'scheduled_at' => 'required|date|after:now',
            'location' => 'required|string|max:500',
            'notes' => 'nullable|string|max:5000',
            'organ_id' => 'nullable|integer|exists:organs,id',
            'evaluation_form_ids' => 'required|array|min:1',
            'evaluation_form_ids.*' => 'required|integer|distinct|exists:evaluation_forms,id',
        ]);
        $meeting = $this->meetings->create($request->user(), $validated);

        return response()->json([
            'message' => 'Reunião marcada com sucesso.',
            'meeting' => $this->meetings->show($meeting, $request->user()),
        ], 201);
    }

    public function show(Request $request, DeliberationMeeting $meeting)
    {
        return response()->json(['meeting' => $this->meetings->show($meeting, $request->user())]);
    }

    public function update(Request $request, DeliberationMeeting $meeting)
    {
        $validated = $request->validate([
            'scheduled_at' => 'required|date|after:now',
            'location' => 'required|string|max:500',
            'notes' => 'nullable|string|max:5000',
        ]);
        $meeting = $this->meetings->update($meeting, $request->user(), $validated);

        return response()->json([
            'message' => 'Reunião reagendada com sucesso.',
            'meeting' => $this->meetings->show($meeting, $request->user()),
        ]);
    }

    public function cancel(Request $request, DeliberationMeeting $meeting)
    {
        $validated = $request->validate(['reason' => 'nullable|string|max:2000']);
        $meeting = $this->meetings->cancel($meeting, $request->user(), $validated['reason'] ?? null);

        return response()->json([
            'message' => 'Reunião cancelada. Os protocolos regressaram à fila.',
            'meeting' => $this->meetings->show($meeting, $request->user()),
        ]);
    }

    public function start(Request $request, DeliberationMeeting $meeting)
    {
        $meeting = $this->meetings->startMeeting($meeting, $request->user());

        return response()->json([
            'message' => 'Reunião de deliberação iniciada.',
            'meeting' => $this->meetings->show($meeting, $request->user()),
        ]);
    }

    public function complete(Request $request, DeliberationMeeting $meeting)
    {
        $meeting = $this->meetings->completeMeeting($meeting, $request->user());

        return response()->json([
            'message' => 'Reunião de deliberação encerrada.',
            'meeting' => $this->meetings->show($meeting, $request->user()),
        ]);
    }

    public function closeItem(
        Request $request,
        DeliberationMeeting $meeting,
        DeliberationMeetingItem $item
    ) {
        $validated = $request->validate([
            'result' => 'required|string|in:deliberated,not_deliberated',
        ]);
        $meeting = $this->meetings->closeItem($meeting, $item, $request->user(), $validated['result']);

        return response()->json([
            'message' => $validated['result'] === 'deliberated'
                ? 'Resultado da deliberação registado.'
                : 'Resultado sem consenso registado. O protocolo regressará à lista.',
            'meeting' => $this->meetings->show($meeting, $request->user()),
        ]);
    }
}
