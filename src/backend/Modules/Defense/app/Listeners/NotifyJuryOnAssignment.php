<?php

namespace Modules\Defense\app\Listeners;

use Modules\Defense\app\Events\DefenseAssignedToJury;
use Illuminate\Support\Facades\Mail;
use Modules\Defense\app\Mail\JuryAssignmentMail;
use Modules\Shared\Services\NotificationService;
use Illuminate\Support\Facades\DB;

class NotifyJuryOnAssignment
{
    public function __construct(private NotificationService $notifications) {}

    public function handle(DefenseAssignedToJury $event): void
    {
        $secretaryUserIds = [];

        foreach ($event->assignments as $assignment) {
            $assignment->loadMissing('jury.teacher.user', 'jury.defense.monograph');

            $email = $assignment->jury->teacher->user->email ?? null;
            if ($email) {
                $monograph = $assignment->jury->defense->monograph;
                $downloadLink = config('app.url') . "/api/monographs/{$monograph->code}/download";

                Mail::to($email)->queue(new JuryAssignmentMail($assignment, $downloadLink));
                info("Queued jury assignment email to {$email} for monograph {$monograph->code}");
            } else {
                info("No email for jury member (assignment id={$assignment->id})");
            }

            // Collect secretary user ids for the monograph's current organ to notify them to schedule
            $monograph = $assignment->jury->defense->monograph;
            $protocolId = $monograph->protocol_id;
            $protocol = \Modules\Protocol\app\Models\Protocol::find($protocolId);
            if ($protocol && $protocol->current_organ_id) {
                $s = DB::table('secretary_profiles')
                    ->where('organ_id', $protocol->current_organ_id)
                    ->pluck('user_id')
                    ->toArray();

                $secretaryUserIds = array_merge($secretaryUserIds, $s);
            }
        }

        // Notify secretary(s) by internal notification and e-mail
        $secretaryUserIds = array_unique($secretaryUserIds);
        if (!empty($secretaryUserIds)) {
            $emails = DB::table('users')->whereIn('id', $secretaryUserIds)->pluck('email', 'id')->toArray();

            foreach ($secretaryUserIds as $sid) {
                try {
                    $this->notifications->send(
                        userId: $sid,
                        type: 'defesa_juri_definido',
                        title: 'Júri atribuído — por favor agende a defesa',
                        body: 'O júri foi definido — aceda ao sistema para agendar a data.'
                    );

                    $email = $emails[$sid] ?? null;
                    if ($email) {
                        // send email to secretary
                        Mail::to($email)->queue(new \Modules\Defense\app\Mail\SecretaryNotifyMail($event->assignments[0]->jury->defense));
                        info("Queued secretary email to {$email}");
                    }

                    info("Notified secretary user_id={$sid} to schedule defense");
                } catch (\Throwable $e) {
                    info("Failed to notify secretary user_id={$sid}: {$e->getMessage()}");
                }
            }
        }
    }
}
