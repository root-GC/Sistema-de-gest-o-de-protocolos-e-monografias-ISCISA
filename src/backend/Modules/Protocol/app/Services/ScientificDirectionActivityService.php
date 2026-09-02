<?php

namespace Modules\Protocol\app\Services;

use App\Models\DocumentRevision;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Modules\Organization\app\Models\Organ;
use Modules\Protocol\app\Models\DeliberationMeeting;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolHistory;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicHistory;
use Modules\Protocol\app\Models\TopicReviewAssignment;
use Modules\User\app\Models\User;

/** Read-only operational analytics for the Scientific Direction. */
class ScientificDirectionActivityService
{
    public function assertDirection(User $user): void
    {
        $user->loadMissing(['roles.permissions', 'directPermissions', 'adminProfile.organ']);
        abort_unless(
            $user->hasPermission('admin.organs')
            && $user->adminProfile?->access_scope === 'organ'
            && $user->adminProfile?->organ?->type === 'scientific_direction',
            403,
        );
    }

    public function dashboard(User $user): array
    {
        $this->assertDirection($user);
        $from = now()->subMonthsNoOverflow(12)->startOfDay();
        $organs = Organ::query()
            ->whereIn('type', [Protocol::ORGAN_TYPE_NUCLEUS, Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE])
            ->orderByRaw("case when type = 'nucleus' then 0 else 1 end")
            ->orderBy('name')
            ->get()
            ->map(fn (Organ $organ) => $this->organMetrics($organ, $from))
            ->values();

        $reviewAssigned = $organs->sum('review_assigned');
        $reviewSubmitted = $organs->sum('review_submitted');
        $durations = $organs->pluck('average_duration_days')->filter(fn ($value) => $value !== null);

        return [
            'period' => ['from' => $from->toDateString(), 'to' => now()->toDateString(), 'label' => 'Últimos 12 meses'],
            'summary' => [
                'processes' => $organs->sum('processes'),
                'meetings' => $organs->sum('meetings.total'),
                'review_rate' => $reviewAssigned > 0 ? round(($reviewSubmitted / $reviewAssigned) * 100, 1) : null,
                'average_duration_days' => $durations->isNotEmpty() ? round($durations->avg(), 1) : null,
            ],
            'organs' => $organs,
        ];
    }

    public function processes(User $user, Organ $organ, ?string $status, ?string $search, int $perPage = 20): array
    {
        $this->assertDirection($user);
        $this->assertOperationalOrgan($organ);

        if ($organ->type === Protocol::ORGAN_TYPE_NUCLEUS) {
            $query = $this->topicsForOrgan($organ)->with(['course:id,name,code', 'student:id,name,email', 'reviewAssignments.reviewer.user:id,name,email', 'reviewAssignments.evaluation']);
            $this->applyStatusFilter($query, $status);
            if ($search) $query->where('title', 'ilike', "%{$search}%");
            $page = $query->latest('submitted_at')->paginate($perPage);
            return $this->page('topics', $page, fn (Topic $topic) => $this->topicListItem($topic));
        }

        $query = $this->protocolsForOrgan($organ)->with(['topic:id,title,course_id', 'topic.course:id,name,code', 'student:id,name,email', 'reviewAssignments' => fn ($query) => $query->with(['organ:id,name,type', 'reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])]);
        $this->applyStatusFilter($query, $status);
        if ($search) $query->where(fn (Builder $searchQuery) => $searchQuery->whereHas('topic', fn (Builder $topic) => $topic->where('title', 'ilike', "%{$search}%"))->orWhere('code', 'ilike', "%{$search}%"));
        $page = $query->latest('submitted_at')->paginate($perPage);
        return $this->page('protocols', $page, fn (Protocol $protocol) => $this->protocolListItem($protocol));
    }

    public function protocol(User $user, Organ $organ, Protocol $protocol): array
    {
        $this->assertDirection($user);
        $this->assertOperationalOrgan($organ);
        abort_unless($organ->type !== Protocol::ORGAN_TYPE_NUCLEUS && $this->protocolBelongsTo($protocol, $organ), 404);

        $protocol->load([
            'topic:id,title,document_name,document_path,course_id', 'topic.course:id,name,code', 'student:id,name,email',
            'documents', 'protocolDocumentRequirements.reviewer:id,name,email',
            'histories' => fn ($query) => $query->with(['actor:id,name,email', 'organ:id,name,type'])->orderBy('occurred_at'),
            'reviewAssignments' => fn ($query) => $query->with(['organ:id,name,type', 'reviewerOne.user:id,name,email', 'reviewerTwo.user:id,name,email'])->withTrashed()->orderBy('assigned_at'),
            'evaluationForms' => fn ($query) => $query->with([
                'sourceDocument', 'opinions', 'reviewerEvaluations.reviewer.user:id,name,email',
                'reviewerEvaluations.criterionReviews.formCriterion', 'deliberationMeetingItems.meeting.organ:id,name,type',
            ])->withTrashed()->orderBy('created_at'),
        ]);

        return ['process' => $this->protocolDetail($protocol)];
    }

    public function topic(User $user, Organ $organ, Topic $topic): array
    {
        $this->assertDirection($user);
        $this->assertOperationalOrgan($organ);
        abort_unless($organ->type === Protocol::ORGAN_TYPE_NUCLEUS && (int) $topic->scientificArea()->value('organ_id') === (int) $organ->id, 404);

        $topic->load([
            'course:id,name,code', 'student:id,name,email', 'supervisor.user:id,name,email',
            'histories' => fn ($query) => $query->with(['actor:id,name,email', 'organ:id,name,type'])->orderBy('occurred_at'),
            'reviewAssignments' => fn ($query) => $query->with(['reviewer.user:id,name,email', 'evaluation.comment'])->withTrashed()->orderBy('assigned_at'),
            'reviewComments.user:id,name,email',
        ]);

        return ['process' => $this->topicDetail($topic)];
    }

    private function organMetrics(Organ $organ, Carbon $from): array
    {
        if ($organ->type === Protocol::ORGAN_TYPE_NUCLEUS) return $this->nucleusMetrics($organ, $from);
        return $this->committeeMetrics($organ, $from);
    }

    private function nucleusMetrics(Organ $organ, Carbon $from): array
    {
        $topics = $this->topicsForOrgan($organ)->where('submitted_at', '>=', $from);
        $assignments = TopicReviewAssignment::query()
            ->whereHas('topic.scientificArea', fn (Builder $query) => $query->where('organ_id', $organ->id))
            ->where('assigned_at', '>=', $from)->with('evaluation')->get();
        $history = TopicHistory::query()->where('organ_id', $organ->id)->whereIn('action', ['approved', 'rejected'])->where('occurred_at', '>=', $from)->with('topic:id,submitted_at')->get();

        return $this->metricPayload($organ, 'topics', (clone $topics)->count(), $this->topicStates($topics), $assignments->count(), $assignments->filter(fn ($item) => $item->evaluation?->evaluated_at)->count(), $this->averageFromTopicHistory($history), null);
    }

    private function committeeMetrics(Organ $organ, Carbon $from): array
    {
        $protocols = $this->protocolsForOrgan($organ)->where('submitted_at', '>=', $from);
        $evaluations = ReviewerEvaluation::query()->whereHas('protocolReviewAssignment', fn (Builder $query) => $query->where('organ_id', $organ->id)->where('assigned_at', '>=', $from))->get();
        $history = ProtocolHistory::query()->where('organ_id', $organ->id)->whereIn('action', ['approved', 'rejected'])->where('occurred_at', '>=', $from)->with('protocol:id,submitted_at')->get();
        $meetings = DeliberationMeeting::query()->where('organ_id', $organ->id)->where('scheduled_at', '>=', $from)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return $this->metricPayload($organ, 'protocols', (clone $protocols)->count(), $this->protocolStates($protocols), $evaluations->count(), $evaluations->where('status', ReviewerEvaluation::STATUS_SUBMITTED)->count(), $this->averageFromProtocolHistory($history), $meetings);
    }

    private function metricPayload(Organ $organ, string $kind, int $processes, array $states, int $assigned, int $submitted, ?float $duration, ?Collection $meetings): array
    {
        $meetingStates = ['scheduled' => 0, 'in_progress' => 0, 'completed' => 0, 'cancelled' => 0];
        foreach ($meetingStates as $status => $_) $meetingStates[$status] = (int) ($meetings?->get($status, 0) ?? 0);
        return [
            'id' => $organ->id, 'name' => $organ->name, 'type' => $organ->type, 'kind' => $kind,
            'processes' => $processes, 'states' => $states, 'review_assigned' => $assigned, 'review_submitted' => $submitted,
            'review_rate' => $assigned > 0 ? round(($submitted / $assigned) * 100, 1) : null,
            'average_duration_days' => $duration, 'meetings' => ['total' => array_sum($meetingStates), ...$meetingStates],
        ];
    }

    private function topicsForOrgan(Organ $organ): Builder { return Topic::query()->whereHas('scientificArea', fn (Builder $query) => $query->where('organ_id', $organ->id)); }
    private function protocolsForOrgan(Organ $organ): Builder { return Protocol::query()->where(fn (Builder $query) => $query->where('current_organ_id', $organ->id)->orWhereHas('histories', fn (Builder $history) => $history->where('organ_id', $organ->id))); }
    private function protocolBelongsTo(Protocol $protocol, Organ $organ): bool { return (int) $protocol->current_organ_id === (int) $organ->id || $protocol->histories()->where('organ_id', $organ->id)->exists(); }
    private function assertOperationalOrgan(Organ $organ): void { abort_unless(in_array($organ->type, [Protocol::ORGAN_TYPE_NUCLEUS, Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE], true), 404); }

    private function topicStates(Builder $query): array { return $this->groupStates((clone $query)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status')); }
    private function protocolStates(Builder $query): array { return $this->groupStates((clone $query)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status')); }
    private function groupStates(Collection $states): array { return $states->reduce(function (array $result, $total, $status) { $bucket = $this->stateBucket($status); $result[$bucket] = ($result[$bucket] ?? 0) + (int) $total; return $result; }, []); }
    private function stateBucket(string $status): string { return str_contains($status, 'rejected') || str_contains($status, 'approved') || str_contains($status, 'parecer_pending') ? 'decided' : (str_contains($status, 'review') || str_contains($status, 'assigned') ? 'in_review' : 'pending'); }

    private function applyStatusFilter(Builder $query, ?string $status): void
    {
        if (! $status) return;
        if (! in_array($status, ['pending', 'in_review', 'decided'], true)) {
            $query->where('status', $status);
            return;
        }

        $query->where(function (Builder $filter) use ($status) {
            if ($status === 'in_review') {
                $filter->where('status', 'like', '%review%')->orWhere('status', 'like', '%assigned%');
                return;
            }
            if ($status === 'decided') {
                $filter->where('status', 'like', '%approved%')->orWhere('status', 'like', '%rejected%')->orWhere('status', 'like', '%parecer_pending%');
                return;
            }
            $filter->where('status', 'not like', '%review%')->where('status', 'not like', '%assigned%')->where('status', 'not like', '%approved%')->where('status', 'not like', '%rejected%')->where('status', 'not like', '%parecer_pending%');
        });
    }

    private function averageFromProtocolHistory(Collection $events): ?float
    {
        if ($events->isEmpty()) return null;
        $starts = ProtocolHistory::query()->where('organ_id', $events->first()->organ_id)->whereIn('protocol_id', $events->pluck('protocol_id')->unique())->selectRaw('protocol_id, min(occurred_at) as entered_at')->groupBy('protocol_id')->pluck('entered_at', 'protocol_id');
        return $this->averageFromHistory($events, fn ($event) => $starts->get($event->protocol_id));
    }

    private function averageFromTopicHistory(Collection $events): ?float
    {
        if ($events->isEmpty()) return null;
        $starts = TopicHistory::query()->where('organ_id', $events->first()->organ_id)->whereIn('topic_id', $events->pluck('topic_id')->unique())->selectRaw('topic_id, min(occurred_at) as entered_at')->groupBy('topic_id')->pluck('entered_at', 'topic_id');
        return $this->averageFromHistory($events, fn ($event) => $starts->get($event->topic_id));
    }

    private function averageFromHistory(Collection $events, callable $enteredAt): ?float { $days = $events->map(fn ($event) => $enteredAt($event) ? Carbon::parse($enteredAt($event))->diffInHours($event->occurred_at) / 24 : null)->filter(fn ($value) => $value !== null); return $days->isEmpty() ? null : round($days->avg(), 1); }

    private function page(string $kind, $page, callable $map): array { return ['kind' => $kind, 'data' => collect($page->items())->map($map)->values(), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()]]; }
    private function topicListItem(Topic $topic): array { return ['id' => $topic->id, 'kind' => 'topics', 'title' => $topic->title, 'status' => $topic->status, 'status_label' => $topic->status_label, 'submitted_at' => $topic->submitted_at, 'student' => $topic->student?->only(['name', 'email']), 'course' => $topic->course?->only(['name', 'code']), 'reviewers' => $topic->reviewAssignments->map(fn ($item) => ['name' => $item->reviewer?->user?->name, 'status' => $item->evaluation?->evaluated_at ? 'submitted' : 'pending'])->values()]; }
    private function protocolListItem(Protocol $protocol): array
    {
        // The legacy `student` column contains the foreign key and shadows the relation.
        $student = $protocol->relationLoaded('student') ? $protocol->getRelation('student') : null;

        return [
            'id' => $protocol->id,
            'kind' => 'protocols',
            'code' => $protocol->code,
            'title' => $protocol->topic?->title,
            'status' => $protocol->status,
            'status_label' => $protocol->status_label,
            'submitted_at' => $protocol->submitted_at,
            'student' => $student ? ['name' => $student->name, 'email' => $student->email] : null,
            'course' => $protocol->topic?->course?->only(['name', 'code']),
            'reviewers' => $protocol->reviewAssignments->flatMap(fn ($item) => collect([$item->reviewerOne, $item->reviewerTwo])->filter()->map(fn ($reviewer) => ['name' => $reviewer->user?->name, 'assigned_at' => $item->assigned_at, 'organ' => $item->organ?->name]))->values(),
        ];
    }

    private function protocolDetail(Protocol $protocol): array
    {
        $revisionRows = DocumentRevision::query()->where(fn (Builder $query) => $query->where('documentable_type', Protocol::class)->where('documentable_id', $protocol->id)->orWhere('documentable_type', Topic::class)->where('documentable_id', $protocol->topic_id))->orderBy('submission_number')->orderBy('revision_number')->get();
        return [
            ...$this->protocolListItem($protocol), 'submission_number' => $protocol->submission_number,
            'documents' => $protocol->documents->map(fn ($document) => ['id' => $document->id, 'name' => $document->file_name, 'version' => $document->version_label, 'type' => 'document', 'download_url' => url("api/v1/protocols/{$protocol->id}/documents/{$document->id}/download")])->values(),
            'requirements' => $protocol->protocolDocumentRequirements->map(fn ($item) => ['id' => $item->id, 'name' => $item->nome, 'submission_number' => $item->submission_number, 'status' => $item->status_label, 'optional' => $item->is_optional, 'download_url' => $item->download_url])->values(),
            'document_versions' => $revisionRows->map(fn ($item) => ['id' => $item->id, 'submission_number' => $item->submission_number, 'revision_number' => $item->revision_number, 'name' => $item->file_name, 'document_key' => $item->document_key, 'availability' => $item->availability, 'download_url' => $item->availability === DocumentRevision::AVAILABILITY_AVAILABLE ? $this->revisionDownloadUrl($protocol, $item) : null])->values(),
            'assignments' => $protocol->reviewAssignments->flatMap(fn ($item) => collect([$item->reviewerOne, $item->reviewerTwo])->filter()->map(fn ($reviewer) => ['organ' => $item->organ?->name, 'reviewer' => $reviewer->user?->name, 'assigned_at' => $item->assigned_at, 'released' => $item->trashed()]))->values(),
            'evaluations' => $protocol->evaluationForms->map(fn (EvaluationForm $form) => ['id' => $form->id, 'organ' => $form->organ, 'version' => $form->version, 'status' => $form->status, 'decision' => $form->final_decision, 'decided_at' => $form->decided_at, 'summary' => $form->conclusion_summary, 'source_document_id' => $form->source_document_id, 'reviews' => $form->reviewerEvaluations->map(fn ($review) => ['reviewer' => $review->reviewer?->user?->name, 'status' => $review->status, 'decision' => $review->decision, 'submitted_at' => $review->submitted_at, 'comment' => $review->overall_comment, 'criteria' => $review->criterionReviews->map(fn ($criterion) => ['name' => $criterion->formCriterion?->criterion_name, 'comment' => $criterion->comment])->values()])->values(), 'opinions' => $form->opinions->map(fn ($opinion) => ['decision' => $opinion->decision, 'issued_at' => $opinion->issued_at, 'download_url' => url("api/v1/opinions/{$opinion->id}/download"), 'signed_download_url' => $opinion->signed_document_path ? url("api/v1/opinions/{$opinion->id}/signed-download") : null])->values(), 'meetings' => $form->deliberationMeetingItems->map(fn ($item) => ['status' => $item->status, 'scheduled_at' => $item->meeting?->scheduled_at, 'meeting_status' => $item->meeting?->status, 'location' => $item->meeting?->location, 'organ' => $item->meeting?->organ?->name])->values()])->values(),
            'history' => $protocol->histories->map(fn ($item) => ['id' => $item->id, 'action' => $item->action, 'description' => $item->description, 'occurred_at' => $item->occurred_at, 'organ' => $item->organ?->name, 'actor' => $item->actor?->name])->values(),
        ];
    }

    private function topicDetail(Topic $topic): array
    {
        $revisions = DocumentRevision::query()->where('documentable_type', Topic::class)->where('documentable_id', $topic->id)->orderBy('submission_number')->orderBy('revision_number')->get();
        return [
            ...$this->topicListItem($topic), 'document' => $topic->document_path ? ['name' => $topic->document_name, 'download_url' => url("api/v1/topics/{$topic->id}/document")] : null,
            'document_versions' => $revisions->map(fn ($item) => ['id' => $item->id, 'submission_number' => $item->submission_number, 'revision_number' => $item->revision_number, 'name' => $item->file_name, 'availability' => $item->availability, 'download_url' => $item->availability === DocumentRevision::AVAILABILITY_AVAILABLE ? url("api/v1/scientific-direction/document-revisions/{$item->id}/download") : null])->values(),
            'assignments' => $topic->reviewAssignments->map(fn ($item) => ['reviewer' => $item->reviewer?->user?->name, 'assigned_at' => $item->assigned_at, 'decision' => $item->evaluation?->decision, 'evaluated_at' => $item->evaluation?->evaluated_at, 'comment' => $item->evaluation?->comment?->content])->values(),
            'comments' => $topic->reviewComments->map(fn ($item) => ['author' => $item->user?->name, 'content' => $item->content, 'created_at' => $item->created_at])->values(),
            'history' => $topic->histories->map(fn ($item) => ['id' => $item->id, 'action' => $item->action, 'description' => $item->description, 'occurred_at' => $item->occurred_at, 'organ' => $item->organ?->name, 'actor' => $item->actor?->name])->values(),
        ];
    }

    private function revisionDownloadUrl(Protocol $protocol, DocumentRevision $revision): ?string
    {
        return url("api/v1/scientific-direction/document-revisions/{$revision->id}/download");
    }
}
