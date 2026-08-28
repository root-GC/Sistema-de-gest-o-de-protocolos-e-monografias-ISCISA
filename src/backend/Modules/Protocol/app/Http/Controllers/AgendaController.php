<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Services\DeliberationMeetingService;

class AgendaController extends Controller
{
    public function __construct(private DeliberationMeetingService $meetings) {}

    public function index(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);
        $meetings = $this->meetings->meetings($request->user(), $validated)
            ->reject(fn ($meeting) => $meeting['status'] === 'cancelled')
            ->values();

        return response()->json([
            'events' => $meetings->map(fn ($meeting) => [
                'id' => 'deliberation-'.$meeting['id'],
                'type' => 'deliberation_meeting',
                'title' => 'Deliberação — '.($meeting['organ']['name'] ?? 'Comité'),
                'starts_at' => $meeting['scheduled_at'],
                'location' => $meeting['location'],
                'status' => $meeting['status'],
                'meeting_id' => $meeting['id'],
                'protocol_count' => count($meeting['items']),
                'url' => $request->user()->hasPermission('protocol.assign')
                    ? '/secretary/meeting?tab='.$meeting['status'].'&meeting='.$meeting['id']
                    : '/reviewer/meetings?meeting='.$meeting['id'],
            ])->values(),
        ]);
    }
}
