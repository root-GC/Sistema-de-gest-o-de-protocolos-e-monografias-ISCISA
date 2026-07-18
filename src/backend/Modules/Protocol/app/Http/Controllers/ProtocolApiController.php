<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Modules\Protocol\app\Http\Requests\SubmitProtocolRequest;
use Modules\Protocol\app\Http\Resources\ProtocolResource;
use Modules\Protocol\app\Http\Resources\ProtocolReviewerResource;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Protocol;
use Modules\User\app\Models\User;

class ProtocolApiController extends Controller
{
    use AuthorizesRequests;

    private function protocolService()
    {
        return app(\Modules\Protocol\app\Services\ProtocolService::class);
    }

    private function canAccessProtocolDocument(User $user, Protocol $protocol): bool
    {
        $user->loadMissing(['teacherProfile', 'secretaryProfile']);

        if ($user->hasPermission('protocol.view.all') || (int) $protocol->student === (int) $user->id) {
            return true;
        }

        $teacherProfile = $user->teacherProfile;

        if ($teacherProfile && (int) $protocol->supervisor_id === (int) $teacherProfile->id) {
            return true;
        }

        if ($teacherProfile && $user->hasPermission('protocol.evaluate')) {
            return $protocol->reviewAssignments()
                ->where(fn($query) => $query
                    ->where('reviewer_one', $teacherProfile->id)
                    ->orWhere('reviewer_two', $teacherProfile->id)
                )
                ->exists();
        }

        if ($user->hasPermission('protocol.assign')) {
            $secretaryProfile = $user->secretaryProfile;

            return ! $secretaryProfile
                || ! $secretaryProfile->organ_id
                || (int) $protocol->current_organ_id === (int) $secretaryProfile->organ_id;
        }

        return false;
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
            'protocol' => ProtocolResource::make($protocol->load('topic:id,title,status')),
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $protocols = $user->hasPermission('protocol.view.all')
            ? \Modules\Protocol\app\Models\Protocol::query()->with('topic:id,title,status')->latest('submitted_at')->get()
            : $this->protocolService()->listForStudent($user);

        return response()->json([
            'protocols' => ProtocolResource::collection($protocols),
        ]);
    }

    public function show(Request $request, string $protocol)
    {
        $user = $request->user()->load('teacherProfile');
        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);

        $isStudent = (int) $protocol->student === (int) $user->id;
        $isSupervisor = $user->teacherProfile && (int) $protocol->supervisor_id === (int) $user->teacherProfile->id;
        $canViewAll = $user->hasPermission('protocol.view.all')
            || $user->hasPermission('supervision.view')
            || $user->hasPermission('protocol.evaluate')
            || $user->hasPermission('protocol.assign');

        if (! $isStudent && ! $isSupervisor && ! $canViewAll) {
            abort(403);
        }

        $protocol->load([
            'topic:id,title,justification,status',
            'topic.scientificArea:id,name',
            'student:id,name,email',
            'supervisor.user:id,name,email',
            'documents' => fn($q) => $q->where('status', 'active'),
        ]);

        return response()->json([
            'protocol' => ProtocolResource::make($protocol),
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

    public function getAssignedReviewers(Request $request, string $protocol)
    {
        $user = $request->user()->load('secretaryProfile');

        if (! $user->hasPermission('protocol.assign')) {
            return response()->json([
                'message' => 'Utilizador nao tem permissao para ver revisores atribuidos.',
            ], 403);
        }

        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);
        $secretary = $user->secretaryProfile;

        if ($secretary && (int) $secretary->organ_id !== (int) $protocol->current_organ_id) {
            return response()->json([
                'message' => 'Utilizador nao tem permissao para ver revisores deste protocolo.',
            ], 403);
        }

        if (! $secretary && ! $user->hasPermission('protocol.view.all')) {
            return response()->json([
                'message' => 'Utilizador nao tem permissao para ver revisores deste protocolo.',
            ], 403);
        }

        $assignments = $protocol->reviewAssignments()
            ->with([
                'organ:id,name,type',
                'reviewerOne.user:id,name,email',
                'reviewerTwo.user:id,name,email',
            ])
            ->orderBy('assigned_at')
            ->get();

        $reviewers = $assignments
            ->flatMap(function ($assignment) {
                return collect([
                    $assignment->reviewerOne ? [
                        'id' => $assignment->reviewerOne->id,
                        'name' => $assignment->reviewerOne->user?->name,
                        'email' => $assignment->reviewerOne->user?->email,
                        'slot' => 'reviewer_one',
                        'assignment_id' => $assignment->id,
                        'organ_id' => $assignment->organ_id,
                        'organ' => $assignment->organ ? [
                            'id' => $assignment->organ->id,
                            'name' => $assignment->organ->name,
                            'type' => $assignment->organ->type,
                        ] : null,
                        'status' => $assignment->status,
                        'review_order' => $assignment->review_order,
                        'assigned_at' => $assignment->assigned_at,
                    ] : null,
                    $assignment->reviewerTwo ? [
                        'id' => $assignment->reviewerTwo->id,
                        'name' => $assignment->reviewerTwo->user?->name,
                        'email' => $assignment->reviewerTwo->user?->email,
                        'slot' => 'reviewer_two',
                        'assignment_id' => $assignment->id,
                        'organ_id' => $assignment->organ_id,
                        'organ' => $assignment->organ ? [
                            'id' => $assignment->organ->id,
                            'name' => $assignment->organ->name,
                            'type' => $assignment->organ->type,
                        ] : null,
                        'status' => $assignment->status,
                        'review_order' => $assignment->review_order,
                        'assigned_at' => $assignment->assigned_at,
                    ] : null,
                ])->filter();
            })
            ->values();

        $reviewAssignments = $assignments->map(fn($assignment) => [
            'id' => $assignment->id,
            'organ_id' => $assignment->organ_id,
            'organ' => $assignment->organ ? [
                'id' => $assignment->organ->id,
                'name' => $assignment->organ->name,
                'type' => $assignment->organ->type,
            ] : null,
            'reviewer_one' => $assignment->reviewerOne ? [
                'id' => $assignment->reviewerOne->id,
                'name' => $assignment->reviewerOne->user?->name,
                'email' => $assignment->reviewerOne->user?->email,
            ] : null,
            'reviewer_two' => $assignment->reviewerTwo ? [
                'id' => $assignment->reviewerTwo->id,
                'name' => $assignment->reviewerTwo->user?->name,
                'email' => $assignment->reviewerTwo->user?->email,
            ] : null,
            'review_order' => $assignment->review_order,
            'status' => $assignment->status,
            'assigned_at' => $assignment->assigned_at,
        ])->values();

        return response()->json([
            'reviewers' => $reviewers,
            'review_assignments' => $reviewAssignments,
            'total' => $reviewers->count(),
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

    public function downloadDocument(Request $request, Protocol $protocol)
    {
        $user = $request->user();

        if (! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $document = $protocol->documents()
            ->where('status', Document::STATUS_ACTIVE)
            ->latest('version')
            ->first() ?: $protocol->latestDocument()->first();

        if (! $document || ! Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'Documento não encontrado.');
        }

        $inline = $request->query('inline') === '1';

        if ($inline) {
            return Storage::disk('public')->response($document->file_path, $document->file_name, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
            ]);
        }

        return Storage::disk('public')->download($document->file_path, $document->file_name);
    }
}
