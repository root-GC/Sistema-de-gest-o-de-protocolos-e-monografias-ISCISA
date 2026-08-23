<?php
// Modules/Defense/app/Listeners/NotifyCoordinatorOnSchedule.php
namespace Modules\Defense\app\Listeners;

use Modules\Defense\app\Events\DefenseScheduled;
use Modules\Shared\Services\NotificationService;
use Illuminate\Support\Facades\Mail;
use Modules\Defense\app\Mail\DefenseScheduledMail;

class NotifyCoordinatorOnSchedule
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(DefenseScheduled $event): void
    {
        // Notify student (internal + email)
        $studentUserId = $event->defense->monograph->student_id;
        $this->notifications->send(
            userId: $studentUserId,
            type: 'defesa_agendada',
            title: 'Defesa confirmada',
            body: "A defesa da sua monografia \"{$event->defense->monograph->title}\" foi confirmada.",
        );

        $studentEmail = $event->defense->monograph->student->email ?? null;
        if ($studentEmail) {
            Mail::to($studentEmail)->queue(new DefenseScheduledMail($event->defense, 'student'));
            info("Queued defense scheduled email to student {$studentEmail}");
        }

        // Notify supervisor (teacher profile -> user_id)
        $supervisorProfile = $event->defense->monograph->supervisor ?? null;
        $supervisorUserId = $supervisorProfile->user_id ?? ($supervisorProfile->user->id ?? null);
        if ($supervisorUserId) {
            $this->notifications->send(
                userId: $supervisorUserId,
                type: 'defesa_agendada',
                title: 'Defesa confirmada (supervisionado)',
                body: "A defesa da monografia \"{$event->defense->monograph->title}\" do seu orientando foi confirmada.",
            );

            $supervisorEmail = $supervisorProfile->user->email ?? null;
            if ($supervisorEmail) {
                Mail::to($supervisorEmail)->queue(new DefenseScheduledMail($event->defense, 'supervisor'));
                info("Queued defense scheduled email to supervisor {$supervisorEmail}");
            }
        }

        // Notify jury members
        foreach ($event->defense->jury as $member) {
            $teacherUserId = $member->teacher->user_id ?? ($member->teacher->user->id ?? null);
            if ($teacherUserId) {
                $this->notifications->send(
                    userId: $teacherUserId,
                    type: 'defesa_agendada',
                    title: 'Defesa confirmada — membro do júri',
                    body: "A defesa da monografia \"{$event->defense->monograph->title}\" foi confirmada para {$event->defense->scheduled_at->format('d/m/Y H:i')}.",
                );
            }
        }
    }
}