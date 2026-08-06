<?php

// Modules/Monograph/app/Listeners/OnProtocolApproved.php
namespace Modules\Monograph\app\Listeners;

use Modules\Protocol\app\Events\ProtocolApproved;
use Modules\Monograph\app\Models\Monograph;
use Modules\Monograph\app\Enums\MonographStatus;
use Modules\Shared\Services\NotificationService;

class OnProtocolApproved
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(ProtocolApproved $event): void
    {
        Monograph::create([
            'protocol_id'   => $event->submissionId,
            'student_id'    => $event->studentId,
            'supervisor_id' => $event->supervisorId,
            'code'          => $this->generateCode(),
            'title'         => $event->title,
            'status'        => MonographStatus::AguardaSubmissao,
        ]);

        $this->notifications->send(
            userId: $event->studentId,
            type: 'protocolo_aprovado',
            title: 'Protocolo aprovado — pode submeter a monografia',
            body: 'Realize o trabalho de campo e submeta a monografia quando estiver pronta.',
        );
    }

    private function generateCode(): string
    {
        $year = now()->year;
        $lastCode = Monograph::withTrashed()->latest('id')->value('code');

        $number = 1;
        if ($lastCode && preg_match('/ISCISA-M(\d{3,})-(\d{4})$/', $lastCode, $matches)) {
            $number = (int) $matches[1] + 1;
        }

        return sprintf('ISCISA-M%03d-%d', $number, $year);
    }
}