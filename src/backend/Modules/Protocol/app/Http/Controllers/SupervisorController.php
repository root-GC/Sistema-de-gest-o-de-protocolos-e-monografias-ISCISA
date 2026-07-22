<?php

namespace Modules\Protocol\app\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\StudentProfile;

class SupervisorController extends Controller
{
    public function supervisees(Request $request)
    {
        $user = $request->user()->load('teacherProfile');

        if (! $user->hasPermission('supervision.view')) {
            return response()->json([
                'message' => 'Utilizador não tem permissão para ver supervisandos.',
            ], 403);
        }

        $teacherProfileId = $user->teacherProfile?->id;

        if (! $teacherProfileId) {
            return response()->json([
                'supervisees' => [],
                'total' => 0,
            ]);
        }

        $studentProfiles = StudentProfile::query()
            ->where('supervisor_id', $teacherProfileId)
            ->with([
                'user:id,name,email',
                'course:id,name,code',
            ])
            ->orderBy('student_number')
            ->get();

        $studentIds = $studentProfiles
            ->pluck('user_id')
            ->filter()
            ->values();

        $topicsByStudent = Topic::query()
            ->where('supervisor_id', $teacherProfileId)
            ->whereIn('student_id', $studentIds)
            ->with([
                'scientificArea:id,name',
                'course:id,name,code',
            ])
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get()
            ->groupBy('student_id')
            ->map(fn($topics) => $topics->first());

        $protocolsByStudent = Protocol::query()
            ->whereIn('student', $studentIds)
            ->where(function ($query) use ($teacherProfileId) {
                $query->where('supervisor_id', $teacherProfileId)
                    ->orWhereHas('topic', fn($topicQuery) => $topicQuery->where('supervisor_id', $teacherProfileId));
            })
            ->with([
                'topic:id,title,justification,status,scientific_area_id,course_id,supervisor_id',
                'topic.scientificArea:id,name',
                'topic.course:id,name,code',
            ])
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get()
            ->groupBy('student')
            ->map(fn($protocols) => $protocols->first());

        $supervisees = $studentProfiles->map(function (StudentProfile $profile) use ($topicsByStudent, $protocolsByStudent) {
            $topic = $topicsByStudent->get($profile->user_id);
            $protocol = $protocolsByStudent->get($profile->user_id);
            $currentTopic = $protocol?->topic ?: $topic;
            $phase = $protocol ? 'protocol' : ($topic ? 'topic' : 'none');

            return [
                'student' => [
                    'id' => $profile->user?->id,
                    'name' => $profile->user?->name,
                    'email' => $profile->user?->email,
                    'student_number' => $profile->student_number,
                    'course' => $profile->course ? [
                        'id' => $profile->course->id,
                        'name' => $profile->course->name,
                        'code' => $profile->course->code,
                    ] : null,
                ],
                'phase' => $phase,
                'phase_label' => match ($phase) {
                    'protocol' => 'Protocolo',
                    'topic' => 'Tema',
                    default => 'Sem submissão',
                },
                'current_submission' => $this->currentSubmission($phase, $topic, $protocol),
                'current_topic' => $currentTopic ? $this->topicPayload($currentTopic) : null,
                'current_protocol' => $protocol ? $this->protocolPayload($protocol) : null,
            ];
        })->values();

        return response()->json([
            'supervisees' => $supervisees,
            'total' => $supervisees->count(),
        ]);
    }

    private function currentSubmission(string $phase, ?Topic $topic, ?Protocol $protocol): ?array
    {
        if ($phase === 'protocol' && $protocol) {
            return [
                'type' => 'protocol',
                'id' => $protocol->id,
                'code' => $protocol->code,
                'status' => $protocol->status,
                'status_label' => $protocol->status_label,
                'submitted_at' => $protocol->submitted_at,
            ];
        }

        if ($phase === 'topic' && $topic) {
            return [
                'type' => 'topic',
                'id' => $topic->id,
                'title' => $topic->title,
                'status' => $topic->status,
                'status_label' => $topic->status_label,
                'submitted_at' => $topic->submitted_at,
            ];
        }

        return null;
    }

    private function topicPayload(Topic $topic): array
    {
        return [
            'id' => $topic->id,
            'title' => $topic->title,
            'justification' => $topic->justification,
            'status' => $topic->status,
            'status_label' => $topic->status_label,
            'document_path' => $topic->document_path,
            'document_name' => $topic->document_name,
            'submitted_at' => $topic->submitted_at,
            'scientific_area' => $topic->relationLoaded('scientificArea') && $topic->scientificArea ? [
                'id' => $topic->scientificArea->id,
                'name' => $topic->scientificArea->name,
            ] : null,
            'course' => $topic->relationLoaded('course') && $topic->course ? [
                'id' => $topic->course->id,
                'name' => $topic->course->name,
                'code' => $topic->course->code,
            ] : null,
        ];
    }

    private function protocolPayload(Protocol $protocol): array
    {
        return [
            'id' => $protocol->id,
            'code' => $protocol->code,
            'status' => $protocol->status,
            'status_label' => $protocol->status_label,
            'protocol_type' => $protocol->protocol_type,
            'submission_number' => $protocol->submission_number,
            'version' => $protocol->version,
            'submitted_at' => $protocol->submitted_at,
            'supervisor_decision_at' => $protocol->supervisor_decision_at,
        ];
    }
}
