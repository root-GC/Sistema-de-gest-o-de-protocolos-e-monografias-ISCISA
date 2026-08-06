<?php

namespace Modules\Auth\app\Listeners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Modules\Auth\app\Services\BrevoMailerService;
use Modules\Protocol\app\Events\ProtocolReviewersAssigned;
use Modules\Protocol\app\Events\TopicReviewersAssigned;

class NotifyReviewerAssigned
{
    public function __construct(private BrevoMailerService $mailer) {}

    public function handleTopic(TopicReviewersAssigned $event): void
    {
        $topic = $event->topic->loadMissing('student', 'course', 'scientificArea');

        foreach ($event->reviewerIds as $profileId) {
            $profile = \Modules\User\app\Models\TeacherProfile::with('user')
                ->where('id', $profileId)
                ->first();

            if (! $profile?->user?->email) {
                continue;
            }

            $html = View::make('auth::emails.reviewer-assigned', [
                'name' => $profile->user->name,
                'entityType' => 'tema',
                'entityTitle' => $topic->title,
                'studentName' => $topic->student?->name ?? '',
                'course' => $topic->course?->name ?? '',
                'scientificArea' => $topic->scientificArea?->name ?? '',
                'link' => rtrim(config('app.frontend_url'), '/') . '/reviewer/topics',
            ])->render();

            $this->mailer->send(
                ['email' => $profile->user->email, 'name' => $profile->user->name],
                'Atribuido como avaliador de tema — SGPMC ISCISA',
                $html
            );
        }
    }

    public function handleProtocol(ProtocolReviewersAssigned $event): void
    {
        $protocol = $event->protocol->loadMissing('topic', 'student');

        foreach ($event->reviewerIds as $profileId) {
            $profile = \Modules\User\app\Models\TeacherProfile::with('user')
                ->where('id', $profileId)
                ->first();

            if (! $profile?->user?->email) {
                continue;
            }

            $html = View::make('auth::emails.reviewer-assigned', [
                'name' => $profile->user->name,
                'entityType' => 'protocolo',
                'entityTitle' => $protocol->code . ' — ' . ($protocol->topic?->title ?? ''),
                'studentName' => $protocol->student?->name ?? '',
                'course' => '',
                'scientificArea' => '',
                'link' => rtrim(config('app.frontend_url'), '/') . '/reviewer/protocols',
            ])->render();

            $this->mailer->send(
                ['email' => $profile->user->email, 'name' => $profile->user->name],
                'Atribuido como revisor de protocolo — SGPMC ISCISA',
                $html
            );
        }
    }
}
