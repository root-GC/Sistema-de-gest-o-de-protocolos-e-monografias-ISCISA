<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use App\Models\DocumentRevision;
use App\Models\WorkflowEvent;
use Modules\Protocol\app\Http\Requests\SubmitProtocolRequest;
use Modules\Protocol\app\Http\Resources\ProtocolResource;
use Modules\Protocol\app\Http\Resources\ProtocolReviewerResource;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolDocumentRequirement;
use Modules\Protocol\app\Models\ProtocolReviewComment;
use Modules\Protocol\app\Models\TopicReviewComment;
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
        $user->loadMissing(['teacherProfile', 'secretaryProfile', 'adminProfile.organ']);

        if ($user->hasPermission('protocol.view.all') || $this->isScientificDirection($user) || (int) $protocol->student === (int) $user->id) {
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

            return $secretaryProfile
                && $secretaryProfile->organ_id
                && ((int) $protocol->current_organ_id === (int) $secretaryProfile->organ_id
                    || $this->hasSecretaryOrganTrace($protocol, $secretaryProfile->organ_id, $secretaryProfile->organ?->type));
        }

        return false;
    }

    private function reviewerCanAccessRequirement(User $user, Protocol $protocol, ProtocolDocumentRequirement $requirement): bool
    {
        $teacherProfile = $user->teacherProfile;
        $requiredOrganType = Protocol::organTypeFromFormOrgan($requirement->required_for_organ);

        if (! $teacherProfile || ! $requiredOrganType || ! $user->hasPermission('protocol.evaluate')) {
            return false;
        }

        return $protocol->reviewAssignments()
            ->where(fn($query) => $query
                ->where('reviewer_one', $teacherProfile->id)
                ->orWhere('reviewer_two', $teacherProfile->id)
            )
            ->whereHas('organ', fn($query) => $query->where('type', $requiredOrganType))
            ->exists();
    }

    private function hasSecretaryOrganTrace(Protocol $protocol, int $organId, ?string $organType): bool
    {
        $formOrgan = $organType ? Protocol::formOrganFromOrganType($organType) : null;

        return $protocol->histories()
            ->where('organ_id', $organId)
            ->exists()
            || ($formOrgan && $protocol->opinions()->where('organ', $formOrgan)->exists());
    }

    public function store(SubmitProtocolRequest $request)
    {
        $validated = $request->validated();

        $topic = \Modules\Protocol\app\Models\Topic::query()->findOrFail($validated['topic_id']);
        $protocol = $this->protocolService()->submit(
            $request->user(),
            $topic,
            $request->file('document'),
            $validated['protocol_type'],
            $request->file('required_documents', []),
            $request->file('cibs_documents', []),
            $request->file('other_documents', []),
            $request->input('other_document_names', [])
        );

        return response()->json([
            'message' => 'Protocolo e anexos submetidos com sucesso e aguardando autorizacao do supervisor.',
            'protocol' => ProtocolResource::make($protocol->load([
                'topic:id,title,status',
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements',
            ])),
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
        $user = $request->user();
        $protocol = \Modules\Protocol\app\Models\Protocol::query()->findOrFail($protocol);

        if (! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $protocol->load([
            'topic:id,title,justification,status',
            'topic.scientificArea:id,name',
            'student:id,name,email',
            'supervisor.user:id,name,email',
            'documents' => fn($q) => $q->where('status', 'active')->with('rejectedBy:id,name,email'),
            'protocolDocumentRequirements.reviewer:id,name,email',
            'histories' => fn($q) => $q
                ->with(['actor:id,name,email', 'organ:id,name,type'])
                ->orderByDesc('occurred_at')
                ->orderByDesc('id'),
        ]);

        return response()->json([
            'protocol' => ProtocolResource::make($protocol),
        ]);
    }

    public function history(Request $request, string $protocol)
    {
        $user = $request->user();
        $protocol = Protocol::query()->findOrFail($protocol);

        if (! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $legacyHistories = $protocol->histories()
            ->with(['actor:id,name,email', 'organ:id,name,type'])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn($history) => [
                'id' => 'legacy-' . $history->id,
                'organ_id' => $history->organ_id,
                'action' => $history->action,
                'description' => $history->description,
                'old_status' => $history->old_status,
                'new_status' => $history->new_status,
                'metadata' => $history->metadata,
                'occurred_at' => $history->occurred_at,
                'actor' => $history->actor ? [
                    'id' => $history->actor->id,
                    'name' => $history->actor->name,
                    'email' => $history->actor->email,
                ] : null,
                'organ' => $history->organ ? [
                    'id' => $history->organ->id,
                    'name' => $history->organ->name,
                    'type' => $history->organ->type,
                ] : null,
                'source' => 'legacy',
            ]);

        $workflowEvents = collect();
        if (Schema::hasTable('workflow_events')) {
            $workflowEvents = WorkflowEvent::query()
                ->where('subject_type', 'protocol')
                ->where('subject_id', $protocol->id)
                ->with(['actor:id,name,email', 'organ:id,name,type', 'documentRevision'])
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->get()
                ->map(fn (WorkflowEvent $event) => [
                    'id' => 'workflow-' . $event->id,
                    'organ_id' => $event->organ_id,
                    'action' => $event->action,
                    'description' => $event->description,
                    'old_status' => $event->from_state,
                    'new_status' => $event->to_state,
                    'metadata' => $event->metadata,
                    'occurred_at' => $event->occurred_at,
                    'actor' => $event->actor ? [
                        'id' => $event->actor->id,
                        'name' => $event->actor->name,
                        'email' => $event->actor->email,
                    ] : null,
                    'organ' => $event->organ ? [
                        'id' => $event->organ->id,
                        'name' => $event->organ->name,
                        'type' => $event->organ->type,
                    ] : null,
                    'document_revision' => $event->documentRevision ? [
                        'id' => $event->documentRevision->id,
                        'file_name' => $event->documentRevision->file_name,
                        'sha256' => $event->documentRevision->sha256,
                        'availability' => $event->documentRevision->availability,
                    ] : null,
                    'source' => 'workflow',
                ]);
        }

        $histories = $workflowEvents
            ->concat($legacyHistories)
            ->unique(fn (array $entry) => implode('|', [
                $entry['action'] ?? '',
                $entry['old_status'] ?? '',
                $entry['new_status'] ?? '',
                (string) ($entry['occurred_at'] ?? ''),
                (string) ($entry['organ_id'] ?? ''),
            ]))
            ->sortByDesc('occurred_at')
            ->values();

        return response()->json([
            'history' => $histories,
            'backfill_required' => Schema::hasTable('workflow_events') && $workflowEvents->isEmpty() && $legacyHistories->isNotEmpty(),
        ]);
    }

    public function reviewContext(Request $request, Protocol $protocol)
    {
        $user = $request->user();

        if (! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $protocol->load([
            'topic:id,title,document_path,document_name,student_id,supervisor_id',
            'topic.reviewAssignments.evaluation.comment',
            'documents' => fn ($query) => $query->orderBy('version'),
            'evaluationForms.sourceDocument',
            'evaluationForms.opinions',
            'evaluationForms.reviewerEvaluations.reviewer.user',
        ]);

        $isStudent = (int) $protocol->student === (int) $user->id;
        $isCC = $this->userHasOrganRole($user, Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, $protocol);
        $isCIBS = $this->userHasOrganRole($user, Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE, $protocol);
        $topic = $protocol->topic;

        $topicComments = $topic
            ? TopicReviewComment::query()->where('topic_id', $topic->id)
                ->with('user:id,name,email')->orderBy('created_at')->get()
            : collect();

        $response = [
            'protocol' => [
                'id' => $protocol->id,
                'code' => $protocol->code,
                'submission_number' => $protocol->submission_number,
                'version' => $protocol->version,
            ],
            'documents' => $protocol->documents->map(fn (Document $document) => [
                'id' => $document->id,
                'submission_number' => $document->version,
                'label' => $document->version_label,
                'file_name' => $document->file_name,
                'created_at' => $document->created_at,
                'download_url' => url("api/v1/protocols/{$protocol->id}/documents/{$document->id}/download"),
            ])->values(),
            'document_versions' => $this->documentVersions($protocol),
            'topic' => $topic ? [
                'id' => $topic->id,
                'title' => $topic->title,
                'document_name' => $topic->document_name,
                'download_url' => $topic->document_path
                    ? url("api/v1/protocols/{$protocol->id}/topic-document/download")
                    : null,
                'comments' => $topicComments->map(fn (TopicReviewComment $comment) => [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                    'author' => $comment->user ? ['name' => $comment->user->name] : null,
                ])->values(),
                'evaluations' => $topic->reviewAssignments
                    ->filter(fn ($assignment) => $assignment->evaluation)
                    ->map(fn ($assignment) => [
                        'decision' => $assignment->evaluation->decision,
                        'evaluated_at' => $assignment->evaluation->evaluated_at,
                        'comment' => $assignment->evaluation->comment?->content,
                    ])->values(),
            ] : null,
        ];

        if (! $isStudent && ($isCC || $isCIBS)) {
            $ccForms = $protocol->evaluationForms
                ->where('organ', Protocol::ORGAN_COMITE_CIENTIFICO)
                ->map(fn ($form) => [
                    'id' => $form->id,
                    'version' => $form->version,
                    'decision' => $form->final_decision,
                    'conclusion_summary' => $form->conclusion_summary,
                    'source_document_id' => $form->source_document_id,
                    'reviews' => $form->reviewerEvaluations->map(fn ($review) => [
                        'status' => $review->status,
                        'decision' => $review->decision,
                        'overall_comment' => $review->overall_comment,
                        'submitted_at' => $review->submitted_at,
                        'reviewer' => $review->reviewer?->user?->name,
                    ])->values(),
                    'evaluation_form_download_url' => url("api/v1/evaluation-forms/{$form->id}/download"),
                    'opinions' => $form->opinions->map(fn ($opinion) => [
                        'id' => $opinion->id,
                        'download_url' => url("api/v1/opinions/{$opinion->id}/download"),
                        'signed_download_url' => $opinion->signed_document_path
                            ? url("api/v1/opinions/{$opinion->id}/signed-download") : null,
                    ])->values(),
                ])->values();

            $response['cc_context'] = [
                'forms' => $ccForms,
                'supervisor_comments' => ProtocolReviewComment::query()
                    ->where('protocol_id', $protocol->id)->where('stage', 'supervisor')
                    ->with('user:id,name,email')->orderBy('created_at')->get()
                    ->map(fn (ProtocolReviewComment $comment) => [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'created_at' => $comment->created_at,
                        'author' => $comment->user?->name,
                    ])->values(),
            ];
        }

        return response()->json(['review_context' => $response]);
    }

    private function documentVersions(Protocol $protocol): array
    {
        if (! Schema::hasTable('document_revisions')) {
            return [];
        }

        $protocolVersions = DocumentRevision::query()
            ->where('documentable_type', Protocol::class)
            ->where('documentable_id', $protocol->id)
            ->orderBy('submission_number')
            ->orderBy('revision_number')
            ->get();
        $topicVersions = $protocol->topic
            ? DocumentRevision::query()
                ->where('documentable_type', \Modules\Protocol\app\Models\Topic::class)
                ->where('documentable_id', $protocol->topic->id)
                ->orderBy('submission_number')
                ->orderBy('revision_number')
                ->get()
            : collect();

        return $protocolVersions->concat($topicVersions)->map(function (DocumentRevision $revision) use ($protocol): array {
            $downloadUrl = match ($revision->source_table) {
                'documents' => url("api/v1/protocols/{$protocol->id}/documents/{$revision->source_id}/download"),
                'protocol_document_requirements' => url("api/v1/protocols/{$protocol->id}/required-documents/{$revision->source_id}/download"),
                'topics' => url("api/v1/protocols/{$protocol->id}/topic-document/download"),
                default => null,
            };

            return [
                'id' => $revision->id,
                'submission_number' => $revision->submission_number,
                'revision_number' => $revision->revision_number,
                'document_key' => $revision->document_key,
                'file_name' => $revision->file_name,
                'mime_type' => $revision->mime_type,
                'file_size' => $revision->file_size,
                'sha256' => $revision->sha256,
                'availability' => $revision->availability,
                'captured_at' => $revision->captured_at,
                'download_url' => $revision->availability === DocumentRevision::AVAILABILITY_AVAILABLE ? $downloadUrl : null,
            ];
        })->values()->all();
    }

    public function downloadDocumentVersion(Request $request, Protocol $protocol, Document $document)
    {
        if ((int) $document->protocol_id !== (int) $protocol->id || ! $this->canAccessProtocolDocument($request->user(), $protocol)) {
            abort(403);
        }

        if (! Storage::disk('public')->exists($document->file_path)) {
            abort(410, 'O documento desta versão não está disponível no armazenamento.');
        }

        return Storage::disk('public')->download($document->file_path, $document->file_name);
    }

    public function downloadTopicDocumentForProtocol(Request $request, Protocol $protocol)
    {
        if (! $this->canAccessProtocolDocument($request->user(), $protocol)) {
            abort(403);
        }

        $topic = $protocol->topic;
        if (! $topic?->document_path || ! Storage::disk('public')->exists($topic->document_path)) {
            abort(410, 'O documento desta versão do tema não está disponível no armazenamento.');
        }

        return Storage::disk('public')->download($topic->document_path, $topic->document_name ?: basename($topic->document_path));
    }

    public function listReviewComments(Request $request, Protocol $protocol)
    {
        if (! $this->canAccessProtocolDocument($request->user(), $protocol)) {
            abort(403);
        }

        return response()->json(['comments' => $protocol->reviewComments()
            ->with('user:id,name,email')->orderBy('created_at')->get()]);
    }

    public function storeReviewComment(Request $request, Protocol $protocol)
    {
        $user = $request->user()->load('teacherProfile');
        $validated = $request->validate(['content' => 'required|string|max:5000']);

        if (! $user->teacherProfile || (int) $protocol->supervisor_id !== (int) $user->teacherProfile->id) {
            abort(403);
        }

        $comment = ProtocolReviewComment::create([
            'protocol_id' => $protocol->id,
            'document_id' => $protocol->latestDocument()->value('id'),
            'user_id' => $user->id,
            'stage' => 'supervisor',
            'content' => trim($validated['content']),
        ]);

        return response()->json(['comment' => $comment->load('user:id,name,email')], 201);
    }

    private function userHasOrganRole(User $user, string $organType, Protocol $protocol): bool
    {
        $user->loadMissing(['teacherProfile', 'secretaryProfile.organ']);

        if ($user->hasPermission('protocol.view.all')) {
            return true;
        }

        if ($user->secretaryProfile?->organ?->type === $organType) {
            return true;
        }

        return $user->teacherProfile && $protocol->reviewAssignments()
            ->where(fn ($query) => $query->where('reviewer_one', $user->teacherProfile->id)
                ->orWhere('reviewer_two', $user->teacherProfile->id))
            ->whereHas('organ', fn ($query) => $query->where('type', $organType))
            ->exists();
    }

    private function isScientificDirection(User $user): bool
    {
        return $user->hasPermission('admin.organs')
            && $user->adminProfile?->access_scope === 'organ'
            && $user->adminProfile?->organ?->type === 'scientific_direction';
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
            'message' => 'Protocolo nao aprovado pelo supervisor.',
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

    public function listRequiredDocuments(Request $request, string $protocol)
    {
        $user = $request->user();
        $protocol = Protocol::query()
            ->with('protocolDocumentRequirements.reviewer:id,name,email')
            ->findOrFail($protocol);

        if (! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        $requirements = $protocol->protocolDocumentRequirements
            ->whereNull('archived_at')
            ->where('submission_number', (int) ($protocol->submission_number ?: 1));

        if ($user->secretaryProfile && $user->secretaryProfile->organ) {
            if ($user->secretaryProfile->organ->type === Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE) {
                $requirements = $requirements->where('required_for_organ', Protocol::ORGAN_COMITE_CIENTIFICO);
            }
        }

        if ($user->teacherProfile && $user->hasPermission('protocol.evaluate')) {
            $assignment = $protocol->reviewAssignments()
                ->with('organ:id,name,type')
                ->where(fn($query) => $query
                    ->where('reviewer_one', $user->teacherProfile->id)
                    ->orWhere('reviewer_two', $user->teacherProfile->id)
                )
                ->orderByDesc('assigned_at')
                ->first();
            $formOrgan = $assignment?->organ?->type
                ? Protocol::formOrganFromOrganType($assignment->organ->type)
                : null;

            $requirements = $formOrgan
                ? $requirements->where('required_for_organ', $formOrgan)
                : collect();
        }

        return response()->json([
            'documents' => $requirements->values(),
        ]);
    }

    public function uploadRequiredDocument(Request $request, string $protocol, string $requirement)
    {
        $user = $request->user();
        $protocol = Protocol::query()->findOrFail($protocol);
        $requirement = ProtocolDocumentRequirement::query()
            ->where('protocol_id', $protocol->id)
            ->whereNull('archived_at')
            ->where('submission_number', (int) ($protocol->submission_number ?: 1))
            ->findOrFail($requirement);

        $request->validate([
            'document' => 'required|file|mimes:pdf|mimetypes:application/pdf|max:10240',
        ]);

        $result = $this->protocolService()->uploadRequiredDocument(
            $requirement,
            $request->file('document'),
            $user
        );

        return response()->json([
            'message' => 'Anexo reenviado com sucesso.',
            'document' => $result,
        ]);
    }

    public function approveRequiredDocument(Request $request, string $protocol, string $requirement)
    {
        $protocol = Protocol::query()->findOrFail($protocol);
        $requirement = ProtocolDocumentRequirement::query()
            ->where('protocol_id', $protocol->id)
            ->whereNull('archived_at')
            ->where('submission_number', (int) ($protocol->submission_number ?: 1))
            ->findOrFail($requirement);

        $result = $this->protocolService()->reviewRequiredDocument(
            $requirement,
            true,
            null,
            $request->user()
        );

        return response()->json([
            'message' => 'Anexo aprovado com sucesso.',
            'protocol' => $result->toArray(),
        ]);
    }

    public function rejectRequiredDocument(Request $request, string $protocol, string $requirement)
    {
        $protocol = Protocol::query()->findOrFail($protocol);
        $requirement = ProtocolDocumentRequirement::query()
            ->where('protocol_id', $protocol->id)
            ->whereNull('archived_at')
            ->where('submission_number', (int) ($protocol->submission_number ?: 1))
            ->findOrFail($requirement);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:5000',
        ]);

        $result = $this->protocolService()->reviewRequiredDocument(
            $requirement,
            false,
            $validated['rejection_reason'],
            $request->user()
        );

        return response()->json([
            'message' => 'Anexo nao aprovado com sucesso.',
            'protocol' => $result->toArray(),
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

    // ============================================================
    // NÚCLEO
    // ============================================================

    public function getEligibleReviewersNucleo(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) abort(403);

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'nucleus') {
            return response()->json(['message' => 'Apenas secretarias do Nucleo Cientifico podem listar revisores.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);
        $reviewers = $this->protocolService()->getEligibleReviewersForNucleo($protocol);

        return response()->json(['reviewers' => $reviewers->values()]);
    }

    public function getAssignedReviewersNucleo(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) {
            return response()->json(['message' => 'Utilizador nao tem permissao.'], 403);
        }

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'nucleus') {
            return response()->json(['message' => 'Apenas secretarias do Nucleo Cientifico.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);
        $reviewers = $this->protocolService()->getAssignedReviewersForOrgan($protocol, $secretaryProfile->organ_id);

        $assignments = $protocol->reviewAssignments()
            ->where('organ_id', $secretaryProfile->organ_id)
            ->with(['organ:id,name,type', 'reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])
            ->orderBy('assigned_at')
            ->get();

        $reviewAssignments = $assignments->map(fn($a) => [
            'id' => $a->id,
            'organ_id' => $a->organ_id,
            'organ' => $a->organ ? ['id' => $a->organ->id, 'name' => $a->organ->name, 'type' => $a->organ->type] : null,
            'reviewer_one' => $a->reviewerOne ? ['id' => $a->reviewerOne->id, 'name' => $a->reviewerOne->user?->name, 'email' => $a->reviewerOne->user?->email] : null,
            'reviewer_two' => $a->reviewerTwo ? ['id' => $a->reviewerTwo->id, 'name' => $a->reviewerTwo->user?->name, 'email' => $a->reviewerTwo->user?->email] : null,
            'review_order' => $a->review_order,
            'is_primary' => (bool) $a->is_primary,
            'status' => $a->status,
            'assigned_at' => $a->assigned_at,
        ])->values();

        return response()->json([
            'reviewers' => $reviewers,
            'review_assignments' => $reviewAssignments,
            'total' => $reviewers->count(),
        ]);
    }

    public function assignReviewersNucleo(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) abort(403);

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'nucleus') {
            return response()->json(['message' => 'Apenas secretarias do Nucleo Cientifico podem atribuir revisores.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);

        $validated = $request->validate([
            'reviewer_one_id' => 'required|integer|exists:teacher_profiles,id',
            'reviewer_two_id' => 'required|integer|exists:teacher_profiles,id|different:reviewer_one_id',
        ]);

        $reviewerIds = [(int) $validated['reviewer_one_id'], (int) $validated['reviewer_two_id']];

        $result = $this->protocolService()->assignReviewersToOrgan($protocol, $reviewerIds, $user, 'nucleus');

        return response()->json([
            'message' => 'Revisores atribuidos com sucesso ao protocolo no Nucleo Cientifico.',
            'protocol' => $result->toArray(),
        ]);
    }

    // ============================================================
    // COMITÉ CIENTÍFICO (CC)
    // ============================================================

    public function getEligibleReviewersCC(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) abort(403);

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'scientific_committee') {
            return response()->json(['message' => 'Apenas secretarias do Comite Cientifico podem listar revisores.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);
        $reviewers = $this->protocolService()->getEligibleReviewersForCC($protocol);

        return response()->json(['reviewers' => $reviewers->values()]);
    }

    public function getAssignedReviewersCC(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) {
            return response()->json(['message' => 'Utilizador nao tem permissao.'], 403);
        }

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'scientific_committee') {
            return response()->json(['message' => 'Apenas secretarias do Comite Cientifico.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);

        $reviewers = $this->protocolService()->getAssignedReviewersForOrgan($protocol, $secretaryProfile->organ_id);

        $assignments = $protocol->reviewAssignments()
            ->where('organ_id', $secretaryProfile->organ_id)
            ->with(['organ:id,name,type', 'reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])
            ->orderBy('assigned_at')
            ->get();

        $reviewAssignments = $assignments->map(fn($a) => [
            'id' => $a->id,
            'organ_id' => $a->organ_id,
            'organ' => $a->organ ? ['id' => $a->organ->id, 'name' => $a->organ->name, 'type' => $a->organ->type] : null,
            'reviewer_one' => $a->reviewerOne ? ['id' => $a->reviewerOne->id, 'name' => $a->reviewerOne->user?->name, 'email' => $a->reviewerOne->user?->email] : null,
            'reviewer_two' => $a->reviewerTwo ? ['id' => $a->reviewerTwo->id, 'name' => $a->reviewerTwo->user?->name, 'email' => $a->reviewerTwo->user?->email] : null,
            'review_order' => $a->review_order,
            'is_primary' => (bool) $a->is_primary,
            'status' => $a->status,
            'assigned_at' => $a->assigned_at,
        ])->values();

        return response()->json([
            'reviewers' => $reviewers,
            'review_assignments' => $reviewAssignments,
            'total' => $reviewers->count(),
        ]);
    }

    public function assignReviewersCC(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) abort(403);

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'scientific_committee') {
            return response()->json(['message' => 'Apenas secretarias do Comite Cientifico podem atribuir revisores.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);

        $validated = $request->validate([
            'reviewer_one_id' => 'required|integer|exists:teacher_profiles,id',
            'reviewer_two_id' => 'required|integer|exists:teacher_profiles,id|different:reviewer_one_id',
        ]);

        $reviewerIds = [(int) $validated['reviewer_one_id'], (int) $validated['reviewer_two_id']];

        $result = $this->protocolService()->assignReviewersToOrgan($protocol, $reviewerIds, $user, 'scientific_committee');

        return response()->json([
            'message' => 'Revisores atribuidos com sucesso ao protocolo no Comite Cientifico.',
            'protocol' => $result->toArray(),
        ]);
    }

    // ============================================================
    // COMITÉ DE BIOÉTICA
    // ============================================================

    public function getEligibleReviewersBioetica(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) abort(403);

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'bioethics_committee') {
            return response()->json(['message' => 'Apenas secretarias do Comite de Bioetica podem listar revisores.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);
        $reviewers = $this->protocolService()->getEligibleReviewersForBioetica($protocol);

        return response()->json(['reviewers' => $reviewers->values()]);
    }

    public function getAssignedReviewersBioetica(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) {
            return response()->json(['message' => 'Utilizador nao tem permissao.'], 403);
        }

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'bioethics_committee') {
            return response()->json(['message' => 'Apenas secretarias do Comite de Bioetica.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);

        $reviewers = $this->protocolService()->getAssignedReviewersForOrgan($protocol, $secretaryProfile->organ_id);

        $assignments = $protocol->reviewAssignments()
            ->where('organ_id', $secretaryProfile->organ_id)
            ->with(['organ:id,name,type', 'reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])
            ->orderBy('assigned_at')
            ->get();

        $reviewAssignments = $assignments->map(fn($a) => [
            'id' => $a->id,
            'organ_id' => $a->organ_id,
            'organ' => $a->organ ? ['id' => $a->organ->id, 'name' => $a->organ->name, 'type' => $a->organ->type] : null,
            'reviewer_one' => $a->reviewerOne ? ['id' => $a->reviewerOne->id, 'name' => $a->reviewerOne->user?->name, 'email' => $a->reviewerOne->user?->email] : null,
            'reviewer_two' => $a->reviewerTwo ? ['id' => $a->reviewerTwo->id, 'name' => $a->reviewerTwo->user?->name, 'email' => $a->reviewerTwo->user?->email] : null,
            'review_order' => $a->review_order,
            'is_primary' => (bool) $a->is_primary,
            'status' => $a->status,
            'assigned_at' => $a->assigned_at,
        ])->values();

        return response()->json([
            'reviewers' => $reviewers,
            'review_assignments' => $reviewAssignments,
            'total' => $reviewers->count(),
        ]);
    }

    public function assignReviewersBioetica(Request $request, string $protocol)
    {
        $user = $request->user();
        if (! $user->hasPermission('protocol.assign')) abort(403);

        $secretaryProfile = $user->secretaryProfile;
        if (! $secretaryProfile || $secretaryProfile->organ?->type !== 'bioethics_committee') {
            return response()->json(['message' => 'Apenas secretarias do Comite de Bioetica podem atribuir revisores.'], 403);
        }

        $protocol = Protocol::query()->findOrFail($protocol);

        $validated = $request->validate([
            'primary_reviewer_id' => 'nullable|integer|exists:teacher_profiles,id',
            'reviewer_ids' => 'nullable|array',
            'reviewer_ids.*' => 'integer|distinct|exists:teacher_profiles,id',
            'reviewer_one_id' => 'nullable|integer|exists:teacher_profiles,id',
            'reviewer_two_id' => 'nullable|integer|exists:teacher_profiles,id|different:reviewer_one_id',
        ]);

        $primaryReviewerId = (int) ($validated['primary_reviewer_id'] ?? $validated['reviewer_one_id'] ?? 0);
        $reviewerIds = collect($validated['reviewer_ids'] ?? [])
            ->when(isset($validated['reviewer_one_id']), fn($ids) => $ids->push((int) $validated['reviewer_one_id']))
            ->when(isset($validated['reviewer_two_id']), fn($ids) => $ids->push((int) $validated['reviewer_two_id']))
            ->prepend($primaryReviewerId)
            ->filter()
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->toArray();

        if (! $primaryReviewerId) {
            return response()->json(['message' => 'Informe o revisor principal do Comite de Bioetica.'], 422);
        }

        $result = $this->protocolService()->assignReviewersToBioetica($protocol, $primaryReviewerId, $reviewerIds, $user);

        return response()->json([
            'message' => 'Revisores atribuidos com sucesso ao protocolo no Comite de Bioetica.',
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

        if (! $document) {
            abort(404, 'Documento não encontrado.');
        }

        if (! Storage::disk('public')->exists($document->file_path)) {
            abort(410, 'O documento desta versão não está disponível no armazenamento.');
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

    public function downloadRequiredDocument(Request $request, Protocol $protocol, ProtocolDocumentRequirement $requirement)
    {
        $user = $request->user();

        if ((int) $requirement->protocol_id !== (int) $protocol->id || ! $this->canAccessProtocolDocument($user, $protocol)) {
            abort(403);
        }

        if ($user->hasPermission('protocol.evaluate') && ! $this->reviewerCanAccessRequirement($user, $protocol, $requirement)) {
            abort(403);
        }

        if (! $requirement->file_path) {
            abort(404, 'Anexo não encontrado.');
        }

        if (! Storage::disk('public')->exists($requirement->file_path)) {
            abort(410, 'O anexo desta versão não está disponível no armazenamento.');
        }

        $inline = $request->query('inline') === '1';
        $fileName = $requirement->file_name ?: basename($requirement->file_path);

        if ($inline) {
            return Storage::disk('public')->response($requirement->file_path, $fileName);
        }

        return Storage::disk('public')->download($requirement->file_path, $fileName);
    }

    public function submitSignedParecer(Request $request, Protocol $protocol, Opinion $opinion)
    {
        $user = $request->user();

        if (! $user->hasPermission('protocol.assign')) {
            abort(403, 'Apenas a secretaria pode assinar o parecer.');
        }

        $validated = $request->validate([
            'signed_document' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ]);

        $protocol = $this->protocolService()->submitSignedParecer(
            $protocol,
            $opinion,
            $user,
            $validated['signed_document']
        );

        return response()->json([
            'message' => 'Parecer assinado e enviado ao estudante.',
            'protocol' => [
                'id' => $protocol->id,
                'status' => $protocol->status,
                'status_label' => $protocol->status_label,
            ],
        ]);
    }
}
