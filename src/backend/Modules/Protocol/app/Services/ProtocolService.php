<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\Protocol\app\Models\Topic;
use Modules\User\app\Models\User;

class ProtocolService
{
    public function submit(User $user, Topic $topic, UploadedFile $document, string $protocolType): Protocol
    {
        $topic->loadMissing('student', 'supervisor.user', 'scientificArea.organ');

        if ((int) $topic->student_id !== (int) $user->id) {
            throw new HttpResponseException(response()->json([
                'message' => 'Apenas o estudante dono do tema pode submeter o protocolo.',
            ], 403));
        }

        if (! in_array($topic->status, [Topic::STATUS_APPROVED_NUCLEO, 'topic_approved'], true)) {
            throw new HttpResponseException(response()->json([
                'message' => 'O protocolo so pode ser submetido apos aprovacao do tema pelo Nucleo Cientifico.',
            ], 422));
        }

        if (! $topic->supervisor_id) {
            throw new HttpResponseException(response()->json([
                'message' => 'O tema nao possui supervisor atribuido.',
            ], 422));
        }

        if (! $topic->scientificArea?->organ_id) {
            throw new HttpResponseException(response()->json([
                'message' => 'A area cientifica do tema nao possui orgao associado.',
            ], 422));
        }

        $existing = Protocol::query()
            ->where('topic_id', $topic->id)
            ->latest('submitted_at')
            ->first();

        if ($existing && ! in_array($existing->status, [Protocol::STATUS_REJECTED_SUPERVISOR], true)) {
            throw new HttpResponseException(response()->json([
                'message' => 'Ja existe um protocolo ativo para este tema.',
                'existing_protocol' => $existing,
            ], 409));
        }

        return DB::transaction(function () use ($user, $topic, $document, $protocolType, $existing) {
            $currentOrganId = $topic->scientificArea?->organ_id;

            if ($existing) {
                $protocol = Protocol::lockForUpdate()->findOrFail($existing->id);
                $nextSubmission = ((int) ($protocol->submission_number ?: 1)) + 1;

                Document::query()
                    ->where('protocol_id', $protocol->id)
                    ->update(['status' => Document::STATUS_INACTIVE]);

                $protocol->update([
                    'approved_by_supervisor' => false,
                    'supervisor_id' => $topic->supervisor_id,
                    'protocol_type' => $protocolType,
                    'submission_number' => $nextSubmission,
                    'status' => Protocol::STATUS_PENDING_SUPERVISOR,
                    'version' => (string) $nextSubmission,
                    'submitted_at' => now(),
                    'supervisor_decision_at' => null,
                    'justification' => null,
                    'current_organ_id' => $currentOrganId,
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);
            } else {
                $temporaryCode = 'TMP-' . strtoupper(uniqid());

                $protocol = Protocol::create([
                    'student' => $user->id,
                    'supervisor_id' => $topic->supervisor_id,
                    'current_organ_id' => $currentOrganId,
                    'code' => $temporaryCode,
                    'topic_id' => $topic->id,
                    'approved_by_supervisor' => false,
                    'protocol_type' => $protocolType,
                    'submission_number' => 1,
                    'status' => Protocol::STATUS_PENDING_SUPERVISOR,
                    'version' => '1',
                    'submitted_at' => now(),
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);

                $code = $this->generateCode($protocol->id);
                $protocol->update(['code' => $code]);
            }

            // Guardar ficheiro e gerar caminho (uma pasta por protocolo, nome por submissao)
            $submissionNumber = (int) $protocol->submission_number;
            $path = $document->storeAs(
                'protocols/' . $protocol->id,
                'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
                'public'
            );

            // Criar documento na tabela documents (versionado por submissao)
            Document::create([
                'submited_by' => $user->id,
                'protocol_id' => $protocol->id,
                'document_type' => $protocolType,
                'file_name' => 'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
                'file_path' => $path,
                'pages' => null,
                'version' => $submissionNumber,
                'status' => Document::STATUS_ACTIVE,
            ]);

            return $protocol->load(['topic:id,title,status', 'supervisor.user:id,name,email', 'documents']);
        });
    }

    public function getForSupervisor(User $supervisor): Collection
    {
        return $this->listForSupervisor($supervisor);
    }

    public function listForStudent(User $user)
    {
        return Protocol::query()
            ->where('student', $user->id)
            ->with([
                'topic:id,title,status',
                'supervisor.user:id,name,email',
                'documents',
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function listForSupervisor(User $supervisor): Collection
    {
        $teacherProfileId = $supervisor->teacherProfile?->id;

        if (! $teacherProfileId) {
            return collect();
        }

        return Protocol::query()
            ->where('supervisor_id', $teacherProfileId)
            ->with([
                'topic:id,title,status',
                'student:id,name,email',
                'supervisor.user:id,name,email',
                'documents',
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function approveBySupervisor(Protocol $protocol, User $supervisor): Protocol
    {
        return $this->decideBySupervisor($protocol, $supervisor, 'approved', null);
    }

    public function rejectBySupervisor(Protocol $protocol, User $supervisor, ?string $justification): Protocol
    {
        return $this->decideBySupervisor($protocol, $supervisor, 'rejected', $justification);
    }

    private function decideBySupervisor(Protocol $protocol, User $supervisor, string $decision, ?string $justification): Protocol
    {
        return DB::transaction(function () use ($protocol, $supervisor, $decision, $justification) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $teacherProfile = $supervisor->teacherProfile;
            $topic = $protocol->topic()->first();
            $assignedSupervisorId = $protocol->supervisor_id ?: $topic?->supervisor_id;

            if (! $teacherProfile || ! $topic || (int) $assignedSupervisorId !== (int) $teacherProfile->id) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Apenas o supervisor atribuido pode avaliar este protocolo.',
                ], 403));
            }

            if ($protocol->status !== Protocol::STATUS_PENDING_SUPERVISOR) {
                throw new HttpResponseException(response()->json([
                    'message' => 'O protocolo nao esta em estado de aprovacao do supervisor.',
                ], 422));
            }

            if ($decision === 'approved') {
                $topic->loadMissing('scientificArea:id,organ_id');
                $submissionNumber = (int) ($protocol->submission_number ?: 1);

                $protocol->update([
                    'status' => Protocol::STATUS_PENDING_NUCLEO,
                    'approved_by_supervisor' => true,
                    'supervisor_id' => $assignedSupervisorId,
                    'supervisor_decision_at' => now(),
                    'justification' => null,
                    'current_organ_id' => $topic->scientificArea?->organ_id ?: $protocol->current_organ_id,
                    'nc_version' => $submissionNumber,
                    'cc_version' => 0,
                    'cb_version' => 0,
                    'version' => 'NC_V' . $submissionNumber,
                ]);
            } else {
                $protocol->update([
                    'status' => Protocol::STATUS_REJECTED_SUPERVISOR,
                    'approved_by_supervisor' => false,
                    'supervisor_id' => $assignedSupervisorId,
                    'supervisor_decision_at' => now(),
                    'justification' => $justification,
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);
            }

            return $protocol->load(['topic:id,title,status', 'supervisor.user:id,name,email', 'documents']);
        });
    }

    public function listForSecretary(User $secretary): Collection
    {
        $secretaryProfile = $secretary->secretaryProfile;

        if (! $secretaryProfile) {
            return collect();
        }

        $organ = $secretaryProfile->organ;

        if (! $organ) {
            return collect();
        }

        $statusMap = [
            Protocol::ORGAN_TYPE_NUCLEUS => [
                Protocol::STATUS_PENDING_NUCLEO,
                Protocol::STATUS_IN_REVIEW_NUCLEO,
            ],
            Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => [
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
            ],
            Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE => [
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ],
        ];

        $statuses = $statusMap[$organ->type] ?? [];

        if ($statuses === []) {
            return collect();
        }

        return Protocol::query()
            ->whereIn('status', $statuses)
            ->where('current_organ_id', $organ->id)
            ->with([
                'topic:id,title,status,scientific_area_id,supervisor_id',
                'topic.scientificArea:id,name,organ_id',
                'topic.supervisor.user:id,name,email',
                'supervisor.user:id,name,email',
                'student:id,name,email',
                'reviewAssignments' => fn($q) => $q
                    ->where('organ_id', $organ->id)
                    ->with([
                        'reviewerOne.user:id,name,email',
                        'reviewerTwo.user:id,name,email',
                    ]),
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function listForReviewer(User $reviewer): Collection
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return Protocol::query()
            ->whereIn('status', [
                Protocol::STATUS_IN_REVIEW_NUCLEO,
                Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ])
            ->whereHas('reviewAssignments', fn($q) => $q
                ->where('status', 'pending')
                ->whereColumn('protocol_review_assignments.organ_id', 'protocols.current_organ_id')
                ->where(fn($q) => $q
                    ->where('reviewer_one', $teacherProfile->id)
                    ->orWhere('reviewer_two', $teacherProfile->id)
                )
            )
            ->with([
                'topic:id,title,status,scientific_area_id',
                'topic.scientificArea:id,name',
                'topic.course:id,name,code,scientific_area_id',
                'latestDocument',
                'reviewAssignments' => fn($q) => $q
                    ->where('status', 'pending')
                    ->where(fn($q) => $q
                        ->where('reviewer_one', $teacherProfile->id)
                        ->orWhere('reviewer_two', $teacherProfile->id)
                    ),
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function getEligibleReviewers(Protocol $protocol): Collection
    {
        $protocol->loadMissing('topic.scientificArea:id,organ_id');

        $topicOrganId = $protocol->topic?->scientificArea?->organ_id;
        $topicScientificAreaId = $protocol->topic?->scientific_area_id;
        $supervisorId = $protocol->supervisor_id ?: $protocol->topic?->supervisor_id;

        if (! $topicOrganId || ! $topicScientificAreaId) {
            return collect();
        }

        $assignedReviewerIds = $protocol->reviewAssignments()
            ->pluck('reviewer_one')
            ->merge($protocol->reviewAssignments()->pluck('reviewer_two'))
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        return DB::table('teacher_profiles')
            ->join('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
            ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
            ->where('scientific_areas.organ_id', $topicOrganId)
            ->where('teacher_profiles.scientific_area_id', $topicScientificAreaId)
            ->whereNull('teacher_profiles.deleted_at')
            ->whereNull('users.deleted_at')
            ->when($supervisorId, fn($q) => $q->where('teacher_profiles.id', '!=', $supervisorId))
            ->when($assignedReviewerIds !== [], fn($q) => $q->whereNotIn('teacher_profiles.id', $assignedReviewerIds))
            ->select(
                'teacher_profiles.id',
                'users.name',
                'users.email',
                'scientific_areas.name as scientific_area_name'
            )
            ->orderBy('users.name')
            ->get();
    }

    public function assignReviewers(Protocol $protocol, array $reviewerIds, User $secretary): Protocol
    {
        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $secretaryProfile = $secretary->secretaryProfile;

            if (! $secretaryProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Utilizador nao e uma secretaria.'], 403)
                );
            }

            $assignableStatuses = [
                Protocol::STATUS_PENDING_NUCLEO,
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
            ];

            if (! in_array($protocol->status, $assignableStatuses, true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O protocolo nao esta em estado de atribuicao de revisores.'], 422)
                );
            }

            $organ = $secretaryProfile->organ;

            if (! $organ || (int) $protocol->current_organ_id !== (int) $organ->id) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Secretaria nao tem permissao para atribuir revisores a este protocolo.'], 403)
                );
            }

            $protocol->loadMissing('topic');

            $supervisorId = $protocol->supervisor_id ?: $protocol->topic?->supervisor_id;

            foreach ($reviewerIds as $reviewerId) {
                if ((int) $reviewerId === (int) $supervisorId) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'O supervisor do tema nao pode ser atribuido como revisor.'], 422)
                    );
                }

                $exists = DB::table('teacher_profiles')
                    ->where('id', $reviewerId)
                    ->whereNull('deleted_at')
                    ->exists();

                if (! $exists) {
                    throw new HttpResponseException(
                        response()->json(['message' => "Revisor {$reviewerId} nao encontrado."], 422)
                    );
                }
            }

            if (count($reviewerIds) !== count(array_unique($reviewerIds))) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Os revisores devem ser diferentes.'], 422)
                );
            }

            $assignedExisting = $protocol->reviewAssignments()
                ->where(fn($query) => $query
                    ->whereIn('reviewer_one', $reviewerIds)
                    ->orWhereIn('reviewer_two', $reviewerIds)
                )
                ->exists();

            if ($assignedExisting) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Um dos revisores ja foi atribuido a este protocolo.'], 409)
                );
            }

            ProtocolReviewAssignment::create([
                'protocol_id' => $protocol->id,
                'organ_id' => $secretaryProfile->organ_id,
                'reviewer_one' => $reviewerIds[0] ?? null,
                'reviewer_two' => $reviewerIds[1] ?? null,
                'review_order' => false,
                'status' => 'pending',
                'assigned_at' => now(),
            ]);

            $inReviewStatusMap = [
                Protocol::ORGAN_TYPE_NUCLEUS => Protocol::STATUS_IN_REVIEW_NUCLEO,
                Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
                Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE => Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
            ];

            $newStatus = $inReviewStatusMap[$organ->type] ?? null;
            $formOrgan = Protocol::formOrganFromOrganType($organ->type);

            if (! $newStatus || ! $formOrgan) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Tipo de orgao nao suporta atribuicao de revisores.'], 422)
                );
            }

            $protocol->update([
                'status' => $newStatus,
            ]);

            app(EvaluationService::class)->createForProtocol(
                $protocol,
                $reviewerIds,
                $secretary,
                $formOrgan
            );
            return $protocol->load([
                'topic:id,title,status,scientific_area_id,supervisor_id',
                'topic.scientificArea:id,name,organ_id',
                'topic.supervisor.user:id,name,email',
                'supervisor.user:id,name,email',
                'student:id,name,email',
                'reviewAssignments' => fn($q) => $q
                    ->where('organ_id', $organ->id)
                    ->with([
                        'reviewerOne.user:id,name,email',
                        'reviewerTwo.user:id,name,email',
                    ]),
            ]);
        });
    }

    private function generateCode(int $id): string
    {
        return 'PTM' . str_pad((string) $id, 4, '0', STR_PAD_LEFT) . 'E';
    }
}
