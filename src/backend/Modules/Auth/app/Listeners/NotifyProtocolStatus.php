<?php

namespace Modules\Auth\app\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Modules\Auth\app\Services\BrevoMailerService;
use Modules\Protocol\app\Events\ProtocolStatusChanged;
use Modules\Protocol\app\Models\Protocol;

class NotifyProtocolStatus
{
    public function __construct(private BrevoMailerService $mailer) {}

    public function handle(ProtocolStatusChanged $event): void
    {
        try {
            match ($event->newStatus) {
                Protocol::STATUS_PENDING_SUPERVISOR => $this->notifySupervisor($event),
                Protocol::STATUS_PENDING_NUCLEO => $this->notifyStudent($event, 'aprovado', 'O supervisor aprovou o protocolo. Segue para analise do Nucleo Cientifico.'),
                Protocol::STATUS_REJECTED_SUPERVISOR => $this->notifyStudent($event, 'rejeitado', $event->protocol->justification ?? 'O supervisor rejeitou o protocolo.'),
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO => $this->notifyStudent($event, 'aprovado no Nucleo', 'O Nucleo Cientifico aprovou o protocolo. Segue para o Comite Cientifico.'),
                Protocol::STATUS_PENDING_COMITE_BIOETICA => $this->notifyStudent($event, 'aprovado no Comite Cientifico', 'O Comite Cientifico aprovou o protocolo. Segue para o Comite de Bioetica.'),
                Protocol::STATUS_APPROVED_FINAL => $this->notifyStudent($event, 'aprovado', 'O protocolo foi aprovado por todos os orgaos.'),
                Protocol::STATUS_REJECTED_NUCLEO => $this->notifyStudent($event, 'rejeitado no Nucleo', 'O Nucleo Cientifico rejeitou o protocolo.'),
                Protocol::STATUS_REJECTED_CC => $this->notifyStudent($event, 'rejeitado no Comite Cientifico', 'O Comite Cientifico rejeitou o protocolo.'),
                Protocol::STATUS_REJECTED_BIOETICA => $this->notifyStudent($event, 'rejeitado no Comite de Bioetica', 'O Comite de Bioetica rejeitou o protocolo.'),
                default => null,
            };
        } catch (\Throwable $e) {
            Log::error('[NotifyProtocolStatus] erro ao enviar notificacao', [
                'protocol_id' => $event->protocol->id,
                'new_status' => $event->newStatus,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function notifySupervisor(ProtocolStatusChanged $event): void
    {
        $protocol = $event->protocol->loadMissing('supervisor.user', 'student', 'topic');
        $supervisor = $protocol->supervisor?->user;

        if (! $supervisor?->email) {
            return;
        }

        $html = View::make('auth::emails.protocol-supervisor-notification', [
            'name' => $supervisor->name,
            'studentName' => $protocol->student?->name ?? 'Estudante',
            'protocolCode' => $protocol->code,
            'topicTitle' => $protocol->topic?->title ?? '',
            'link' => rtrim(config('app.frontend_url'), '/') . '/supervisor/protocols/' . $protocol->id,
        ])->render();

        $this->mailer->send(
            ['email' => $supervisor->email, 'name' => $supervisor->name],
            'Novo protocolo submetido para aprovacao — SGPMC ISCISA',
            $html
        );
    }

    private function notifyStudent(ProtocolStatusChanged $event, string $decisionLabel, string $message): void
    {
        $protocol = $event->protocol->loadMissing('student', 'supervisor.user', 'topic');
        $student = $protocol->student;

        if (! $student?->email) {
            return;
        }

        $html = View::make('auth::emails.protocol-student-notification', [
            'name' => $student->name,
            'protocolCode' => $protocol->code,
            'topicTitle' => $protocol->topic?->title ?? '',
            'decision' => $decisionLabel,
            'message' => $message,
            'supervisorName' => $protocol->supervisor?->user?->name ?? '',
            'link' => rtrim(config('app.frontend_url'), '/') . '/student/protocols/' . $protocol->id,
        ])->render();

        $this->mailer->send(
            ['email' => $student->email, 'name' => $student->name],
            'Protocolo ' . $decisionLabel . ' — SGPMC ISCISA',
            $html
        );
    }
}
