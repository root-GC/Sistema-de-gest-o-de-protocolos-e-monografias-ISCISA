<?php

namespace Modules\Auth\app\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Modules\Auth\app\Services\BrevoMailerService;
use Modules\Protocol\app\Events\TopicStatusChanged;
use Modules\Protocol\app\Models\Topic;

class NotifyTopicStatus
{
    public function __construct(private BrevoMailerService $mailer) {}

    public function handle(TopicStatusChanged $event): void
    {
        try {
            match ($event->newStatus) {
                Topic::STATUS_PENDING_SUPERVISOR => $this->notifySupervisor($event),
                Topic::STATUS_PENDING_NUCLEO => $this->notifyStudentApproved($event),
                Topic::STATUS_REJECTED_SUPERVISOR => $this->notifyStudentRejected($event),
                Topic::STATUS_APPROVED_NUCLEO => $this->notifyStudentNucleoDecision($event, 'aprovado'),
                Topic::STATUS_REJECTED_NUCLEO => $this->notifyStudentNucleoDecision($event, 'nao aprovado'),
                default => null,
            };
        } catch (\Throwable $e) {
            Log::error('[NotifyTopicStatus] erro ao enviar notificacao', [
                'topic_id' => $event->topic->id,
                'new_status' => $event->newStatus,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function notifySupervisor(TopicStatusChanged $event): void
    {
        $topic = $event->topic->loadMissing('supervisor.user', 'student', 'course', 'scientificArea');
        $supervisor = $topic->supervisor?->user;

        if (! $supervisor?->email) {
            return;
        }

        $html = View::make('auth::emails.topic-supervisor-notification', [
            'name' => $supervisor->name,
            'studentName' => $topic->student?->name ?? 'Estudante',
            'topicTitle' => $topic->title,
            'course' => $topic->course?->name ?? '',
            'scientificArea' => $topic->scientificArea?->name ?? '',
            'link' => rtrim(config('app.frontend_url'), '/') . '/supervisor/topics/' . $topic->id,
        ])->render();

        $this->mailer->send(
            ['email' => $supervisor->email, 'name' => $supervisor->name],
            'Novo tema submetido para aprovacao — SGPMC ISCISA',
            $html
        );
    }

    private function notifyStudentApproved(TopicStatusChanged $event): void
    {
        $topic = $event->topic->loadMissing('supervisor.user', 'student');
        $student = $topic->student;

        if (! $student?->email) {
            return;
        }

        $html = View::make('auth::emails.topic-student-notification', [
            'name' => $student->name,
            'topicTitle' => $topic->title,
            'decision' => 'aprovado',
            'supervisorName' => $topic->supervisor?->user?->name ?? 'Supervisor',
            'nextStep' => 'O seu tema foi encaminhado para analise do Nucleo Cientifico.',
            'link' => rtrim(config('app.frontend_url'), '/') . '/student/topics/' . $topic->id,
        ])->render();

        $this->mailer->send(
            ['email' => $student->email, 'name' => $student->name],
            'Tema aprovado pelo supervisor — SGPMC ISCISA',
            $html
        );
    }

    private function notifyStudentRejected(TopicStatusChanged $event): void
    {
        $topic = $event->topic->loadMissing('supervisor.user', 'student');
        $student = $topic->student;

        if (! $student?->email) {
            return;
        }

        $html = View::make('auth::emails.topic-student-notification', [
            'name' => $student->name,
            'topicTitle' => $topic->title,
            'decision' => 'nao aprovado',
            'supervisorName' => $topic->supervisor?->user?->name ?? 'Supervisor',
            'nextStep' => $topic->supervisor_comment
                ? 'Justificacao do supervisor: ' . $topic->supervisor_comment
                : 'Pode contactar o supervisor para mais detalhes.',
            'link' => rtrim(config('app.frontend_url'), '/') . '/student/topics/' . $topic->id,
        ])->render();

        $this->mailer->send(
            ['email' => $student->email, 'name' => $student->name],
            'Tema nao aprovado pelo supervisor — SGPMC ISCISA',
            $html
        );
    }

    private function notifyStudentNucleoDecision(TopicStatusChanged $event, string $decision): void
    {
        $topic = $event->topic->loadMissing('student');
        $student = $topic->student;

        if (! $student?->email) {
            return;
        }

        $html = View::make('auth::emails.topic-student-notification', [
            'name' => $student->name,
            'topicTitle' => $topic->title,
            'decision' => $decision,
            'supervisorName' => '',
            'nextStep' => $decision === 'aprovado'
                ? 'O Nucleo Cientifico aprovou o seu tema. Pode agora submeter o protocolo.'
                : 'O Nucleo Cientifico nao aprovou o seu tema. Contacte a secretaria para mais informacoes.',
            'link' => rtrim(config('app.frontend_url'), '/') . '/student/topics/' . $topic->id,
        ])->render();

        $this->mailer->send(
            ['email' => $student->email, 'name' => $student->name],
            'Tema ' . $decision . ' pelo Nucleo Cientifico — SGPMC ISCISA',
            $html
        );
    }
}
