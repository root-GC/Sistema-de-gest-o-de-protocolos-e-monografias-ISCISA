<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Modules\Protocol\app\Models\DeliberationMeeting;
use Modules\Protocol\app\Models\DeliberationMeetingItem;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\OrganDocumentRequirement;
use Modules\Protocol\app\Models\OrganDocumentRequirementEvent;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolHistory;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicHistory;
use Modules\Protocol\app\Models\TopicReviewAssignment;
use Modules\User\app\Models\Course;
use Modules\Organization\app\Models\Organ;
use Modules\User\app\Models\User;

class OrganWorkspaceController extends Controller
{
    public function submissionRequirements()
    {
        $requirements = OrganDocumentRequirement::query()
            ->where('is_active', true)
            ->whereHas('organ', fn (Builder $query) => $query->whereIn('type', [
                Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE,
                Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE,
            ]))
            ->with('organ:id,name,type')
            ->orderBy('is_optional')
            ->orderBy('name')
            ->get()
            ->groupBy(fn (OrganDocumentRequirement $requirement) => Protocol::formOrganFromOrganType($requirement->organ->type));

        return response()->json([
            'requirements' => [
                Protocol::ORGAN_COMITE_CIENTIFICO => $this->requirementList($requirements->get(Protocol::ORGAN_COMITE_CIENTIFICO, collect())),
                Protocol::ORGAN_COMITE_BIOETICA => $this->requirementList($requirements->get(Protocol::ORGAN_COMITE_BIOETICA, collect())),
            ],
        ]);
    }

    public function dashboard(Request $request)
    {
        $organ = $this->presidentOrgan($request->user());

        return response()->json([
            'organ' => $this->organPayload($organ),
            'dashboard' => $organ->type === Protocol::ORGAN_TYPE_NUCLEUS
                ? $this->nucleusDashboard($organ)
                : $this->committeeDashboard($organ),
        ]);
    }

    public function processes(Request $request)
    {
        $organ = $this->presidentOrgan($request->user());

        if ($organ->type === Protocol::ORGAN_TYPE_NUCLEUS) {
            $topics = Topic::query()
                ->whereHas('scientificArea', fn (Builder $query) => $query->where('organ_id', $organ->id))
                ->with(['course:id,name,code', 'student:id,name,email', 'reviewAssignments.reviewer.user:id,name,email', 'reviewAssignments.evaluation'])
                ->latest('submitted_at')
                ->paginate(20);

            return response()->json([
                'kind' => 'topics',
                'data' => collect($topics->items())->map(fn (Topic $topic) => $this->topicPayload($topic))->values(),
                'meta' => $this->paginationMeta($topics),
            ]);
        }

        $protocols = $this->protocolsForOrgan($organ)
            ->with($this->protocolRelations($organ))
            ->latest('submitted_at')
            ->paginate(20);

        return response()->json([
            'kind' => 'protocols',
            'data' => collect($protocols->items())->map(fn (Protocol $protocol) => $this->protocolPayload($protocol, $organ))->values(),
            'meta' => $this->paginationMeta($protocols),
        ]);
    }

    public function protocol(Request $request, Protocol $protocol)
    {
        $organ = $this->presidentOrgan($request->user());
        abort_unless($organ->type !== Protocol::ORGAN_TYPE_NUCLEUS && $this->protocolBelongsToOrgan($protocol, $organ), 403);

        $formOrgan = Protocol::formOrganFromOrganType($organ->type);
        $protocol->load([
            'topic:id,title,status,course_id',
            'topic.course:id,name,code',
            'student:id,name,email',
            'documents',
            'protocolDocumentRequirements' => fn ($query) => $query
                ->where('required_for_organ', $formOrgan)
                ->where('submission_number', (int) ($protocol->submission_number ?: 1))
                ->whereNull('archived_at')
                ->with('reviewer:id,name,email'),
            'histories' => fn ($query) => $query
                ->where('organ_id', $organ->id)
                ->with(['actor:id,name,email', 'organ:id,name,type'])
                ->orderBy('occurred_at'),
            'reviewAssignments' => fn ($query) => $query
                ->where('organ_id', $organ->id)
                ->with(['reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])
                ->orderBy('assigned_at'),
            'evaluationForms' => fn ($query) => $query
                ->where('organ', $formOrgan)
                ->with([
                    'reviewerEvaluations.reviewer.user:id,name,email',
                    'reviewerEvaluations.protocolReviewAssignment',
                    'reviewerEvaluations.criterionReviews.formCriterion',
                    'formCriteria',
                    'opinions',
                ])
                ->orderBy('created_at'),
        ]);

        return response()->json([
            'protocol' => $this->protocolPayload($protocol, $organ, true),
        ]);
    }

    public function courses(Request $request)
    {
        $organ = $this->workspaceOrgan($request->user(), true);
        abort_unless($organ->type === Protocol::ORGAN_TYPE_NUCLEUS, 404);

        $courses = Course::query()
            ->whereHas('scientificArea', fn (Builder $query) => $query->where('organ_id', $organ->id))
            ->with('scientificArea:id,name,organ_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'organ' => $this->organPayload($organ),
            'courses' => $courses->map(fn (Course $course) => [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
                'scientific_area' => $course->scientificArea ? [
                    'id' => $course->scientificArea->id,
                    'name' => $course->scientificArea->name,
                ] : null,
            ])->values(),
        ]);
    }

    public function documentRequirements(Request $request)
    {
        $organ = $this->workspaceOrgan($request->user(), true);
        $this->ensureCommittee($organ);

        return response()->json([
            'organ' => $this->organPayload($organ),
            'requirements' => $this->requirementList(
                OrganDocumentRequirement::query()->where('organ_id', $organ->id)->orderByDesc('is_active')->orderBy('name')->get()
            ),
        ]);
    }

    public function storeDocumentRequirement(Request $request)
    {
        $organ = $this->presidentOrgan($request->user());
        $this->ensureCommittee($organ);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'document_key' => ['nullable', 'string', 'max:100', 'regex:/^[a-z0-9_\-]+$/'],
            'is_optional' => ['required', 'boolean'],
        ]);

        $key = $this->uniqueDocumentKey($organ, $validated['document_key'] ?? $validated['name']);
        $requirement = OrganDocumentRequirement::create([
            'organ_id' => $organ->id,
            'document_key' => $key,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_optional' => $validated['is_optional'],
            'is_active' => true,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);
        $this->recordRequirementEvent($requirement, $request->user(), 'created', null, $this->requirementAuditValues($requirement));

        return response()->json(['message' => 'Documento necessário adicionado.', 'requirement' => $this->requirementPayload($requirement)], 201);
    }

    public function updateDocumentRequirement(Request $request, OrganDocumentRequirement $requirement)
    {
        $user = $request->user();
        $organ = $this->workspaceOrgan($user, true);
        $this->ensureCommittee($organ);
        abort_unless((int) $requirement->organ_id === (int) $organ->id, 403);

        $isPresident = $this->isPresidentOf($user, $organ);
        $rules = $isPresident
            ? [
                'name' => ['sometimes', 'required', 'string', 'max:255'],
                'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
                'is_optional' => ['sometimes', 'boolean'],
                'is_active' => ['sometimes', 'boolean'],
            ]
            : [
                'is_optional' => ['sometimes', 'boolean'],
                'is_active' => ['sometimes', 'boolean'],
            ];
        $validated = $request->validate($rules);
        abort_if($validated === [], 422, 'Indique pelo menos uma alteração.');

        $before = $this->requirementAuditValues($requirement);
        $requirement->fill($validated);
        $requirement->updated_by = $user->id;
        $requirement->save();
        $after = $this->requirementAuditValues($requirement);
        $action = array_key_exists('is_active', $validated) && ! $requirement->is_active ? 'deactivated' : 'updated';
        $this->recordRequirementEvent($requirement, $user, $action, $before, $after);

        return response()->json(['message' => 'Lista de documentos atualizada.', 'requirement' => $this->requirementPayload($requirement)]);
    }

    private function presidentOrgan(User $user): Organ
    {
        $user->loadMissing('adminProfile.organ');
        $profile = $user->adminProfile;
        abort_unless($profile && $profile->access_scope === 'organ' && $profile->organ, 403);

        return $profile->organ;
    }

    private function workspaceOrgan(User $user, bool $allowSecretary): Organ
    {
        $user->loadMissing(['adminProfile.organ', 'secretaryProfile.organ']);

        if ($this->isPresidentOf($user)) {
            return $user->adminProfile->organ;
        }

        if ($allowSecretary && $user->secretaryProfile?->organ) {
            return $user->secretaryProfile->organ;
        }

        abort(403);
    }

    private function isPresidentOf(User $user, ?Organ $organ = null): bool
    {
        $profile = $user->adminProfile;

        return (bool) ($profile
            && $profile->access_scope === 'organ'
            && $profile->organ
            && (! $organ || (int) $profile->organ_id === (int) $organ->id));
    }

    private function ensureCommittee(Organ $organ): void
    {
        abort_unless(in_array($organ->type, [Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE], true), 404);
    }

    private function nucleusDashboard(Organ $organ): array
    {
        $topics = Topic::query()->whereHas('scientificArea', fn (Builder $query) => $query->where('organ_id', $organ->id));
        $assignments = TopicReviewAssignment::query()
            ->whereHas('topic.scientificArea', fn (Builder $query) => $query->where('organ_id', $organ->id))
            ->with(['reviewer.user:id,name,email', 'evaluation'])
            ->get();

        return [
            'kind' => 'topics',
            'summary' => [
                'total' => (clone $topics)->count(),
                'pending_assignment' => (clone $topics)->where('status', Topic::STATUS_PENDING_NUCLEO)->count(),
                'in_review' => (clone $topics)->whereIn('status', [Topic::STATUS_ASSIGNED, Topic::STATUS_IN_REVIEW])->count(),
                'approved' => (clone $topics)->where('status', Topic::STATUS_APPROVED_NUCLEO)->count(),
            ],
            'statuses' => (clone $topics)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'reviewer_performance' => $this->topicReviewerPerformance($assignments),
            'recent_activity' => TopicHistory::query()->where('organ_id', $organ->id)->with('actor:id,name,email')->latest('occurred_at')->limit(10)->get()->map(fn ($event) => $this->activityPayload($event))->values(),
        ];
    }

    private function committeeDashboard(Organ $organ): array
    {
        $protocols = $this->protocolsForOrgan($organ);
        $evaluations = ReviewerEvaluation::query()
            ->whereHas('protocolReviewAssignment', fn (Builder $query) => $query->where('organ_id', $organ->id))
            ->with([
                'reviewer.user:id,name,email',
                'protocolReviewAssignment',
                'evaluationForm.deliberationMeetingItems.meeting:id,status,completed_at',
            ])
            ->get();

        return [
            'kind' => 'protocols',
            'summary' => [
                'total' => (clone $protocols)->count(),
                'in_current_queue' => (clone $protocols)->where('current_organ_id', $organ->id)->count(),
                'document_validation' => (clone $protocols)->whereIn('status', $organ->type === Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE ? [Protocol::STATUS_DOCUMENTS_PENDING_CC] : [Protocol::STATUS_DOCUMENTS_PENDING_CIBS])->count(),
                'in_review' => (clone $protocols)->whereIn('status', $organ->type === Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE ? [Protocol::STATUS_PENDING_COMITE_CIENTIFICO, Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO] : [Protocol::STATUS_PENDING_COMITE_BIOETICA, Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA])->count(),
            ],
            'statuses' => (clone $protocols)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status'),
            'reviewer_performance' => $this->protocolReviewerPerformance($evaluations),
            'recent_activity' => ProtocolHistory::query()->where('organ_id', $organ->id)->with('actor:id,name,email')->latest('occurred_at')->limit(10)->get()->map(fn ($event) => $this->activityPayload($event))->values(),
        ];
    }

    private function protocolsForOrgan(Organ $organ): Builder
    {
        return Protocol::query()->where(function (Builder $query) use ($organ) {
            $query->where('current_organ_id', $organ->id)
                ->orWhereHas('histories', fn (Builder $historyQuery) => $historyQuery->where('organ_id', $organ->id));
        });
    }

    private function protocolBelongsToOrgan(Protocol $protocol, Organ $organ): bool
    {
        return (int) $protocol->current_organ_id === (int) $organ->id
            || $protocol->histories()->where('organ_id', $organ->id)->exists();
    }

    private function protocolRelations(Organ $organ): array
    {
        $formOrgan = Protocol::formOrganFromOrganType($organ->type);

        return [
            'topic:id,title,status,course_id',
            'topic.course:id,name,code',
            'student:id,name,email',
            'reviewAssignments' => fn ($query) => $query
                ->where('organ_id', $organ->id)
                ->with(['reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])
                ->orderBy('assigned_at'),
            'evaluationForms' => fn ($query) => $query
                ->where('organ', $formOrgan)
                ->with(['reviewerEvaluations.reviewer.user:id,name,email', 'reviewerEvaluations.protocolReviewAssignment'])
                ->orderBy('created_at'),
        ];
    }

    private function protocolPayload(Protocol $protocol, Organ $organ, bool $detailed = false): array
    {
        $evaluationsByReviewer = $protocol->relationLoaded('evaluationForms')
            ? $protocol->evaluationForms->flatMap->reviewerEvaluations->keyBy('reviewer_id')
            : collect();
        $payload = [
            'id' => $protocol->id,
            'code' => $protocol->code,
            'status' => $protocol->status,
            'status_label' => $protocol->status_label,
            'submitted_at' => $protocol->submitted_at,
            'submission_number' => $protocol->submission_number,
            'topic' => $protocol->topic ? ['id' => $protocol->topic->id, 'title' => $protocol->topic->title, 'course' => $protocol->topic->course ? ['name' => $protocol->topic->course->name, 'code' => $protocol->topic->course->code] : null] : null,
            'student' => $protocol->relationLoaded('student') && $protocol->getRelation('student') ? ['id' => $protocol->getRelation('student')->id, 'name' => $protocol->getRelation('student')->name, 'email' => $protocol->getRelation('student')->email] : null,
            'reviewers' => $protocol->reviewAssignments->flatMap(function ($assignment) use ($evaluationsByReviewer) {
                return collect([$assignment->reviewerOne, $assignment->reviewerTwo])->filter()->map(function ($reviewer) use ($assignment, $evaluationsByReviewer) {
                    $evaluation = $evaluationsByReviewer->get($reviewer->id);
                    return [
                        'id' => $reviewer->id,
                        'name' => $reviewer->user?->name,
                        'email' => $reviewer->user?->email,
                        'assigned_at' => $assignment->assigned_at,
                        'status' => $evaluation?->status ?? 'pending',
                        'submitted_at' => $evaluation?->submitted_at,
                    ];
                });
            })->values(),
        ];

        if (! $detailed) {
            return $payload;
        }

        $payload['documents'] = $protocol->documents->map(fn ($document) => [
            'id' => $document->id,
            'file_name' => $document->file_name,
            'version_label' => $document->version_label,
            'download_url' => url("api/v1/protocols/{$protocol->id}/documents/{$document->id}/download"),
        ])->values();
        $payload['requirements'] = $protocol->protocolDocumentRequirements->map(fn ($requirement) => [
            'id' => $requirement->id,
            'name' => $requirement->nome,
            'description' => $requirement->description,
            'is_optional' => $requirement->is_optional,
            'sent' => $requirement->enviado,
            'approved' => $requirement->aprovado,
            'rejection_reason' => $requirement->rejection_reason,
            'reviewer' => $requirement->reviewer ? ['name' => $requirement->reviewer->name] : null,
            'download_url' => $requirement->download_url,
        ])->values();
        $payload['evaluations'] = $protocol->evaluationForms->map(fn (EvaluationForm $form) => [
            'id' => $form->id,
            'version' => $form->version,
            'status' => $form->status,
            'final_decision' => $form->final_decision,
            'conclusion_summary' => $form->conclusion_summary,
            'reviewers' => $form->reviewerEvaluations->map(fn (ReviewerEvaluation $evaluation) => [
                'id' => $evaluation->id,
                'name' => $evaluation->reviewer?->user?->name,
                'status' => $evaluation->status,
                'decision' => $evaluation->decision,
                'comment' => $evaluation->overall_comment,
                'submitted_at' => $evaluation->submitted_at,
                'criteria' => $evaluation->criterionReviews->map(fn ($review) => [
                    'criterion' => $review->formCriterion?->criterion_name,
                    'comment' => $review->comment,
                ])->values(),
            ])->values(),
        ])->values();
        $payload['history'] = $protocol->histories->map(fn ($event) => $this->activityPayload($event))->values();

        return $payload;
    }

    private function topicPayload(Topic $topic): array
    {
        return [
            'id' => $topic->id,
            'title' => $topic->title,
            'status' => $topic->status,
            'status_label' => $topic->status_label,
            'submitted_at' => $topic->submitted_at,
            'course' => $topic->course ? ['name' => $topic->course->name, 'code' => $topic->course->code] : null,
            'student' => $topic->student ? ['name' => $topic->student->name, 'email' => $topic->student->email] : null,
            'reviewers' => $topic->reviewAssignments->map(fn ($assignment) => [
                'name' => $assignment->reviewer?->user?->name,
                'assigned_at' => $assignment->assigned_at,
                'decision' => $assignment->evaluation?->decision,
                'evaluated_at' => $assignment->evaluation?->evaluated_at,
            ])->values(),
        ];
    }

    private function topicReviewerPerformance(Collection $assignments): Collection
    {
        return $assignments->groupBy('reviewer_id')->map(function (Collection $items) {
            $reviewer = $items->first()->reviewer;
            $completed = $items->filter(fn ($assignment) => $assignment->evaluation?->evaluated_at);
            return [
                'reviewer_id' => $reviewer?->id,
                'name' => $reviewer?->user?->name,
                'assigned' => $items->count(),
                'pending' => $items->count() - $completed->count(),
                'completed' => $completed->count(),
                'average_completion_days' => $this->averageDays($completed->map(fn ($assignment) => [$assignment->assigned_at, $assignment->evaluation?->evaluated_at])),
            ];
        })->values();
    }

    private function protocolReviewerPerformance(Collection $evaluations): Collection
    {
        return $evaluations->groupBy('reviewer_id')->map(function (Collection $items) {
            $reviewer = $items->first()->reviewer;
            $completed = $items->where('status', ReviewerEvaluation::STATUS_SUBMITTED);
            $pending = $items->reject(fn (ReviewerEvaluation $evaluation) => $evaluation->status === ReviewerEvaluation::STATUS_SUBMITTED);
            $overdue = $pending->filter(fn (ReviewerEvaluation $evaluation) => $this->reviewDeadline($evaluation)?->isPast());
            return [
                'reviewer_id' => $reviewer?->id,
                'name' => $reviewer?->user?->name,
                'assigned' => $items->count(),
                'pending' => $pending->count(),
                'in_progress' => $items->where('status', ReviewerEvaluation::STATUS_IN_PROGRESS)->count(),
                'completed' => $completed->count(),
                'overdue' => $overdue->count(),
                'average_completion_days' => $this->averageDays($completed->map(fn ($evaluation) => [$evaluation->protocolReviewAssignment?->assigned_at, $evaluation->submitted_at])),
            ];
        })->values();
    }

    private function averageDays(Collection $periods): ?float
    {
        $days = $periods->filter(fn ($period) => $period[0] && $period[1])->map(fn ($period) => $period[0]->diffInHours($period[1]) / 24);
        return $days->isEmpty() ? null : round($days->avg(), 1);
    }

    private function reviewDeadline(ReviewerEvaluation $evaluation): ?Carbon
    {
        $item = $evaluation->evaluationForm?->deliberationMeetingItems
            ?->filter(fn (DeliberationMeetingItem $item) => $item->status === DeliberationMeetingItem::STATUS_DELIBERATED)
            ->filter(fn (DeliberationMeetingItem $item) => $item->meeting?->status === DeliberationMeeting::STATUS_COMPLETED && $item->meeting?->completed_at)
            ->sortByDesc(fn (DeliberationMeetingItem $item) => $item->meeting->completed_at)
            ->first();

        return $item?->meeting?->completed_at
            ? Carbon::parse($item->meeting->completed_at)->addDays(3)
            : null;
    }

    private function activityPayload($event): array
    {
        return [
            'id' => $event->id,
            'action' => $event->action,
            'description' => $event->description,
            'occurred_at' => $event->occurred_at,
            'actor' => $event->actor ? ['name' => $event->actor->name, 'email' => $event->actor->email] : null,
        ];
    }

    private function organPayload(Organ $organ): array
    {
        return ['id' => $organ->id, 'name' => $organ->name, 'type' => $organ->type, 'description' => $organ->description];
    }

    private function paginationMeta($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'total' => $paginator->total()];
    }

    private function requirementList(Collection $requirements): Collection
    {
        return $requirements->map(fn (OrganDocumentRequirement $requirement) => $this->requirementPayload($requirement))->values();
    }

    private function requirementPayload(OrganDocumentRequirement $requirement): array
    {
        return [
            'id' => $requirement->id,
            'organ_id' => $requirement->organ_id,
            'document_key' => $requirement->document_key,
            'name' => $requirement->name,
            'description' => $requirement->description,
            'is_optional' => $requirement->is_optional,
            'is_active' => $requirement->is_active,
        ];
    }

    private function requirementAuditValues(OrganDocumentRequirement $requirement): array
    {
        return collect($this->requirementPayload($requirement))->only(['document_key', 'name', 'description', 'is_optional', 'is_active'])->all();
    }

    private function recordRequirementEvent(OrganDocumentRequirement $requirement, User $actor, string $action, ?array $oldValues, array $newValues): void
    {
        OrganDocumentRequirementEvent::create([
            'organ_document_requirement_id' => $requirement->id,
            'organ_id' => $requirement->organ_id,
            'actor_id' => $actor->id,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'occurred_at' => now(),
        ]);
    }

    private function uniqueDocumentKey(Organ $organ, string $source): string
    {
        $base = Str::of($source)->ascii()->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->substr(0, 90)->value() ?: 'documento';
        $key = $base;
        $suffix = 2;
        while (OrganDocumentRequirement::query()->where('organ_id', $organ->id)->where('document_key', $key)->exists()) {
            $key = "{$base}_{$suffix}";
            $suffix++;
        }
        return $key;
    }
}
