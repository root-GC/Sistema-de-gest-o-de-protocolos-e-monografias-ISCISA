<?php
// Modules/Defense/app/Http/Controllers/DefenseController.php

namespace Modules\Defense\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Defense\app\Models\Defense;
use Modules\Defense\app\Services\DefenseService;

class DefenseController extends Controller
{
    public function __construct(private DefenseService $service) {}

    public function show(Defense $defense)
    {
        $this->authorize('view', $defense);
        return response()->json($defense->load('jury.teacher.user', 'finalDocuments'));
    }

    public function assignJury(Request $request, Defense $defense)
    {
        $this->authorize('assignJury', $defense);

        $request->validate([
            'members'              => ['required', 'array', 'min:3'],
            'members.*.teacher_id' => ['required', 'exists:teacher_profiles,id', 'distinct'],
            'members.*.jury_role'  => ['required', 'in:presidente,arguente,orientador'],
        ]);

        $d = $this->service->assignJury($defense, $request->input('members'), $request->user());
        return response()->json($d);
    }

    public function proposeSchedule(Request $request, Defense $defense)
    {
        $this->authorize('schedule', $defense);

        $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
            'location'     => ['required', 'string', 'max:255'],
        ]);

        $d = $this->service->proposeSchedule(
            $defense,
            $request->user()->teacherProfile->id,
            $request->input('scheduled_at'),
            $request->input('location'),
            $request->user(),
        );

        return response()->json($d);
    }

    public function respondToSchedule(Request $request, Defense $defense)
    {
        $teacherProfile = $request->user()->teacherProfile;

        $juryMember = $teacherProfile
            ? $defense->jury()->where('teacher_id', $teacherProfile->id)->first()
            : null;

        abort_unless($juryMember, 403, 'Não é membro deste júri.');
        abort_unless($juryMember->jury_role === 'arguente', 403, 'Só o arguente pode responder à proposta de data.');

        $request->validate([
            'accepted'             => ['required', 'boolean'],
            'alternative_datetime' => ['required_if:accepted,false', 'nullable', 'date'],
            'note'                 => ['nullable', 'string', 'max:1000'],
        ]);

        $d = $this->service->respondToSchedule(
            $defense,
            $teacherProfile->id,
            $request->boolean('accepted'),
            $request->input('alternative_datetime'),
            $request->input('note'),
            $request->user(),
        );

        return response()->json($d);
    }

    public function scheduleResponses(Defense $defense)
    {
        $this->authorize('schedule', $defense);
        return response()->json($this->service->scheduleResponses($defense));
    }

    public function recordGrade(Request $request, Defense $defense)
    {
        $this->authorize('recordGrade', $defense);

        $request->validate([
            'grade'                => ['required', 'numeric', 'min:0', 'max:20'],
            'requires_corrections' => ['required', 'boolean'],
            'notes'                => ['required_if:requires_corrections,true', 'nullable', 'string', 'max:2000'],
        ]);

        $d = $this->service->recordGrade(
            $defense,
            (float) $request->input('grade'),
            $request->boolean('requires_corrections'),
            $request->input('notes'),
            $request->user(),
        );

        return response()->json($d);
    }

    public function uploadMinutes(Request $request, Defense $defense)
    {
        $this->authorize('uploadMinutes', $defense);

        $request->validate(['file' => ['required', 'file', 'mimes:pdf', 'max:10240']]);

        $d = $this->service->uploadMinutes($defense, $request->file('file'), $request->user());
        return response()->json($d);
    }

    public function submitFinalDocument(Request $request, Defense $defense)
    {
        $this->authorize('submitFinalDocument', $defense);

        $request->validate(['file' => ['required', 'file', 'mimes:pdf', 'max:20480']]);

        $d = $this->service->submitFinalDocument($defense, $request->user(), $request->file('file'));
        return response()->json($d);
    }

    public function validateFinalDocument(Request $request, Defense $defense)
    {
        $this->authorize('validateFinalDocument', $defense);

        $request->validate([
            'approved' => ['required', 'boolean'],
            'notes'    => ['required_if:approved,false', 'nullable', 'string', 'max:2000'],
        ]);

        $d = $this->service->validateFinalDocument(
            $defense,
            $request->user(),
            $request->boolean('approved'),
            $request->input('notes')
        );

        return response()->json($d);
    }
}
