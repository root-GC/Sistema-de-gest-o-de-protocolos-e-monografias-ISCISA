<?php

namespace Modules\Protocol\app\Services;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Protocol\app\Models\Document;
use Modules\Protocol\app\Models\EvaluationForm;
use Modules\Protocol\app\Models\Opinion;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Events\ProtocolApproved;
use Modules\Protocol\app\Events\ProtocolReviewersAssigned;
use Modules\Protocol\app\Events\ProtocolStatusChanged;
use Modules\Protocol\app\Models\ProtocolDocumentRequirement;
use Modules\Protocol\app\Models\ProtocolReviewAssignment;
use Modules\Protocol\app\Models\ProtocolReviewComment;
use Modules\Protocol\app\Models\ReviewerEvaluation;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Models\TopicReviewAssignment;
use Modules\Protocol\app\Services\EvaluationService;
use Modules\Protocol\app\Services\ProtocolHistoryService;
use Modules\User\app\Models\Organ;
use Modules\User\app\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
class ProtocolService
{
    public function submit(
        User $user,
        Topic $topic,
        UploadedFile $document,
        string $protocolType,
        array $requiredDocuments = [],
        array $requiredCIBSDocuments = [],
        array $otherDocuments = [],
        array $otherDocumentNames = []
    ): Protocol {
        $topic->loadMissing('student', 'supervisor.user', 'scientificArea.organ');

        if ((int) $topic->student_id !== (int) $user->id) {
            throw new HttpResponseException(response()->json([
                'message' => 'Apenas o estudante dono do tema pode submeter o protocolo.',
            ], 403));
        }

        if (! in_array($topic->status, [Topic::STATUS_APPROVED_NUCLEO, 'topic_approved'], true)) {
            throw new HttpResponseException(response()->json([
                'message' => 'O protocolo so pode ser submetido apos aprovacao do tema.',
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

        $resubmittableStatuses = Protocol::resubmittableStatuses();

        if ($existing && ! in_array($existing->status, $resubmittableStatuses, true)) {
            throw new HttpResponseException(response()->json([
                'message' => 'Ja existe um protocolo ativo para este tema.',
                'existing_protocol' => $existing,
            ], 409));
        }

        return DB::transaction(function () use ($user, $topic, $document, $protocolType, $requiredDocuments, $requiredCIBSDocuments, $otherDocuments, $otherDocumentNames, $existing) {
            $currentOrganId = $topic->scientificArea?->organ_id;

            $oldStatus = null;
            $oldSubmissionNumber = null;
            $previousRequiredDocuments = collect();
            $previousCIBSDocuments = collect();
            $previousOtherDocuments = collect();
            $isResubmission = (bool) $existing;

            if ($existing) {
                $protocol = Protocol::lockForUpdate()->findOrFail($existing->id);
                $oldStatus = $protocol->status;
                $oldSubmissionNumber = (int) ($protocol->submission_number ?: 1);
                $previousRequiredDocuments = $protocol->protocolDocumentRequirements()
                    ->whereNull('archived_at')
                    ->where('required_for_organ', Protocol::ORGAN_COMITE_CIENTIFICO)
                    ->where('is_optional', false)
                    ->get()
                    ->keyBy('document_key');
                $previousCIBSDocuments = $protocol->protocolDocumentRequirements()
                    ->whereNull('archived_at')
                    ->where('required_for_organ', Protocol::ORGAN_COMITE_BIOETICA)
                    ->get()
                    ->keyBy('document_key');
                $previousOtherDocuments = $protocol->protocolDocumentRequirements()
                    ->whereNull('archived_at')
                    ->where('required_for_organ', Protocol::ORGAN_COMITE_CIENTIFICO)
                    ->where('is_optional', true)
                    ->get()
                    ->keyBy(fn(ProtocolDocumentRequirement $requirement) => mb_strtolower(trim($requirement->nome)));
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
                    'version' => Protocol::submissionVersionLabel($nextSubmission),
                    'submitted_at' => now(),
                    'supervisor_decision_at' => null,
                    'justification' => null,
                    'current_organ_id' => $currentOrganId,
                ]);

                $protocol->protocolDocumentRequirements()
                    ->whereNull('archived_at')
                    ->update(['archived_at' => now()]);
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
                    'version' => Protocol::submissionVersionLabel(1),
                    'submitted_at' => now(),
                    'nc_version' => 0,
                    'cc_version' => 0,
                    'cb_version' => 0,
                ]);

                $code = $this->generateCode($protocol->id);
                $protocol->update(['code' => $code]);
            }

            Log::info('Upload recebido', [
                'original_name' => $document->getClientOriginalName(),
                'mime' => $document->getMimeType(),
                'size' => $document->getSize(),
                'valid' => $document->isValid(),
                'error' => $document->getError(),
            ]);

            Log::info('Storage check', [
                'disk_root' => storage_path('app/public'),
                'exists' => Storage::disk('public')->exists('protocols'),
            ]);


            // Guardar ficheiro e gerar caminho (uma pasta por protocolo, nome por submissao)
            $submissionNumber = (int) $protocol->submission_number;
            try {
                $path = $document->storeAs(
                    'protocols/' . $protocol->id,
                    'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
                    'public'
                );

                Log::info('Store result', [
                    'path' => $path,
                ]);
            } catch (\Throwable $e) {
                Log::error('Erro no storeAs', [
                    'message' => $e->getMessage(),
                ]);

                throw $e;
            }

            // Criar documento na tabela documents (versionado por submissao)
            Document::create([
                'submited_by' => $user->id,
                'protocol_id' => $protocol->id,
                'document_type' => $protocolType,
                'file_name' => 'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
                'file_path' => $path,
                'pages' => null,
                'version' => $submissionNumber,
                'version_label' => Protocol::submissionVersionLabel($submissionNumber),
                'status' => Document::STATUS_ACTIVE,
            ]);

            $storedRequiredDocuments = $this->storeCCRequiredDocuments(
                $protocol,
                $requiredDocuments,
                $previousRequiredDocuments
            );

            $storedCIBSDocuments = $this->storeCIBSDocuments(
                $protocol,
                $requiredCIBSDocuments,
                $previousCIBSDocuments
            );

            $storedOtherDocuments = $this->storeOtherDocuments(
                $protocol,
                $otherDocuments,
                $otherDocumentNames,
                $previousOtherDocuments
            );

    //  $createdDocument = Document::create([
    //     'submited_by' => $user->id,
    //     'protocol_id' => $protocol->id,
    //     'document_type' => $protocolType,
    //     'file_name' => 'protocol-' . $protocol->id . '-S' . $submissionNumber . '.docx',
    //     'file_path' => $path,
    //     'pages' => null,
    //     'version' => $submissionNumber,
    //     'status' => Document::STATUS_ACTIVE,
    // ]);

    // Log::info('Documento criado no submit', [
    //     'id' => $createdDocument->id,
    //     'file_name' => $createdDocument->file_name,
    //     'file_path' => $createdDocument->file_path,
    //     'real_path' => $path,
    // ]);
            app(ProtocolHistoryService::class)->record(
                $protocol,
                $isResubmission ? 'resubmitted' : 'submitted',
                $user,
                $protocol->current_organ_id,
                $oldStatus,
                $protocol->status,
                $isResubmission
                    ? 'Protocolo ressubmetido pelo estudante.'
                    : 'Protocolo submetido pelo estudante.',
                [
                    'submission_number' => (int) $protocol->submission_number,
                    'previous_submission_number' => $oldSubmissionNumber,
                    'protocol_type' => $protocolType,
                    'required_documents' => $storedRequiredDocuments,
                    'cibs_documents' => $storedCIBSDocuments,
                    'other_documents' => $storedOtherDocuments,
                ]
            );

            event(new ProtocolStatusChanged($protocol, $oldStatus, $protocol->status, $user));

            return $protocol->load([
                'topic:id,title,status',
                'supervisor.user:id,name,email',
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements',
            ]);
        });
    }

    public function getForSupervisor(User $supervisor): Collection
    {
        return $this->listForSupervisor($supervisor);
    }

    private function storeCCRequiredDocuments(Protocol $protocol, array $files, ?Collection $previousRequiredDocuments = null): array
    {
        $submissionNumber = (int) ($protocol->submission_number ?: 1);
        $previousRequiredDocuments = $previousRequiredDocuments ?? collect();
        $preparedDocuments = [];

        foreach (ProtocolDocumentRequirement::CC_REQUIRED_DOCUMENTS as $key => $name) {
            $file = $files[$key] ?? null;
            $safeKey = preg_replace('/[^a-z0-9_\\-]/i', '_', $key);
            $source = 'uploaded';
            $fileName = null;

            if ($file instanceof UploadedFile) {
                $extension = $file->getClientOriginalExtension() ?: 'pdf';
                $path = $file->storeAs(
                    "protocols/{$protocol->id}/required-documents/S{$submissionNumber}",
                    "{$safeKey}.{$extension}",
                    'public'
                );
                $fileName = $file->getClientOriginalName();
            } else {
                $previousRequirement = $previousRequiredDocuments->get($key);

                if (! $previousRequirement || ! $previousRequirement->file_path) {
                    throw new HttpResponseException(response()->json([
                        'message' => "O anexo obrigatorio '{$name}' nao foi enviado nem encontrado na versao anterior.",
                    ], 422));
                }

                $extension = pathinfo($previousRequirement->file_path, PATHINFO_EXTENSION) ?: 'pdf';
                $path = "protocols/{$protocol->id}/required-documents/S{$submissionNumber}/{$safeKey}.{$extension}";
                Storage::disk('public')->copy($previousRequirement->file_path, $path);
                $fileName = $previousRequirement->file_name ?: basename($previousRequirement->file_path);
                $source = 'reused';
            }

            $preparedDocuments[] = [
                'document_key' => $key,
                'nome' => $name,
                'file_path' => $path,
                'file_name' => $fileName,
                'source' => $source,
            ];
        }

        $storedDocuments = [];

        foreach ($preparedDocuments as $preparedDocument) {
            $requirement = ProtocolDocumentRequirement::create([
                'protocol_id' => $protocol->id,
                'submission_number' => $submissionNumber,
                'document_key' => $preparedDocument['document_key'],
                'nome' => $preparedDocument['nome'],
                'required_for_organ' => Protocol::ORGAN_COMITE_CIENTIFICO,
                'file_path' => $preparedDocument['file_path'],
                'file_name' => $preparedDocument['file_name'],
                'enviado' => true,
                'aprovado' => null,
                'rejection_reason' => null,
            ]);

            $storedDocuments[] = [
                'requirement_id' => $requirement->id,
                'document_key' => $preparedDocument['document_key'],
                'document_name' => $preparedDocument['nome'],
                'file_name' => $preparedDocument['file_name'],
                'source' => $preparedDocument['source'],
            ];
        }

        return $storedDocuments;
    }

    private function storeCIBSDocuments(Protocol $protocol, array $files, ?Collection $previousCIBSDocuments = null): array
    {
        $submissionNumber = (int) ($protocol->submission_number ?: 1);
        $previousCIBSDocuments = $previousCIBSDocuments ?? collect();
        $preparedDocuments = [];

        foreach (ProtocolDocumentRequirement::CIBS_REQUIRED_DOCUMENTS as $key => $name) {
            $file = $files[$key] ?? null;
            $safeKey = preg_replace('/[^a-z0-9_\\-]/i', '_', $key);
            $fileName = null;

            if ($file instanceof UploadedFile) {
                $extension = $file->getClientOriginalExtension() ?: 'pdf';
                $path = $file->storeAs(
                    "protocols/{$protocol->id}/required-documents/S{$submissionNumber}",
                    "{$safeKey}.{$extension}",
                    'public'
                );
                $fileName = $file->getClientOriginalName();
            } else {
                $previousRequirement = $previousCIBSDocuments->get($key);

                if (! $previousRequirement || ! $previousRequirement->file_path) {
                    throw new HttpResponseException(response()->json([
                        'message' => "O anexo '{$name}' nao foi enviado nem encontrado na versao anterior.",
                    ], 422));
                }

                $extension = pathinfo($previousRequirement->file_path, PATHINFO_EXTENSION) ?: 'pdf';
                $path = "protocols/{$protocol->id}/required-documents/S{$submissionNumber}/{$safeKey}.{$extension}";
                Storage::disk('public')->copy($previousRequirement->file_path, $path);
                $fileName = $previousRequirement->file_name ?: basename($previousRequirement->file_path);
            }

            $preparedDocuments[] = [
                'document_key' => $key,
                'nome' => $name,
                'file_path' => $path,
                'file_name' => $fileName,
            ];
        }

        $storedDocuments = [];

        foreach ($preparedDocuments as $preparedDocument) {
            $requirement = ProtocolDocumentRequirement::create([
                'protocol_id' => $protocol->id,
                'submission_number' => $submissionNumber,
                'document_key' => $preparedDocument['document_key'],
                'nome' => $preparedDocument['nome'],
                'required_for_organ' => Protocol::ORGAN_COMITE_BIOETICA,
                'file_path' => $preparedDocument['file_path'],
                'file_name' => $preparedDocument['file_name'],
                'enviado' => true,
                'aprovado' => null,
                'rejection_reason' => null,
                'is_optional' => false,
            ]);

            $storedDocuments[] = [
                'requirement_id' => $requirement->id,
                'document_key' => $preparedDocument['document_key'],
                'document_name' => $preparedDocument['nome'],
                'file_name' => $preparedDocument['file_name'],
                'source' => isset($preparedDocument['source']) ? $preparedDocument['source'] : 'uploaded',
            ];
        }

        return $storedDocuments;
    }

    private function storeOtherDocuments(
        Protocol $protocol,
        array $otherDocuments,
        array $otherDocumentNames,
        ?Collection $previousOtherDocuments = null
    ): array {
        $submissionNumber = (int) ($protocol->submission_number ?: 1);
        $previousOtherDocuments = $previousOtherDocuments ?? collect();
        $storedDocuments = [];

        $index = 0;

        foreach ($otherDocuments as $key => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $index++;
            $nome = isset($otherDocumentNames[$key]) && trim((string) $otherDocumentNames[$key]) !== ''
                ? trim((string) $otherDocumentNames[$key])
                : 'Outro documento';
            $safeKey = preg_replace('/[^a-z0-9_\\-]/i', '_', Str::slug($nome));
            $documentKey = 'optional_' . ($safeKey ?: 'doc') . '_' . $index;
            $extension = $file->getClientOriginalExtension() ?: 'pdf';
            $path = $file->storeAs(
                "protocols/{$protocol->id}/required-documents/S{$submissionNumber}",
                "{$documentKey}.{$extension}",
                'public'
            );

            $requirement = ProtocolDocumentRequirement::create([
                'protocol_id' => $protocol->id,
                'submission_number' => $submissionNumber,
                'document_key' => $documentKey,
                'nome' => $nome,
                'required_for_organ' => Protocol::ORGAN_COMITE_CIENTIFICO,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'enviado' => true,
                'aprovado' => null,
                'rejection_reason' => null,
                'is_optional' => true,
            ]);

            $storedDocuments[] = [
                'requirement_id' => $requirement->id,
                'document_key' => $documentKey,
                'document_name' => $nome,
                'file_name' => $requirement->file_name,
                'source' => 'uploaded',
            ];

            $previousOtherDocuments->forget(mb_strtolower(trim($nome)));
        }

        foreach ($previousOtherDocuments as $previous) {
            if (! $previous->file_path) {
                continue;
            }

            $extension = pathinfo($previous->file_path, PATHINFO_EXTENSION) ?: 'pdf';
            $path = "protocols/{$protocol->id}/required-documents/S{$submissionNumber}/{$previous->document_key}.{$extension}";
            Storage::disk('public')->copy($previous->file_path, $path);

            $requirement = ProtocolDocumentRequirement::create([
                'protocol_id' => $protocol->id,
                'submission_number' => $submissionNumber,
                'document_key' => $previous->document_key,
                'nome' => $previous->nome,
                'required_for_organ' => Protocol::ORGAN_COMITE_CIENTIFICO,
                'file_path' => $path,
                'file_name' => $previous->file_name,
                'enviado' => true,
                'aprovado' => null,
                'rejection_reason' => null,
                'is_optional' => true,
            ]);

            $storedDocuments[] = [
                'requirement_id' => $requirement->id,
                'document_key' => $previous->document_key,
                'document_name' => $previous->nome,
                'file_name' => $requirement->file_name,
                'source' => 'reused',
            ];
        }

        return $storedDocuments;
    }

    public function uploadRequiredDocument(ProtocolDocumentRequirement $requirement, UploadedFile $file, User $user): ProtocolDocumentRequirement
    {
        return DB::transaction(function () use ($requirement, $file, $user) {
            $requirement = ProtocolDocumentRequirement::query()->lockForUpdate()->findOrFail($requirement->id);
            $protocol = Protocol::query()->lockForUpdate()->findOrFail($requirement->protocol_id);

            if ((int) $protocol->student !== (int) $user->id) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Apenas o estudante dono do protocolo pode reenviar este anexo.',
                ], 403));
            }

            if ($requirement->aprovado === true) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Este anexo ja foi aprovado e nao pode ser substituido.',
                ], 422));
            }

            if (! in_array($protocol->status, [
                Protocol::STATUS_PENDING_SUPERVISOR,
                Protocol::STATUS_DOCUMENTS_PENDING_CC,
                Protocol::STATUS_REJECTED_SUPERVISOR,
                Protocol::STATUS_REJECTED_CC,
            ], true)) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Este protocolo nao permite reenviar anexos neste estado.',
                ], 422));
            }

            $oldFileName = $requirement->file_name;

            $extension = $file->getClientOriginalExtension() ?: 'pdf';
            $safeKey = preg_replace('/[^a-z0-9_\\-]/i', '_', $requirement->document_key);
            $path = $file->storeAs(
                "protocols/{$protocol->id}/required-documents/S{$protocol->submission_number}",
                "{$safeKey}.{$extension}",
                'public'
            );

            $requirement->update([
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'enviado' => true,
                'aprovado' => null,
                'rejection_reason' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);

            app(ProtocolHistoryService::class)->record(
                $protocol,
                'required_document_uploaded',
                $user,
                $protocol->current_organ_id,
                $protocol->status,
                $protocol->status,
                "Anexo reenviado: {$requirement->nome}.",
                [
                    'requirement_id' => $requirement->id,
                    'document_key' => $requirement->document_key,
                    'document_name' => $requirement->nome,
                    'old_file_name' => $oldFileName,
                    'new_file_name' => $file->getClientOriginalName(),
                ]
            );

            return $requirement->fresh();
        });
    }

    public function reviewRequiredDocument(ProtocolDocumentRequirement $requirement, bool $approved, ?string $reason, User $secretary): Protocol
    {
        return DB::transaction(function () use ($requirement, $approved, $reason, $secretary) {
            $requirement = ProtocolDocumentRequirement::query()->lockForUpdate()->findOrFail($requirement->id);
            $protocol = Protocol::query()->lockForUpdate()->findOrFail($requirement->protocol_id);
            $secretaryProfile = $secretary->secretaryProfile;

            if (! $secretaryProfile) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Apenas secretarias podem validar anexos.',
                ], 403));
            }

            $isCIBS = $requirement->required_for_organ === Protocol::ORGAN_COMITE_BIOETICA;
            $expectedOrganType = $isCIBS
                ? Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE
                : Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE;

            if ($secretaryProfile->organ?->type !== $expectedOrganType) {
                throw new HttpResponseException(response()->json([
                    'message' => "Apenas a secretaria do {$this->organTypeLabel($expectedOrganType)} pode validar este anexo.",
                ], 403));
            }

            if ((int) $protocol->current_organ_id !== (int) $secretaryProfile->organ_id) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Secretaria nao tem permissao para validar anexos deste protocolo.',
                ], 403));
            }

            $expectedStatus = $isCIBS
                ? Protocol::STATUS_DOCUMENTS_PENDING_CIBS
                : Protocol::STATUS_DOCUMENTS_PENDING_CC;
            $expectedOrganLabel = $isCIBS ? 'Comite de Bioetica' : 'Comite Cientifico';

            if ($protocol->status !== $expectedStatus) {
                throw new HttpResponseException(response()->json([
                    'message' => "O protocolo nao esta em validacao documental do {$expectedOrganLabel}.",
                ], 422));
            }

            if (! $requirement->enviado || ! $requirement->file_path) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Este anexo ainda nao foi enviado.',
                ], 422));
            }

            if (! $approved && ! trim((string) $reason)) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Informe o motivo da reprovacao do anexo.',
                ], 422));
            }

            if (! $approved && $requirement->document_key === ProtocolDocumentRequirement::CIBS_AUTO_DOCUMENT_KEY) {
                throw new HttpResponseException(response()->json([
                    'message' => 'O parecer assinado do Comite Cientifico apenas pode ser confirmado.',
                ], 422));
            }

            $oldStatus = $protocol->status;

            $requirement->update([
                'aprovado' => $approved,
                'rejection_reason' => $approved ? null : $reason,
                'reviewed_by' => $secretary->id,
                'reviewed_at' => now(),
            ]);

            app(ProtocolHistoryService::class)->record(
                $protocol,
                $approved ? 'required_document_approved' : 'required_document_rejected',
                $secretary,
                $secretaryProfile->organ_id,
                $oldStatus,
                $protocol->status,
                ($approved ? 'Anexo aprovado: ' : 'Anexo nao aprovado: ') . $requirement->nome . '.',
                [
                    'requirement_id' => $requirement->id,
                    'document_key' => $requirement->document_key,
                    'document_name' => $requirement->nome,
                    'file_name' => $requirement->file_name,
                    'rejection_reason' => $approved ? null : $reason,
                ]
            );

            if ($this->areRequiredDocumentsApproved($protocol, $requirement->required_for_organ)) {
                $nextStatus = $isCIBS
                    ? Protocol::STATUS_PENDING_COMITE_BIOETICA
                    : Protocol::STATUS_PENDING_COMITE_CIENTIFICO;

                $protocol->update([
                    'status' => $nextStatus,
                    'justification' => null,
                ]);

                app(ProtocolHistoryService::class)->record(
                    $protocol,
                    'required_documents_approved',
                    $secretary,
                    $secretaryProfile->organ_id,
                    $oldStatus,
                    $protocol->status,
                    "Todos os anexos obrigatorios do {$expectedOrganLabel} foram aprovados.",
                );

                event(new ProtocolStatusChanged($protocol, $oldStatus, $protocol->status, $secretary));
            }

            return $protocol->fresh()->load([
                'topic:id,title,status,scientific_area_id,supervisor_id',
                'topic.scientificArea:id,name,organ_id',
                'topic.supervisor.user:id,name,email',
                'supervisor.user:id,name,email',
                'student:id,name,email',
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements.reviewer:id,name,email',
            ]);
        });
    }

    public function areRequiredDocumentsApproved(Protocol $protocol, string $organ): bool
    {
        $baseCount = $organ === Protocol::ORGAN_COMITE_BIOETICA
            ? count(ProtocolDocumentRequirement::CIBS_REQUIRED_DOCUMENTS)
            : count(ProtocolDocumentRequirement::CC_REQUIRED_DOCUMENTS);

        $requirements = $protocol->protocolDocumentRequirements()
            ->whereNull('archived_at')
            ->where('submission_number', (int) ($protocol->submission_number ?: 1))
            ->where('required_for_organ', $organ)
            ->where('is_optional', false)
            ->get();

        $hasAutoParecer = $requirements->contains(
            fn(ProtocolDocumentRequirement $requirement) => $requirement->document_key === ProtocolDocumentRequirement::CIBS_AUTO_DOCUMENT_KEY
        );

        $expectedCount = $baseCount + ($hasAutoParecer ? 1 : 0);

        if ($requirements->count() < $expectedCount) {
            return false;
        }

        return $requirements->every(fn(ProtocolDocumentRequirement $requirement) => $requirement->aprovado === true);
    }

    public function areCIBSDocumentsApproved(Protocol $protocol): bool
    {
        return $this->areRequiredDocumentsApproved($protocol, Protocol::ORGAN_COMITE_BIOETICA);
    }

    public function listForStudent(User $user)
    {
        return Protocol::query()
            ->where('student', $user->id)
            ->with([
                'topic:id,title,status',
                'supervisor.user:id,name,email',
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements.reviewer:id,name,email',
                'histories' => fn($q) => $q
                    ->with(['actor:id,name,email', 'organ:id,name,type'])
                    ->orderBy('occurred_at')
                    ->orderBy('id'),
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
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements.reviewer:id,name,email',
                'histories' => fn($q) => $q
                    ->with(['actor:id,name,email', 'organ:id,name,type'])
                    ->orderBy('occurred_at')
                    ->orderBy('id'),
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

            $oldStatus = $protocol->status;

            if ($decision === 'approved') {
                $ccOrgan = Organ::query()
                    ->where('type', Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE)
                    ->first();

                if (! $ccOrgan) {
                    throw new HttpResponseException(response()->json([
                        'message' => 'Orgao do Comite Cientifico nao encontrado.',
                    ], 500));
                }

                $ccVersion = max(0, (int) $protocol->cc_version) + 1;
                $versionLabel = Protocol::organVersionLabel(Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE, $ccVersion);

                $protocol->update([
                    'status' => Protocol::STATUS_DOCUMENTS_PENDING_CC,
                    'approved_by_supervisor' => true,
                    'supervisor_id' => $assignedSupervisorId,
                    'supervisor_decision_at' => now(),
                    'justification' => null,
                    'current_organ_id' => $ccOrgan->id,
                    'cc_version' => $ccVersion,
                    'version' => $versionLabel,
                ]);
            } else {
                $protocol->update([
                    'status' => Protocol::STATUS_REJECTED_SUPERVISOR,
                    'approved_by_supervisor' => false,
                    'supervisor_id' => $assignedSupervisorId,
                    'supervisor_decision_at' => now(),
                    'justification' => $justification,
                ]);

                if (trim((string) $justification) !== '') {
                    $content = trim($justification);
                    $latestComment = ProtocolReviewComment::query()
                        ->where('protocol_id', $protocol->id)
                        ->where('user_id', $supervisor->id)
                        ->where('stage', 'supervisor')
                        ->latest('created_at')
                        ->first();

                    if (! $latestComment || $latestComment->content !== $content) {
                        ProtocolReviewComment::create([
                            'protocol_id' => $protocol->id,
                            'document_id' => $protocol->latestDocument()->value('id'),
                            'user_id' => $supervisor->id,
                            'stage' => 'supervisor',
                            'content' => $content,
                        ]);
                    }
                }

                $this->markLatestDocumentRejected($protocol, $supervisor->id);
            }

            $newStatus = $decision === 'approved'
                ? Protocol::STATUS_DOCUMENTS_PENDING_CC
                : Protocol::STATUS_REJECTED_SUPERVISOR;

            app(ProtocolHistoryService::class)->record(
                $protocol,
                $decision === 'approved' ? 'supervisor_approved' : 'supervisor_rejected',
                $supervisor,
                $protocol->current_organ_id,
                $oldStatus,
                $newStatus,
                $decision === 'approved'
                    ? 'Protocolo autorizado pelo supervisor e encaminhado ao Comite Cientifico.'
                    : 'Protocolo nao aprovado pelo supervisor.',
                [
                    'justification' => $decision === 'approved' ? null : $justification,
                    'submission_number' => (int) $protocol->submission_number,
                    'organ_version' => $protocol->version,
                    'document_id' => $protocol->latestDocument()->value('id'),
                ]
            );

            event(new ProtocolStatusChanged($protocol, $oldStatus, $newStatus, $supervisor));

            return $protocol->load([
                'topic:id,title,status',
                'supervisor.user:id,name,email',
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements.reviewer:id,name,email',
            ]);
        });
    }

    public function syncLatestDocumentVersionLabel(Protocol $protocol, string $versionLabel): void
    {
        $latestDocument = $protocol->latestDocument()->first();

        if (! $latestDocument) {
            return;
        }

        // O rótulo do documento é a versão da entrega do estudante. A versão
        // do órgão é guardada em protocols.version e não altera o histórico.
    }

    public function markLatestDocumentRejected(Protocol $protocol, ?int $userId): void
    {
        $latestDocument = $protocol->latestDocument()->first();

        if (! $latestDocument || ! $userId) {
            return;
        }

        $latestDocument->update([
            'rejected_by' => $userId,
            'rejected_at' => now(),
        ]);
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
            Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => [
                Protocol::STATUS_DOCUMENTS_PENDING_CC,
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO,
                Protocol::STATUS_PARECER_PENDING_CC_SIGNATURE,
            ],
            Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE => [
                Protocol::STATUS_DOCUMENTS_PENDING_CIBS,
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
                Protocol::STATUS_PARECER_PENDING_CIBS_SIGNATURE,
            ],
        ];

        $statuses = $statusMap[$organ->type] ?? [];
        $formOrgan = Protocol::formOrganFromOrganType($organ->type);

        if ($statuses === []) {
            return collect();
        }

        $protocols = Protocol::query()
            ->where(function ($query) use ($statuses, $organ, $formOrgan) {
                $query->where(function ($activeQuery) use ($statuses, $organ) {
                    $activeQuery
                        ->whereIn('status', $statuses)
                        ->where('current_organ_id', $organ->id);
                });

                $query->orWhereHas('histories', fn($historyQuery) => $historyQuery->where('organ_id', $organ->id));

                if ($formOrgan) {
                    $query->orWhereHas('opinions', fn($opinionQuery) => $opinionQuery->where('organ', $formOrgan));
                }
            })
            ->when(
                $organ->type === 'nucleus' && $secretaryProfile->scientific_area_id,
                fn($q) => $q->whereHas('topic', fn($q) => $q->where('scientific_area_id', $secretaryProfile->scientific_area_id))
            )
            ->with([
                'currentOrgan:id,name,type',
                'topic:id,title,status,scientific_area_id,supervisor_id',
                'topic.scientificArea:id,name,organ_id',
                'topic.course:id,name,code,scientific_area_id',
                'topic.supervisor.user:id,name,email',
                'supervisor.user:id,name,email',
                'student:id,name,email',
                'documents.rejectedBy:id,name,email',
                'protocolDocumentRequirements.reviewer:id,name,email',
                'histories' => fn($q) => $q
                    ->where('organ_id', $organ->id)
                    ->with(['actor:id,name,email', 'organ:id,name,type'])
                    ->orderBy('occurred_at')
                    ->orderBy('id'),
                'opinions' => fn($q) => $q
                    ->when($formOrgan, fn($opinionQuery) => $opinionQuery->where('organ', $formOrgan))
                    ->with(['issuedBy:id,name,email', 'signedBy:id,name,email', 'evaluationForm:id,version'])
                    ->latest('issued_at'),
                'reviewAssignments' => fn($q) => $q
                    ->where('organ_id', $organ->id)
                    ->with([
                        'reviewerOne.user:id,name,email',
                        'reviewerTwo.user:id,name,email',
                    ]),
            ])
            ->latest('submitted_at')
            ->get();

        return $protocols->map(function (Protocol $protocol) use ($organ, $formOrgan, $statuses) {
            $isActionableInOrgan = (int) $protocol->current_organ_id === (int) $organ->id
                && in_array($protocol->status, $statuses, true);

            $protocol->setAttribute('organ_tracking', $this->buildOrganTracking($protocol, $organ, $formOrgan));
            $protocol->setAttribute('read_only_for_organ', ! $isActionableInOrgan);
            $protocol->setAttribute('is_historical_for_organ', ! $isActionableInOrgan);

            return $protocol;
        });
    }

    public function submitSignedParecer(
        Protocol $protocol,
        Opinion $opinion,
        User $user,
        UploadedFile $signedFile
    ): Protocol {
        $secretaryProfile = $user->secretaryProfile;
        $organ = $secretaryProfile?->organ;

        if (! $secretaryProfile || ! $organ) {
            throw new HttpResponseException(response()->json([
                'message' => 'Apenas a secretaria pode assinar o parecer.',
            ], 403));
        }

        if ((int) $protocol->current_organ_id !== (int) $organ->id) {
            throw new HttpResponseException(response()->json([
                'message' => 'O protocolo nao esta atualmente neste orgao.',
            ], 403));
        }

        $isCCSignature = $protocol->status === Protocol::STATUS_PARECER_PENDING_CC_SIGNATURE;
        $isCIBSSignature = $protocol->status === Protocol::STATUS_PARECER_PENDING_CIBS_SIGNATURE;

        if (! $isCCSignature && ! $isCIBSSignature) {
            throw new HttpResponseException(response()->json([
                'message' => 'O protocolo nao esta aguardando assinatura de parecer.',
            ], 422));
        }

        $expectedOrgan = $isCCSignature ? Protocol::ORGAN_COMITE_CIENTIFICO : Protocol::ORGAN_COMITE_BIOETICA;

        if ((int) $opinion->protocol_id !== (int) $protocol->id || $opinion->organ !== $expectedOrgan) {
            throw new HttpResponseException(response()->json([
                'message' => 'O parecer informado nao pertence a este protocolo/orgao.',
            ], 422));
        }

        if ($opinion->isSigned()) {
            throw new HttpResponseException(response()->json([
                'message' => 'Este parecer ja foi assinado.',
            ], 409));
        }

        return DB::transaction(function () use ($protocol, $opinion, $user, $signedFile, $organ, $isCCSignature, $isCIBSSignature) {
            $extension = $signedFile->getClientOriginalExtension() ?: 'pdf';
            $path = $signedFile->storeAs(
                "protocols/{$protocol->id}/opinions/signed",
                "opinion_{$opinion->id}_signed.{$extension}",
                'public'
            );

            $opinion->update([
                'signed_document_path' => $path,
                'signed_file_name' => $signedFile->getClientOriginalName(),
                'signed_by' => $user->id,
                'signed_at' => now(),
            ]);

            $oldStatus = $protocol->status;

            app(ProtocolHistoryService::class)->record(
                $protocol,
                'parecer_signed',
                $user,
                $organ->id,
                $oldStatus,
                $oldStatus,
                'Parecer assinado pela secretaria.',
                ['opinion_id' => $opinion->id]
            );

            if ($isCCSignature) {
                $nextOrgan = Organ::query()
                    ->where('type', Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE)
                    ->first();

                if (! $nextOrgan) {
                    throw new HttpResponseException(
                        response()->json(['message' => 'Comite de Bioetica nao encontrado.'], 500)
                    );
                }

                $cibsVersion = max(0, (int) $protocol->cb_version) + 1;

                $protocol->update([
                    'status' => Protocol::STATUS_DOCUMENTS_PENDING_CIBS,
                    'current_organ_id' => $nextOrgan->id,
                    'cb_version' => $cibsVersion,
                    'version' => Protocol::organVersionLabel(Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE, $cibsVersion),
                ]);

                ProtocolDocumentRequirement::create([
                    'protocol_id' => $protocol->id,
                    'submission_number' => (int) ($protocol->submission_number ?: 1),
                    'document_key' => ProtocolDocumentRequirement::CIBS_AUTO_DOCUMENT_KEY,
                    'nome' => ProtocolDocumentRequirement::CIBS_AUTO_DOCUMENT_NAME,
                    'required_for_organ' => Protocol::ORGAN_COMITE_BIOETICA,
                    'file_path' => $path,
                    'file_name' => $opinion->signed_file_name,
                    'enviado' => true,
                    'aprovado' => null,
                    'rejection_reason' => null,
                    'is_optional' => false,
                ]);

                app(ProtocolHistoryService::class)->record(
                    $protocol,
                    'forwarded',
                    $user,
                    $nextOrgan->id,
                    $oldStatus,
                    $protocol->status,
                    'Protocolo encaminhado ao Comite de Bioetica.',
                    ['to_organ_id' => $nextOrgan->id, 'from_organ_id' => $organ->id]
                );

                app(EvaluationService::class)->createForProtocol(
                    $protocol->fresh(),
                    [],
                    $user,
                    Protocol::ORGAN_COMITE_BIOETICA,
                    EvaluationForm::FORM_TYPE_EVALUATION
                );

                app(ProtocolHistoryService::class)->record(
                    $protocol,
                    'parecer_sent_to_student',
                    $user,
                    $organ->id,
                    $oldStatus,
                    $protocol->status,
                    'Parecer assinado do Comite Cientifico enviado ao estudante.',
                    ['opinion_id' => $opinion->id]
                );

                event(new ProtocolStatusChanged($protocol, $oldStatus, $protocol->status, $user));
            } else {
                $protocol->loadMissing('topic');
                $protocol->update([
                    'status' => Protocol::STATUS_APPROVED_FINAL,
                    'version' => 'APROVADO',
                ]);

                app(ProtocolHistoryService::class)->record(
                    $protocol,
                    'parecer_sent_to_student',
                    $user,
                    $organ->id,
                    $oldStatus,
                    $protocol->status,
                    'Parecer assinado do Comite de Bioetica enviado ao estudante.',
                    ['opinion_id' => $opinion->id]
                );

                event(new ProtocolStatusChanged($protocol, $oldStatus, $protocol->status, $user));

                event(new ProtocolApproved(
                    submissionId: $protocol->id,
                    studentId: $protocol->topic?->student_id,
                    supervisorId: $protocol->topic?->supervisor_id,
                    title: $protocol->topic?->title,
                    courseId: $protocol->topic?->course_id,
                    scientificAreaId: $protocol->topic?->scientific_area_id,
                ));
            }

            return $protocol->fresh();
        });
    }

    public function listForReviewer(User $reviewer): Collection
    {
        $teacherProfile = $reviewer->teacherProfile;

        if (! $teacherProfile) {
            return collect();
        }

        return Protocol::query()
            ->whereHas(
                'reviewAssignments',
                fn($q) => $q
                    ->where(
                        fn($q) => $q
                        ->where('reviewer_one', $teacherProfile->id)
                            ->orWhere('reviewer_two', $teacherProfile->id)
                    )
            )
            ->with([
                'topic:id,title,status,scientific_area_id,course_id',
                'topic.scientificArea:id,name',
                'topic.course:id,name,code,scientific_area_id',
                'latestDocument',
                'protocolDocumentRequirements',
                'histories' => fn($q) => $q
                    ->with(['actor:id,name,email', 'organ:id,name,type'])
                    ->orderByDesc('occurred_at')
                    ->orderByDesc('id'),
                'reviewAssignments' => fn($q) => $q
                    ->where(
                        fn($q) => $q
                        ->where('reviewer_one', $teacherProfile->id)
                        ->orWhere('reviewer_two', $teacherProfile->id)
                    )
                    ->with('organ:id,name,type')
                    ->orderByDesc('assigned_at')
                    ->orderByDesc('id'),
            ])
            ->latest('submitted_at')
            ->get();
    }

    public function getEligibleReviewers(Protocol $protocol): Collection
    {
        return $this->getEligibleReviewersForNucleo($protocol);
    }

    public function getEligibleReviewersForNucleo(Protocol $protocol): Collection
    {
        $protocol->loadMissing('topic.scientificArea');

        $topicScientificAreaId = $protocol->topic?->scientific_area_id;
        $currentOrganId = $protocol->current_organ_id;
        $supervisorId = $protocol->supervisor_id ?: $protocol->topic?->supervisor_id;

        if (! $topicScientificAreaId || ! $currentOrganId) {
            return collect();
        }

        $assignedReviewerIds = $this->getAllAssignedReviewerIds($protocol, $currentOrganId);

        return DB::table('teacher_profiles')
            ->distinct()
            ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
            ->join('organ_members', 'users.id', '=', 'organ_members.user_id')
            ->where('organ_members.organ_id', $currentOrganId)
            ->whereNull('organ_members.deleted_at')
            ->where('teacher_profiles.scientific_area_id', $topicScientificAreaId)
            ->whereNull('teacher_profiles.deleted_at')
            ->whereNull('users.deleted_at')
            ->when($supervisorId, fn($q) => $q->where('teacher_profiles.id', '!=', $supervisorId))
            ->when($assignedReviewerIds !== [], fn($q) => $q->whereNotIn('teacher_profiles.id', $assignedReviewerIds))
            ->select('teacher_profiles.id', 'users.name', 'users.email')
            ->orderBy('users.name')
            ->get()
            ->map(function ($item) use ($protocol) {
                $area = $protocol->topic?->scientificArea;
                $item->scientific_area_name = $area?->name;
                return $item;
            });
    }

    public function getEligibleReviewersForCC(Protocol $protocol): Collection
    {
        return $this->getEligibleReviewersForOrgan($protocol, 'scientific_committee');
    }

    public function getEligibleReviewersForBioetica(Protocol $protocol): Collection
    {
        return $this->getEligibleReviewersForOrgan($protocol, 'bioethics_committee');
    }

    private function getEligibleReviewersForOrgan(Protocol $protocol, string $organType): Collection
    {
        $protocol->loadMissing('topic.scientificArea', 'currentOrgan');

        $organ = $protocol->currentOrgan && $protocol->currentOrgan->type === $organType
            ? $protocol->currentOrgan
            : \Modules\User\app\Models\Organ::query()
                ->where('type', $organType)
                ->first();

        if (! $organ) {
            return collect();
        }

        $topicScientificAreaId = $protocol->topic?->scientific_area_id;
        $supervisorId = $protocol->supervisor_id ?: $protocol->topic?->supervisor_id;
        $assignedReviewerIds = $this->getAllAssignedReviewerIds($protocol, $organ->id);

        return DB::table('teacher_profiles')
            ->distinct()
            ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
            ->join('organ_members', 'users.id', '=', 'organ_members.user_id')
            ->leftJoin('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
            ->where('organ_members.organ_id', $organ->id)
            ->whereNull('organ_members.deleted_at')
            ->whereNull('teacher_profiles.deleted_at')
            ->whereNull('users.deleted_at')
            ->when($supervisorId, fn($q) => $q->where('teacher_profiles.id', '!=', $supervisorId))
            ->when($assignedReviewerIds !== [], fn($q) => $q->whereNotIn('teacher_profiles.id', $assignedReviewerIds))
            ->select(
                'teacher_profiles.id',
                'teacher_profiles.scientific_area_id',
                'users.name',
                'users.email',
                'scientific_areas.name as scientific_area_name',
            )
            ->orderBy('users.name')
            ->get()
            ->map(fn($reviewer) => [
                'id' => $reviewer->id,
                'name' => $reviewer->name,
                'email' => $reviewer->email,
                'scientific_area_id' => $reviewer->scientific_area_id,
                'scientific_area_name' => $reviewer->scientific_area_name,
                'is_same_scientific_area' => $topicScientificAreaId
                    ? (int) $reviewer->scientific_area_id === (int) $topicScientificAreaId
                    : false,
                'active_works' => $this->countActiveWorksForTeacher($reviewer->id),
            ]);
    }

    private function countActiveWorksForTeacher(int $teacherProfileId): int
    {
        $topicCount = TopicReviewAssignment::query()
            ->where('reviewer_id', $teacherProfileId)
            ->whereHas('topic', fn($q) => $q->whereIn('status', [
                Topic::STATUS_ASSIGNED,
                Topic::STATUS_IN_REVIEW,
            ]))
            ->count();

        $protocolCount = ReviewerEvaluation::query()
            ->where('reviewer_id', $teacherProfileId)
            ->whereHas('evaluationForm', fn($q) => $q->whereIn('status', [
                EvaluationForm::STATUS_PENDING_REVIEW,
                EvaluationForm::STATUS_IN_REVIEW,
            ]))
            ->count();

        return $topicCount + $protocolCount;
    }

    public function getAssignedReviewersForOrgan(Protocol $protocol, int $organId): Collection
    {
        $assignments = $protocol->reviewAssignments()
            ->where('organ_id', $organId)
            ->with([
                'organ:id,name,type',
                'reviewerOne.user:id,name,email',
                'reviewerTwo.user:id,name,email',
            ])
            ->orderBy('assigned_at')
            ->get();

        return $assignments
            ->flatMap(function ($assignment) {
                return collect([
                    $assignment->reviewerOne ? [
                        'id' => $assignment->reviewerOne->id,
                        'name' => $assignment->reviewerOne->user?->name,
                        'email' => $assignment->reviewerOne->user?->email,
                        'slot' => 'reviewer_one',
                        'assignment_id' => $assignment->id,
                        'organ_id' => $assignment->organ_id,
                        'organ' => $assignment->organ ? [
                            'id' => $assignment->organ->id,
                            'name' => $assignment->organ->name,
                            'type' => $assignment->organ->type,
                        ] : null,
                        'status' => $assignment->status,
                        'review_order' => $assignment->review_order,
                        'is_primary' => (bool) $assignment->is_primary,
                        'role' => $assignment->is_primary ? 'primary' : 'reviewer',
                        'assigned_at' => $assignment->assigned_at,
                    ] : null,
                    $assignment->reviewerTwo ? [
                        'id' => $assignment->reviewerTwo->id,
                        'name' => $assignment->reviewerTwo->user?->name,
                        'email' => $assignment->reviewerTwo->user?->email,
                        'slot' => 'reviewer_two',
                        'assignment_id' => $assignment->id,
                        'organ_id' => $assignment->organ_id,
                        'organ' => $assignment->organ ? [
                            'id' => $assignment->organ->id,
                            'name' => $assignment->organ->name,
                            'type' => $assignment->organ->type,
                        ] : null,
                        'status' => $assignment->status,
                        'review_order' => $assignment->review_order,
                        'is_primary' => (bool) $assignment->is_primary,
                        'role' => $assignment->is_primary ? 'primary' : 'reviewer',
                        'assigned_at' => $assignment->assigned_at,
                    ] : null,
                ])->filter();
            })
            ->values();
    }

    public function assignReviewersToOrgan(Protocol $protocol, array $reviewerIds, User $secretary, string $expectedOrganType): Protocol
    {
        if ($expectedOrganType === Protocol::ORGAN_TYPE_NUCLEUS) {
            throw new HttpResponseException(
                response()->json(['message' => 'Os Núcleos Científicos não atribuem revisores a protocolos.'], 422)
            );
        }

        return DB::transaction(function () use ($protocol, $reviewerIds, $secretary, $expectedOrganType) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $secretaryProfile = $secretary->secretaryProfile;

            if (! $secretaryProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Utilizador nao e uma secretaria.'], 403)
                );
            }

            $organ = $secretaryProfile->organ;
            if (! $organ || $organ->type !== $expectedOrganType) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Secretaria nao tem permissao para atribuir revisores neste orgao.'], 403)
                );
            }

            $assignableStatuses = [
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
            ];

            if (! in_array($protocol->status, $assignableStatuses, true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O protocolo nao esta em estado de atribuicao de revisores.'], 422)
                );
            }

            if ((int) $protocol->current_organ_id !== (int) $organ->id) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Secretaria nao tem permissao para atribuir revisores a este protocolo.'], 403)
                );
            }

            if (
                $expectedOrganType === Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE
                && ! $this->areRequiredDocumentsApproved($protocol, Protocol::ORGAN_COMITE_CIENTIFICO)
            ) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Nem todos os anexos obrigatorios foram aprovados pela secretaria do Comite Cientifico.'], 422)
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
                ->where('organ_id', $organ->id)
                ->where(
                    fn($query) => $query
                        ->whereIn('reviewer_one', $reviewerIds)
                        ->orWhereIn('reviewer_two', $reviewerIds)
                )
                ->exists();

            if ($assignedExisting) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Um dos revisores ja foi atribuido a este protocolo neste orgao.'], 409)
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

            $oldStatus = $protocol->status;
            $protocol->update(['status' => $newStatus]);

            app(ProtocolHistoryService::class)->record(
                $protocol,
                'reviewers_assigned',
                $secretary,
                $organ->id,
                $oldStatus,
                $newStatus,
                'Revisores atribuidos ao protocolo.',
                [
                    'reviewer_ids' => array_values($reviewerIds),
                ]
            );

            app(EvaluationService::class)->createForProtocol(
                $protocol,
                $reviewerIds,
                $secretary,
                $formOrgan
            );

            event(new ProtocolReviewersAssigned($protocol, $reviewerIds));

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

    public function assignReviewersToBioetica(Protocol $protocol, int $primaryReviewerId, array $reviewerIds, User $secretary): Protocol
    {
        return DB::transaction(function () use ($protocol, $primaryReviewerId, $reviewerIds, $secretary) {
            $protocol = Protocol::lockForUpdate()->findOrFail($protocol->id);
            $secretaryProfile = $secretary->secretaryProfile;

            if (! $secretaryProfile) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Utilizador nao e uma secretaria.'], 403)
                );
            }

            $organ = $secretaryProfile->organ;
            if (! $organ || $organ->type !== Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Secretaria nao tem permissao para atribuir revisores no Comite de Bioetica.'], 403)
                );
            }

            if ($protocol->status !== Protocol::STATUS_PENDING_COMITE_BIOETICA) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O protocolo nao esta em estado de atribuicao de revisores no Comite de Bioetica.'], 422)
                );
            }

            if ((int) $protocol->current_organ_id !== (int) $organ->id) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Secretaria nao tem permissao para atribuir revisores a este protocolo.'], 403)
                );
            }

            $protocol->loadMissing('topic');
            $topicScientificAreaId = $protocol->topic?->scientific_area_id;
            $supervisorId = $protocol->supervisor_id ?: $protocol->topic?->supervisor_id;

            if (! $topicScientificAreaId) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O protocolo nao possui area cientifica para validar o revisor principal.'], 422)
                );
            }

            $reviewerIds = collect($reviewerIds)
                ->prepend($primaryReviewerId)
                ->filter()
                ->map(fn($id) => (int) $id)
                ->unique()
                ->values()
                ->toArray();

            if ($reviewerIds === []) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Informe pelo menos um revisor.'], 422)
                );
            }

            if (! in_array($primaryReviewerId, $reviewerIds, true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O revisor principal deve fazer parte da lista de revisores.'], 422)
                );
            }

            if ($supervisorId && in_array((int) $supervisorId, $reviewerIds, true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O supervisor do tema nao pode ser atribuido como revisor.'], 422)
                );
            }

            $reviewers = DB::table('teacher_profiles')
                ->join('users', 'teacher_profiles.user_id', '=', 'users.id')
                ->join('organ_members', 'users.id', '=', 'organ_members.user_id')
                ->leftJoin('scientific_areas', 'teacher_profiles.scientific_area_id', '=', 'scientific_areas.id')
                ->whereIn('teacher_profiles.id', $reviewerIds)
                ->where('organ_members.organ_id', $organ->id)
                ->whereNull('organ_members.deleted_at')
                ->whereNull('teacher_profiles.deleted_at')
                ->whereNull('users.deleted_at')
                ->select(
                    'teacher_profiles.id',
                    'teacher_profiles.scientific_area_id',
                    'users.name',
                    'users.email',
                    'scientific_areas.name as scientific_area_name',
                )
                ->get()
                ->keyBy('id');

            if ($reviewers->count() !== count($reviewerIds)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Todos os revisores do Comite de Bioetica devem pertencer ao orgao.'], 422)
                );
            }

            $primaryReviewer = $reviewers->get($primaryReviewerId);

            if (! $primaryReviewer) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Revisor principal nao encontrado no orgao do Comite de Bioetica.'], 422)
                );
            }

            if ($topicScientificAreaId && (int) $primaryReviewer->scientific_area_id !== (int) $topicScientificAreaId) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O revisor principal deve pertencer a area cientifica do protocolo.'], 422)
                );
            }

            $assignedExisting = $protocol->reviewAssignments()
                ->where('organ_id', $organ->id)
                ->where(
                    fn($query) => $query
                        ->whereIn('reviewer_one', $reviewerIds)
                        ->orWhereIn('reviewer_two', $reviewerIds)
                )
                ->exists();

            if ($assignedExisting) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Um dos revisores ja foi atribuido a este protocolo neste orgao.'], 409)
                );
            }

            foreach ($reviewerIds as $reviewerId) {
                ProtocolReviewAssignment::create([
                    'protocol_id' => $protocol->id,
                    'organ_id' => $organ->id,
                    'reviewer_one' => $reviewerId,
                    'reviewer_two' => null,
                    'review_order' => false,
                    'is_primary' => (int) $reviewerId === (int) $primaryReviewerId,
                    'status' => 'pending',
                    'assigned_at' => now(),
                ]);
            }

            $oldStatus = $protocol->status;
            $protocol->update(['status' => Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA]);

            app(ProtocolHistoryService::class)->record(
                $protocol,
                'reviewers_assigned',
                $secretary,
                $organ->id,
                $oldStatus,
                Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA,
                'Revisores atribuidos ao protocolo no Comite de Bioetica.',
                [
                    'primary_reviewer_id' => $primaryReviewerId,
                    'reviewer_ids' => array_values($reviewerIds),
                ]
            );

            app(EvaluationService::class)->createForProtocol(
                $protocol,
                $reviewerIds,
                $secretary,
                Protocol::ORGAN_COMITE_BIOETICA
            );

            event(new ProtocolReviewersAssigned($protocol, $reviewerIds));

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

    private function getAllAssignedReviewerIds(Protocol $protocol, ?int $organId = null): array
    {
        $assignments = $protocol->reviewAssignments()
            ->when($organId, fn($q) => $q->where('organ_id', $organId))
            ->get();

        return $assignments
            ->pluck('reviewer_one')
            ->merge($assignments->pluck('reviewer_two'))
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    private function buildOrganTracking(Protocol $protocol, $organ, ?string $formOrgan): array
    {
        $histories = $protocol->relationLoaded('histories')
            ? $protocol->histories
            : collect();
        $opinions = $protocol->relationLoaded('opinions')
            ? $protocol->opinions
            : collect();

        $latestHistory = $histories->last();
        $latestOpinion = $opinions->first();
        $isCurrent = (int) $protocol->current_organ_id === (int) $organ->id;
        $organName = $organ->name ?: $this->organTypeLabel($organ->type);
        $latestActionAt = $latestHistory?->occurred_at ?? $latestOpinion?->issued_at;
        $approvedAt = $histories
            ->first(fn($history) => $history->action === 'approved')
            ?->occurred_at
            ?? ($latestOpinion?->decision === ReviewerEvaluation::DECISION_APPROVED ? $latestOpinion->issued_at : null);
        $rejectedAt = $histories
            ->first(fn($history) => $history->action === 'rejected')
            ?->occurred_at
            ?? ($latestOpinion?->decision === ReviewerEvaluation::DECISION_NOT_APPROVED ? $latestOpinion->issued_at : null);

        return [
            'organ_id' => $organ->id,
            'organ_name' => $organName,
            'organ_type' => $organ->type,
            'form_organ' => $formOrgan,
            'is_current' => $isCurrent,
            'is_historical' => ! $isCurrent,
            'status_label' => $isCurrent
                ? $protocol->status_label
                : $this->historicalStatusLabel($organName, $latestHistory?->action, $latestOpinion?->decision),
            'latest_action' => $latestHistory?->action,
            'latest_action_label' => $this->historyActionLabel($latestHistory?->action),
            'latest_action_at' => $latestActionAt,
            'approved_at' => $approvedAt,
            'rejected_at' => $rejectedAt,
            'history' => $histories->map(fn($history) => [
                'id' => $history->id,
                'action' => $history->action,
                'action_label' => $this->historyActionLabel($history->action),
                'description' => $history->description,
                'old_status' => $history->old_status,
                'old_status_label' => $this->protocolStatusLabel($history->old_status),
                'new_status' => $history->new_status,
                'new_status_label' => $this->protocolStatusLabel($history->new_status),
                'occurred_at' => $history->occurred_at,
                'actor' => $history->actor ? [
                    'id' => $history->actor->id,
                    'name' => $history->actor->name,
                    'email' => $history->actor->email,
                ] : null,
                'metadata' => $history->metadata,
            ])->values(),
            'latest_opinion' => $latestOpinion ? [
                'id' => $latestOpinion->id,
                'decision' => $latestOpinion->decision,
                'issued_at' => $latestOpinion->issued_at,
                'version' => $latestOpinion->effectiveVersion(),
                'download_url' => url("api/v1/opinions/{$latestOpinion->id}/download"),
                'evaluation_form_download_url' => $latestOpinion->evaluation_form_id
                    ? url("api/v1/evaluation-forms/{$latestOpinion->evaluation_form_id}/download")
                    : null,
                'is_signed' => $latestOpinion->isSigned(),
                'signed_at' => $latestOpinion->signed_at,
                'signed_by' => $latestOpinion->signedBy ? $latestOpinion->signedBy->name : null,
                'signed_download_url' => $latestOpinion->isSigned()
                    ? url("api/v1/opinions/{$latestOpinion->id}/signed-download")
                    : null,
            ] : null,
        ];
    }

    private function historicalStatusLabel(string $organName, ?string $latestAction, ?string $latestDecision): string
    {
        if ($latestAction === 'approved' || $latestDecision === ReviewerEvaluation::DECISION_APPROVED) {
            return "Aprovado no {$organName}";
        }

        if ($latestAction === 'rejected' || $latestDecision === ReviewerEvaluation::DECISION_NOT_APPROVED) {
            return "Nao aprovado no {$organName}";
        }

        if ($latestAction) {
            return $this->historyActionLabel($latestAction) ?? "Registado no {$organName}";
        }

        return "Registado no {$organName}";
    }

    private function historyActionLabel(?string $action): ?string
    {
        if (! $action) {
            return null;
        }

        return match ($action) {
            'submitted' => 'Submetido',
            'resubmitted' => 'Ressubmetido',
            'supervisor_approved' => 'Autorizado pelo supervisor',
            'supervisor_rejected' => 'Nao aprovado pelo supervisor',
            'required_document_uploaded' => 'Anexo reenviado',
            'required_document_approved' => 'Anexo aprovado',
            'required_document_rejected' => 'Anexo nao aprovado',
            'required_documents_approved' => 'Anexos aprovados',
            'reviewers_assigned' => 'Revisores atribuídos',
            'reviewer_submitted_evaluation' => 'Revisor submeteu avaliação',
            'reviewer_marked_evaluated' => 'Revisor marcou como avaliado',
            'deliberation_pending' => 'Aguardando deliberação',
            'deliberation_scheduled' => 'Deliberação marcada',
            'deliberation_started' => 'Deliberação iniciada',
            'deliberation_closed' => 'Deliberação encerrada',
            'approved' => 'Aprovado',
            'rejected' => 'Nao aprovado',
            'forwarded' => 'Encaminhado',
            'parecer_signed' => 'Parecer assinado',
            'parecer_sent_to_student' => 'Parecer assinado enviado ao estudante',
            default => $action,
        };
    }

    private function protocolStatusLabel(?string $status): ?string
    {
        if (! $status) {
            return null;
        }

        return match ($status) {
            Protocol::STATUS_PENDING_SUPERVISOR => 'Aguardando aprovacao do supervisor',
            Protocol::STATUS_REJECTED_SUPERVISOR => 'Nao aprovado pelo supervisor',
            Protocol::STATUS_PENDING_NUCLEO => 'Encaminhado ao Nucleo Cientifico',
            Protocol::STATUS_IN_REVIEW_NUCLEO => 'Em avaliacao pelo Nucleo Cientifico',
            Protocol::STATUS_DOCUMENTS_PENDING_CC => 'Aguardando validacao dos anexos pelo Comite Cientifico',
            Protocol::STATUS_DOCUMENTS_PENDING_CIBS => 'Aguardando validacao dos anexos pelo Comite de Bioetica',
            Protocol::STATUS_PENDING_COMITE_CIENTIFICO => 'Encaminhado ao Comite Cientifico',
            Protocol::STATUS_IN_REVIEW_COMITE_CIENTIFICO => 'Em avaliacao pelo Comite Cientifico',
            Protocol::STATUS_PARECER_PENDING_CC_SIGNATURE => 'Parecer do Comite Cientifico a aguardar assinatura',
            Protocol::STATUS_PENDING_COMITE_BIOETICA => 'Encaminhado ao Comite de Bioetica',
            Protocol::STATUS_IN_REVIEW_COMITE_BIOETICA => 'Em avaliacao pelo Comite de Bioetica',
            Protocol::STATUS_PARECER_PENDING_CIBS_SIGNATURE => 'Parecer do Comite de Bioetica a aguardar assinatura',
            Protocol::STATUS_REJECTED_NUCLEO => 'Nao aprovado pelo Nucleo Cientifico',
            Protocol::STATUS_REJECTED_CC => 'Nao aprovado pelo Comite Cientifico',
            Protocol::STATUS_REJECTED_BIOETICA => 'Nao aprovado pelo Comite de Bioetica',
            Protocol::STATUS_APPROVED_FINAL => 'Aprovado',
            Protocol::STATUS_REJECTED_FINAL => 'Nao aprovado',
            default => $status,
        };
    }

    private function organTypeLabel(string $organType): string
    {
        return match ($organType) {
            Protocol::ORGAN_TYPE_NUCLEUS => 'Nucleo Cientifico',
            Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => 'Comite Cientifico',
            Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE => 'Comite de Bioetica',
            default => 'Orgao',
        };
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
                Protocol::STATUS_PENDING_COMITE_CIENTIFICO,
                Protocol::STATUS_PENDING_COMITE_BIOETICA,
            ];

            if (! in_array($protocol->status, $assignableStatuses, true)) {
                throw new HttpResponseException(
                    response()->json(['message' => 'O protocolo nao esta em estado de atribuicao de revisores.'], 422)
                );
            }

            $organ = $secretaryProfile->organ;

            if ($organ?->type === Protocol::ORGAN_TYPE_NUCLEUS) {
                throw new HttpResponseException(
                    response()->json(['message' => 'Os Núcleos Científicos não atribuem revisores a protocolos.'], 422)
                );
            }

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
                ->where(
                    fn($query) => $query
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

            $oldStatus = $protocol->status;
            $protocol->update([
                'status' => $newStatus,
            ]);

            app(ProtocolHistoryService::class)->record(
                $protocol,
                'reviewers_assigned',
                $secretary,
                $organ->id,
                $oldStatus,
                $newStatus,
                'Revisores atribuidos ao protocolo.',
                [
                    'reviewer_ids' => array_values($reviewerIds),
                ]
            );

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
