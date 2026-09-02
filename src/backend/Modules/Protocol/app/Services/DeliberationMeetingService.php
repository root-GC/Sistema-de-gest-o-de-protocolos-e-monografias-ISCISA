<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Events\DeliberationMeetingChanged;
use Modules\Protocol\app\Models\DeliberationMeeting;
use Modules\Protocol\app\Models\DeliberationMeetingItem;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;

class DeliberationMeetingService
{
    private const ACTIVE_ITEM_STATUSES = [
        DeliberationMeetingItem::STATUS_SCHEDULED,
        DeliberationMeetingItem::STATUS_IN_PROGRESS,
    ];

    private const QUEUE_FORM_STATUSES = [
        EvaluationForm::STATUS_PENDING_REVIEW,
        EvaluationForm::STATUS_IN_REVIEW,
        EvaluationForm::STATUS_DELIBERATION_PENDING,
        EvaluationForm::STATUS_NOT_DELIBERATED,
    ];

    public function __construct(private EvaluationService $evaluationService) {}

    public function queue(User $user, ?int $requestedOrganId = null): Collection
    {
        $organ = $this->resolveManageableOrgan($user, $requestedOrganId);

        return EvaluationForm::query()
            ->where('organ', Protocol::formOrganFromOrganType($organ->type))
            ->where('form_type', EvaluationForm::FORM_TYPE_EVALUATION)
            ->whereIn('status', self::QUEUE_FORM_STATUSES)
            ->whereHas('protocol', fn ($query) => $query->where('current_organ_id', $organ->id))
            ->whereHas('reviewerEvaluations')
            ->whereDoesntHave(
                'deliberationMeetingItems',
                fn ($query) => $query->whereIn('status', self::ACTIVE_ITEM_STATUSES)
            )
            ->whereDoesntHave(
                'deliberationMeetingItems.meeting',
                fn ($query) => $query->where('status', DeliberationMeeting::STATUS_IN_PROGRESS)
            )
            ->with($this->formRelations())
            ->get()
            ->map(fn (EvaluationForm $form) => $this->queueEntry($form, $organ))
            ->sortBy('queue_entered_at')
            ->values();
    }

    public function meetings(User $user, array $filters = []): Collection
    {
        $query = DeliberationMeeting::query()->with($this->meetingRelations());
        $this->scopeVisibleMeetings($query, $user, isset($filters['organ_id']) ? (int) $filters['organ_id'] : null);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['from'])) {
            $query->where('scheduled_at', '>=', $this->filterBoundary($filters['from'], false));
        }
        if (! empty($filters['to'])) {
            $query->where('scheduled_at', '<=', $this->filterBoundary($filters['to'], true));
        }

        return $query->orderBy('scheduled_at')->get()
            ->map(fn (DeliberationMeeting $meeting) => $this->meetingData($meeting, $user));
    }

    public function show(DeliberationMeeting $meeting, User $user): array
    {
        $this->assertCanView($meeting, $user);

        return $this->meetingData($meeting->load($this->meetingRelations()), $user);
    }

    public function create(User $user, array $data): DeliberationMeeting
    {
        $organ = $this->resolveManageableOrgan($user, isset($data['organ_id']) ? (int) $data['organ_id'] : null);
        $scheduledAt = Carbon::parse($data['scheduled_at'])->utc();
        $this->assertFuture($scheduledAt);

        $meeting = DB::transaction(function () use ($user, $organ, $scheduledAt, $data) {
            $forms = $this->lockEligibleForms($data['evaluation_form_ids'], $organ);

            $meeting = DeliberationMeeting::create([
                'organ_id' => $organ->id,
                'scheduled_by' => $user->id,
                'scheduled_at' => $scheduledAt,
                'location' => trim($data['location']),
                'notes' => $data['notes'] ?? null,
                'status' => DeliberationMeeting::STATUS_SCHEDULED,
            ]);

            foreach ($forms as $form) {
                $queueEnteredAt = $this->queueEnteredAt($form);
                $meeting->items()->create([
                    'evaluation_form_id' => $form->id,
                    'queue_entered_at' => $queueEnteredAt,
                    'status' => DeliberationMeetingItem::STATUS_SCHEDULED,
                ]);
                $form->update([
                    'deliberation_date' => $scheduledAt,
                    'deliberation_location' => trim($data['location']),
                    'deliberation_scheduled_by' => $user->id,
                ]);
                $this->recordHistory($form, $meeting, $user, 'deliberation_meeting_scheduled', 'Reunião de deliberação marcada.', [
                    'scheduled_at' => $scheduledAt->toIso8601String(),
                    'location' => trim($data['location']),
                ]);
            }

            event(new DeliberationMeetingChanged($meeting, 'scheduled'));

            return $meeting;
        });

        return $meeting->load($this->meetingRelations());
    }

    public function update(DeliberationMeeting $meeting, User $user, array $data): DeliberationMeeting
    {
        $this->assertCanManage($meeting, $user);
        $scheduledAt = Carbon::parse($data['scheduled_at'])->utc();
        $this->assertFuture($scheduledAt);

        return DB::transaction(function () use ($meeting, $user, $data, $scheduledAt) {
            $meeting = DeliberationMeeting::lockForUpdate()->findOrFail($meeting->id);
            if ($meeting->status !== DeliberationMeeting::STATUS_SCHEDULED) {
                $this->fail('Apenas reuniões ainda não iniciadas podem ser reagendadas.');
            }

            $oldSchedule = $meeting->scheduled_at?->toIso8601String();
            $meeting->update([
                'scheduled_at' => $scheduledAt,
                'location' => trim($data['location']),
                'notes' => $data['notes'] ?? $meeting->notes,
            ]);

            foreach ($meeting->items()->with('evaluationForm')->get() as $item) {
                $item->evaluationForm->update([
                    'deliberation_date' => $scheduledAt,
                    'deliberation_location' => trim($data['location']),
                    'deliberation_scheduled_by' => $user->id,
                ]);
                $this->recordHistory($item->evaluationForm, $meeting, $user, 'deliberation_meeting_rescheduled', 'Reunião de deliberação reagendada.', [
                    'previous_scheduled_at' => $oldSchedule,
                    'scheduled_at' => $scheduledAt->toIso8601String(),
                    'location' => trim($data['location']),
                ]);
            }

            event(new DeliberationMeetingChanged($meeting, 'rescheduled'));

            return $meeting->fresh()->load($this->meetingRelations());
        });
    }

    public function cancel(DeliberationMeeting $meeting, User $user, ?string $reason): DeliberationMeeting
    {
        $this->assertCanManage($meeting, $user);

        return DB::transaction(function () use ($meeting, $user, $reason) {
            $meeting = DeliberationMeeting::lockForUpdate()->findOrFail($meeting->id);
            if ($meeting->status !== DeliberationMeeting::STATUS_SCHEDULED) {
                $this->fail('Apenas reuniões ainda não iniciadas podem ser canceladas.');
            }

            $meeting->update([
                'status' => DeliberationMeeting::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'cancellation_reason' => $reason,
            ]);

            foreach ($meeting->items()->with('evaluationForm')->get() as $item) {
                $item->update([
                    'status' => DeliberationMeetingItem::STATUS_CANCELLED,
                    'completed_at' => now(),
                ]);
                $item->evaluationForm->update([
                    'deliberation_date' => null,
                    'deliberation_location' => null,
                    'deliberation_scheduled_by' => null,
                ]);
                $this->recordHistory($item->evaluationForm, $meeting, $user, 'deliberation_meeting_cancelled', 'Reunião de deliberação cancelada.', [
                    'reason' => $reason,
                ]);
            }

            event(new DeliberationMeetingChanged($meeting, 'cancelled'));

            return $meeting->fresh()->load($this->meetingRelations());
        });
    }

    public function startMeeting(DeliberationMeeting $meeting, User $user): DeliberationMeeting
    {
        $this->assertSecretaryCanStart($meeting, $user);

        return DB::transaction(function () use ($meeting, $user) {
            $meeting = DeliberationMeeting::lockForUpdate()->findOrFail($meeting->id);

            if (now()->lt($meeting->scheduled_at)) {
                $this->fail('A reunião só pode ser iniciada no horário marcado.');
            }
            if ($meeting->status !== DeliberationMeeting::STATUS_SCHEDULED) {
                $this->fail('Esta reunião já não pode ser iniciada.');
            }

            $items = $meeting->items()
                ->lockForUpdate()
                ->with('evaluationForm')
                ->where('status', DeliberationMeetingItem::STATUS_SCHEDULED)
                ->orderBy('queue_entered_at')
                ->get();

            if ($items->isEmpty()) {
                $this->fail('Esta reunião não possui protocolos pendentes para iniciar.');
            }

            foreach ($items as $item) {
                $form = $this->evaluationService->openForMeeting($item->evaluationForm);
                $item->update(['status' => DeliberationMeetingItem::STATUS_IN_PROGRESS, 'started_at' => now()]);
                $this->recordHistory($form, $meeting, $user, 'deliberation_meeting_started', 'Reunião de deliberação iniciada pela secretaria.', [
                    'meeting_item_id' => $item->id,
                ]);
            }

            $meeting->update(['status' => DeliberationMeeting::STATUS_IN_PROGRESS, 'started_at' => now()]);
            event(new DeliberationMeetingChanged($meeting, 'started'));

            return $meeting->fresh()->load($this->meetingRelations());
        });
    }

    public function closeItem(
        DeliberationMeeting $meeting,
        DeliberationMeetingItem $item,
        User $user,
        string $result
    ): DeliberationMeeting {
        $this->assertItemBelongsToMeeting($meeting, $item);
        $this->assertSecretaryCanStart($meeting, $user);

        return DB::transaction(function () use ($meeting, $item, $user, $result) {
            $meeting = DeliberationMeeting::lockForUpdate()->findOrFail($meeting->id);
            $item = DeliberationMeetingItem::lockForUpdate()->findOrFail($item->id);
            if ($item->status !== DeliberationMeetingItem::STATUS_IN_PROGRESS) {
                $this->fail('Este protocolo não está em deliberação.');
            }

            $formResult = $result === DeliberationMeetingItem::STATUS_DELIBERATED
                ? EvaluationForm::STATUS_DELIBERATED
                : EvaluationForm::STATUS_NOT_DELIBERATED;
            $form = $this->evaluationService->closeMeeting($item->evaluationForm, $user, $formResult);
            $item->update(['status' => $result, 'completed_at' => now()]);

            $this->recordHistory($form, $meeting, $user, 'deliberation_meeting_item_closed', 'Protocolo encerrado na reunião de deliberação.', [
                'meeting_item_id' => $item->id,
                'result' => $result,
            ]);

            return $meeting->fresh()->load($this->meetingRelations());
        });
    }

    public function completeMeeting(DeliberationMeeting $meeting, User $user): DeliberationMeeting
    {
        $this->assertSecretaryCanStart($meeting, $user);

        return DB::transaction(function () use ($meeting, $user) {
            $meeting = DeliberationMeeting::lockForUpdate()->findOrFail($meeting->id);
            if ($meeting->status !== DeliberationMeeting::STATUS_IN_PROGRESS) {
                $this->fail('Apenas reuniões em andamento podem ser encerradas.');
            }

            $items = $meeting->items()
                ->lockForUpdate()
                ->with('evaluationForm')
                ->orderBy('queue_entered_at')
                ->get();

            if ($items->contains(fn (DeliberationMeetingItem $item) => in_array($item->status, self::ACTIVE_ITEM_STATUSES, true))) {
                $this->fail('Registe o resultado de todos os protocolos antes de encerrar a reunião.');
            }

            $completedAt = now();
            $meeting->update([
                'status' => DeliberationMeeting::STATUS_COMPLETED,
                'completed_at' => $completedAt,
            ]);

            foreach ($items as $item) {
                $this->recordHistory($item->evaluationForm, $meeting, $user, 'deliberation_meeting_completed', 'Reunião de deliberação encerrada pela secretaria.', [
                    'meeting_item_id' => $item->id,
                    'result' => $item->status,
                    'completed_at' => $completedAt->toIso8601String(),
                ]);
            }

            event(new DeliberationMeetingChanged($meeting, 'completed'));

            return $meeting->fresh()->load($this->meetingRelations());
        });
    }

    public function activeItemForForm(EvaluationForm $form): ?DeliberationMeetingItem
    {
        return $form->deliberationMeetingItems()
            ->whereIn('status', self::ACTIVE_ITEM_STATUSES)
            ->latest('id')
            ->first();
    }

    private function lockEligibleForms(array $ids, Organ $organ): Collection
    {
        $ids = collect($ids)->map(fn ($id) => (int) $id)->filter()->unique()->values();
        if ($ids->isEmpty()) {
            $this->fail('Seleciona pelo menos um protocolo para a pauta.');
        }

        $forms = EvaluationForm::query()->lockForUpdate()
            ->whereIn('id', $ids)
            ->where('organ', Protocol::formOrganFromOrganType($organ->type))
            ->where('form_type', EvaluationForm::FORM_TYPE_EVALUATION)
            ->whereIn('status', self::QUEUE_FORM_STATUSES)
            ->whereHas('protocol', fn ($query) => $query->where('current_organ_id', $organ->id))
            ->whereHas('reviewerEvaluations')
            ->with($this->formRelations())
            ->get();

        if ($forms->count() !== $ids->count()) {
            $this->fail('Uma ou mais fichas não são elegíveis para esta reunião.');
        }
        if (DeliberationMeetingItem::query()->whereIn('evaluation_form_id', $ids)
            ->whereIn('status', self::ACTIVE_ITEM_STATUSES)->exists()) {
            $this->fail('Uma das fichas já pertence a uma reunião ativa.', 409);
        }

        return $forms->sortBy(fn ($form) => $this->queueEnteredAt($form))->values();
    }

    private function queueEntry(EvaluationForm $form, Organ $organ): array
    {
        $enteredAt = $this->queueEnteredAt($form);

        return [
            'evaluation_form_id' => $form->id,
            'protocol' => $this->protocolData($form),
            'organ' => ['id' => $organ->id, 'name' => $organ->name, 'type' => $organ->type],
            'queue_entered_at' => $enteredAt->toIso8601String(),
            'waiting_days' => (int) max(0, $enteredAt->diffInDays(now())),
            'form_status' => $form->status,
            'reviewers' => $form->reviewerEvaluations->map(fn ($evaluation) => $this->reviewerData($evaluation, $form))->values(),
        ];
    }

    private function queueEnteredAt(EvaluationForm $form): Carbon
    {
        $lastNoConsensus = $form->deliberationMeetingItems
            ->where('status', DeliberationMeetingItem::STATUS_NOT_DELIBERATED)
            ->sortByDesc('completed_at')
            ->first()?->completed_at;
        if ($lastNoConsensus) {
            return Carbon::parse($lastNoConsensus);
        }

        $assignedAt = $form->reviewerEvaluations
            ->map(fn ($evaluation) => $evaluation->protocolReviewAssignment?->assigned_at)
            ->filter()
            ->sort()
            ->first();

        return Carbon::parse($assignedAt ?: $form->created_at);
    }

    private function reviewerData(ReviewerEvaluation $evaluation, ?EvaluationForm $form = null): array
    {
        $assignedAt = $evaluation->protocolReviewAssignment?->assigned_at
            ? Carbon::parse($evaluation->protocolReviewAssignment->assigned_at)
            : Carbon::parse($evaluation->created_at);
        $deadlineStart = $form ? $this->reviewDeadlineStart($form) : null;
        $dueAt = $deadlineStart?->copy()->addDays(3);
        $overdue = $dueAt && now()->gt($dueAt) && $evaluation->status !== ReviewerEvaluation::STATUS_SUBMITTED;
        $seconds = $dueAt ? abs(now()->diffInSeconds($dueAt, false)) : null;
        $days = $seconds === null ? null : (int) ceil($seconds / 86400);

        return [
            'id' => $evaluation->reviewer_id,
            'name' => $evaluation->reviewer?->user?->name ?? 'Revisor',
            'email' => $evaluation->reviewer?->user?->email,
            'is_primary' => (bool) $evaluation->protocolReviewAssignment?->is_primary,
            'assigned_at' => $assignedAt->toIso8601String(),
            'due_at' => $dueAt?->toIso8601String(),
            'days_remaining' => $days === null ? null : ($overdue ? -$days : $days),
            'overdue' => (bool) $overdue,
            'review_status' => $evaluation->status === ReviewerEvaluation::STATUS_SUBMITTED ? 'reviewed' : 'not_reviewed',
            'submitted_at' => $evaluation->submitted_at?->toIso8601String(),
        ];
    }

    private function meetingData(DeliberationMeeting $meeting, User $user): array
    {
        $teacherId = $user->teacherProfile?->id;
        $items = $meeting->items;
        if ($teacherId && ! $this->canManageOrgan($user, $meeting->organ_id) && ! $this->isGlobalAdmin($user)) {
            $items = $items->filter(fn ($item) => $item->evaluationForm->reviewerEvaluations->contains('reviewer_id', $teacherId));
        }

        return [
            'id' => $meeting->id,
            'organ' => $meeting->organ ? [
                'id' => $meeting->organ->id,
                'name' => $meeting->organ->name,
                'type' => $meeting->organ->type,
            ] : null,
            'scheduled_by' => $meeting->scheduledBy ? [
                'id' => $meeting->scheduledBy->id,
                'name' => $meeting->scheduledBy->name,
            ] : null,
            'scheduled_at' => $meeting->scheduled_at?->toIso8601String(),
            'location' => $meeting->location,
            'notes' => $meeting->notes,
            'status' => $meeting->status,
            'started_at' => $meeting->started_at?->toIso8601String(),
            'completed_at' => $meeting->completed_at?->toIso8601String(),
            'cancelled_at' => $meeting->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $meeting->cancellation_reason,
            'can_manage' => $this->canManageOrgan($user, $meeting->organ_id),
            'can_start' => $meeting->status === DeliberationMeeting::STATUS_SCHEDULED
                && $this->canSecretaryOperate($meeting->organ_id, $user),
            'can_complete' => $meeting->status === DeliberationMeeting::STATUS_IN_PROGRESS
                && $this->canSecretaryOperate($meeting->organ_id, $user),
            'items' => $items->sortBy('queue_entered_at')->values()->map(function ($item) use ($user, $meeting) {
                $form = $item->evaluationForm;

                return [
                    'id' => $item->id,
                    'evaluation_form_id' => $item->evaluation_form_id,
                    'form_organ' => $form->organ,
                    'queue_entered_at' => $item->queue_entered_at?->toIso8601String(),
                    'status' => $item->status,
                    'started_at' => $item->started_at?->toIso8601String(),
                    'completed_at' => $item->completed_at?->toIso8601String(),
                    'protocol' => $this->protocolData($form),
                    'form_status' => $form->status,
                    'reviewers' => $form->reviewerEvaluations->map(fn ($evaluation) => array_merge(
                        $this->reviewerData($evaluation, $form),
                        ['is_me' => (int) $evaluation->reviewer_id === (int) $user->teacherProfile?->id]
                    ))->values(),
                    'can_record_result' => $this->canSecretaryOperate($meeting->organ_id, $user),
                ];
            }),
        ];
    }

    private function protocolData(EvaluationForm $form): array
    {
        $protocol = $form->protocol;
        // The `student` column stores the user ID, so retrieve the loaded
        // Eloquent relation explicitly instead of the colliding attribute.
        $student = $protocol?->relationLoaded('student')
            ? $protocol->getRelation('student')
            : null;

        return [
            'id' => $protocol?->id,
            'code' => $protocol?->code,
            'status' => $protocol?->status,
            'title' => $protocol?->topic?->title,
            'student_name' => $student?->name,
        ];
    }

    private function formRelations(): array
    {
        return [
            'protocol.topic:id,title',
            'protocol.student:id,name,email',
            'reviewerEvaluations.protocolReviewAssignment',
            'reviewerEvaluations.reviewer.user:id,name,email',
            'deliberationMeetingItems.meeting:id,status,completed_at',
        ];
    }

    private function meetingRelations(): array
    {
        return [
            'organ:id,name,type',
            'scheduledBy:id,name,email',
            'items.evaluationForm' => fn ($query) => $query->with($this->formRelations()),
        ];
    }

    private function scopeVisibleMeetings($query, User $user, ?int $requestedOrganId): void
    {
        if ($this->isGlobalAdmin($user)) {
            if ($requestedOrganId) {
                $query->where('organ_id', $requestedOrganId);
            }

            return;
        }

        $organId = $this->profileOrganId($user);
        if ($organId && $this->canManageOrgan($user, $organId)) {
            $query->where('organ_id', $organId);

            return;
        }

        $teacherId = $user->teacherProfile?->id;
        if ($teacherId && $user->hasPermission('protocol.evaluate')) {
            $query->whereHas('items.evaluationForm.reviewerEvaluations', fn ($reviewerQuery) => $reviewerQuery->where('reviewer_id', $teacherId));

            return;
        }

        $query->whereRaw('1 = 0');
    }

    private function resolveManageableOrgan(User $user, ?int $requestedOrganId): Organ
    {
        if ($this->isGlobalAdmin($user)) {
            if (! $requestedOrganId) {
                $this->fail('Indica o órgão para consultar ou marcar a reunião.');
            }
            $organ = Organ::findOrFail($requestedOrganId);
        } else {
            $organId = $this->profileOrganId($user);
            if (! $organId || ! $this->canManageOrgan($user, $organId)) {
                $this->fail('Não tem permissão para gerir reuniões de deliberação.', 403);
            }
            $organ = Organ::findOrFail($organId);
        }

        if (! in_array($organ->type, [Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE], true)) {
            $this->fail('As reuniões de protocolos estão disponíveis apenas para os comités.', 422);
        }

        return $organ;
    }

    private function profileOrganId(User $user): ?int
    {
        $user->loadMissing(['secretaryProfile', 'adminProfile']);

        return $user->secretaryProfile?->organ_id ?? $user->adminProfile?->organ_id;
    }

    private function canManageOrgan(User $user, int $organId): bool
    {
        if ($this->isGlobalAdmin($user)) {
            return true;
        }

        return (int) $this->profileOrganId($user) === $organId
            && ($user->hasPermission('protocol.assign') || $user->hasRole('admin'));
    }

    private function isGlobalAdmin(User $user): bool
    {
        return $user->hasRole('admin') && $user->adminProfile?->access_scope === 'global';
    }

    private function assertCanManage(DeliberationMeeting $meeting, User $user): void
    {
        if (! $this->canManageOrgan($user, $meeting->organ_id)) {
            $this->fail('Não tem permissão para gerir esta reunião.', 403);
        }
    }

    private function assertSecretaryCanStart(DeliberationMeeting $meeting, User $user): void
    {
        $user->loadMissing('secretaryProfile');

        if (! $user->hasPermission('protocol.assign') || (int) $user->secretaryProfile?->organ_id !== (int) $meeting->organ_id) {
            $this->fail('Apenas a secretaria deste órgão pode iniciar a reunião.', 403);
        }
    }

    private function canSecretaryOperate(int $organId, User $user): bool
    {
        $user->loadMissing('secretaryProfile');

        return $user->hasPermission('protocol.assign')
            && (int) $user->secretaryProfile?->organ_id === $organId;
    }

    private function reviewDeadlineStart(EvaluationForm $form): ?Carbon
    {
        $item = $form->deliberationMeetingItems
            ->filter(fn (DeliberationMeetingItem $item) => $item->status === DeliberationMeetingItem::STATUS_DELIBERATED)
            ->filter(fn (DeliberationMeetingItem $item) => $item->meeting?->status === DeliberationMeeting::STATUS_COMPLETED && $item->meeting?->completed_at)
            ->sortByDesc(fn (DeliberationMeetingItem $item) => $item->meeting->completed_at)
            ->first();

        return $item?->meeting?->completed_at ? Carbon::parse($item->meeting->completed_at) : null;
    }

    private function assertCanView(DeliberationMeeting $meeting, User $user): void
    {
        if ($this->canManageOrgan($user, $meeting->organ_id) || $this->isGlobalAdmin($user)) {
            return;
        }
        $teacherId = $user->teacherProfile?->id;
        if ($teacherId && $meeting->items()->whereHas(
            'evaluationForm.reviewerEvaluations',
            fn ($query) => $query->where('reviewer_id', $teacherId)
        )->exists()) {
            return;
        }

        $this->fail('Não tem acesso a esta reunião.', 403);
    }

    private function assertItemBelongsToMeeting(DeliberationMeeting $meeting, DeliberationMeetingItem $item): void
    {
        if ((int) $item->meeting_id !== (int) $meeting->id) {
            abort(404);
        }
        $item->loadMissing('evaluationForm.reviewerEvaluations.protocolReviewAssignment');
    }

    private function assertFuture(Carbon $date): void
    {
        if ($date->lte(now())) {
            $this->fail('A data e hora da reunião devem estar no futuro.');
        }
    }

    private function filterBoundary(string $value, bool $endOfDay): Carbon
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1) {
            $date = Carbon::createFromFormat('Y-m-d', $value, 'Africa/Maputo');

            return ($endOfDay ? $date->endOfDay() : $date->startOfDay())->utc();
        }

        return Carbon::parse($value)->utc();
    }

    private function recordHistory(
        EvaluationForm $form,
        DeliberationMeeting $meeting,
        User $actor,
        string $action,
        string $description,
        array $metadata
    ): void {
        $protocol = $form->protocol()->first();
        if (! $protocol) {
            return;
        }

        app(ProtocolHistoryService::class)->record(
            $protocol,
            $action,
            $actor,
            $meeting->organ_id,
            $protocol->status,
            $protocol->status,
            $description,
            array_merge([
                'meeting_id' => $meeting->id,
                'evaluation_form_id' => $form->id,
                'organ_id' => $meeting->organ_id,
            ], $metadata)
        );
    }

    private function fail(string $message, int $status = 422): never
    {
        throw new HttpResponseException(response()->json(['message' => $message], $status));
    }
}
