<?php

namespace App\Console\Commands;

use App\Models\WorkflowEvent;
use App\Services\DocumentTraceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Defense\app\Models\Defense;
use Modules\Monograph\app\Models\Monograph;
use Modules\Protocol\app\Models\Protocol;
use Modules\Protocol\app\Models\Topic;
use Modules\Protocol\app\Services\ProtocolHistoryService;
use Modules\User\app\Models\Organ;

class AuditWorkflowTraceability extends Command
{
    protected $signature = 'workflow:traceability
        {--apply : Migra protocolos legados do Núcleo para a validação do CC}
        {--limit=200 : Número de registos processados por lote}';

    protected $description = 'Audita e preenche a rastreabilidade de documentos e fluxos sem apagar dados existentes.';

    private int $documents = 0;
    private int $missing = 0;
    private int $events = 0;
    private int $migratedProtocols = 0;

    public function handle(DocumentTraceService $trace): int
    {
        $limit = max(10, (int) $this->option('limit'));

        $this->captureProtocols($trace, $limit);
        $this->captureTopics($trace, $limit);
        $this->captureMonographs($trace, $limit);
        $this->captureDefenses($trace, $limit);

        if ($this->option('apply')) {
            $this->migrateLegacyNucleusProtocols($limit);
        }

        $this->table(['Métrica', 'Total'], [
            ['Revisões documentais registadas', $this->documents],
            ['Ficheiros indisponíveis', $this->missing],
            ['Eventos históricos importados', $this->events],
            ['Protocolos legados encaminhados ao CC', $this->migratedProtocols],
        ]);

        return self::SUCCESS;
    }

    private function captureProtocols(DocumentTraceService $trace, int $limit): void
    {
        Protocol::query()->with(['documents', 'protocolDocumentRequirements', 'opinions', 'histories'])->orderBy('id')
            ->chunkById($limit, function ($protocols) use ($trace): void {
                foreach ($protocols as $protocol) {
                    foreach ($protocol->documents as $document) {
                        $this->countRevision($trace->capture(
                            $protocol, 'documents', $document->id, $document->file_name, $document->file_path,
                            $document->version, $document->document_type, $document->submitter, $protocol->current_organ_id,
                        ));
                    }

                    foreach ($protocol->protocolDocumentRequirements as $requirement) {
                        $this->countRevision($trace->capture(
                            $protocol, 'protocol_document_requirements', $requirement->id,
                            $requirement->file_name ?: $requirement->nome, $requirement->file_path,
                            $requirement->submission_number, $requirement->document_key, null, $protocol->current_organ_id,
                        ));
                    }

                    foreach ($protocol->opinions as $opinion) {
                        if ($opinion->signed_document_path) {
                            $this->countRevision($trace->capture(
                                $protocol, 'opinions', $opinion->id,
                                $opinion->signed_file_name ?: 'parecer-assinado.pdf', $opinion->signed_document_path,
                                $protocol->submission_number, 'signed_opinion_' . $opinion->organ, $opinion->signedBy,
                                $protocol->current_organ_id,
                            ));
                        }
                    }

                    foreach ($protocol->histories as $history) {
                        $this->importEvent('protocol_histories', $history->id, 'protocol', $protocol->id, [
                            'actor_id' => $history->actor_id,
                            'organ_id' => $history->organ_id,
                            'action' => $history->action,
                            'from_state' => $history->old_status,
                            'to_state' => $history->new_status,
                            'description' => $history->description,
                            'metadata' => $history->metadata,
                            'occurred_at' => $history->occurred_at,
                        ]);
                    }
                }
            });
    }

    private function captureTopics(DocumentTraceService $trace, int $limit): void
    {
        Topic::query()->with(['histories'])->orderBy('id')->chunkById($limit, function ($topics) use ($trace): void {
            foreach ($topics as $topic) {
                if ($topic->document_name || $topic->document_path) {
                    $this->countRevision($trace->capture(
                        $topic, 'topics', $topic->id, $topic->document_name ?: "tema-{$topic->id}.docx",
                        $topic->document_path, 1, 'topic_document', $topic->student,
                    ));
                }

                foreach ($topic->histories as $history) {
                    $this->importEvent('topic_histories', $history->id, 'topic', $topic->id, [
                        'actor_id' => $history->actor_id,
                        'organ_id' => $history->organ_id,
                        'action' => $history->action,
                        'from_state' => $history->old_status,
                        'to_state' => $history->new_status,
                        'description' => $history->description,
                        'metadata' => $history->metadata,
                        'occurred_at' => $history->occurred_at,
                    ]);
                }
            }
        });
    }

    private function captureMonographs(DocumentTraceService $trace, int $limit): void
    {
        Monograph::query()->with(['submissions.document', 'submissions.reviews'])->orderBy('id')
            ->chunkById($limit, function ($monographs) use ($trace): void {
                foreach ($monographs as $monograph) {
                    foreach ($monograph->submissions as $submission) {
                        $document = $submission->document;
                        if ($document) {
                            $this->countRevision($trace->capture(
                                $monograph, 'monograph_documents', $document->id, $document->file_name, $document->file_path,
                                $submission->version, $document->document_type, $document->submittedBy,
                            ));
                        }

                        foreach ($submission->reviews as $review) {
                            $this->importEvent('monograph_reviews', $review->id, 'monograph', $monograph->id, [
                                'actor_id' => $review->decided_by_user_id,
                                'action' => 'legacy_' . $review->stage . '_' . $review->decision,
                                'from_state' => null,
                                'to_state' => null,
                                'description' => $review->reason,
                                'metadata' => ['submission_version' => $submission->version, 'role' => $review->decided_by_role],
                                'occurred_at' => $review->decided_at,
                            ]);
                        }
                    }
                }
            });
    }

    private function captureDefenses(DocumentTraceService $trace, int $limit): void
    {
        Defense::query()->with('finalDocuments')->orderBy('id')->chunkById($limit, function ($defenses) use ($trace): void {
            foreach ($defenses as $defense) {
                foreach ($defense->finalDocuments as $document) {
                    $this->countRevision($trace->capture(
                        $defense, 'defense_final_documents', $document->id, $document->file_name, $document->file_path,
                        $document->version, 'final_document', $document->submittedBy,
                    ));
                }

                if ($defense->minutes_file_path) {
                    $this->countRevision($trace->capture(
                        $defense, 'defense_minutes', $defense->id, 'ata-defesa.pdf', $defense->minutes_file_path,
                        null, 'minutes', null,
                    ));
                }
            }
        });
    }

    private function migrateLegacyNucleusProtocols(int $limit): void
    {
        $cc = Organ::query()->where('type', Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE)->first();

        if (! $cc) {
            $this->warn('Comité Científico não encontrado; nenhum protocolo legado foi alterado.');
            return;
        }

        Protocol::query()
            ->whereIn('status', [Protocol::STATUS_PENDING_NUCLEO, Protocol::STATUS_IN_REVIEW_NUCLEO])
            ->orderBy('id')
            ->chunkById($limit, function ($protocols) use ($cc): void {
                foreach ($protocols as $protocol) {
                    DB::transaction(function () use ($protocol, $cc): void {
                        $locked = Protocol::query()->lockForUpdate()->findOrFail($protocol->id);
                        if (! in_array($locked->status, [Protocol::STATUS_PENDING_NUCLEO, Protocol::STATUS_IN_REVIEW_NUCLEO], true)) {
                            return;
                        }

                        $oldStatus = $locked->status;
                        $locked->update([
                            'status' => Protocol::STATUS_DOCUMENTS_PENDING_CC,
                            'current_organ_id' => $cc->id,
                        ]);

                        app(ProtocolHistoryService::class)->record(
                            $locked,
                            'legacy_nucleus_protocol_migrated',
                            null,
                            $cc->id,
                            $oldStatus,
                            $locked->status,
                            'Fluxo legado do Núcleo encerrado; protocolo encaminhado para validação documental do Comité Científico.',
                            ['legacy_status' => $oldStatus, 'migration' => 'workflow:traceability'],
                        );

                        $this->migratedProtocols++;
                    });
                }
            });
    }

    private function countRevision($revision): void
    {
        $this->documents++;
        if ($revision->availability === 'missing') {
            $this->missing++;
        }
    }

    private function importEvent(string $sourceTable, int $sourceId, string $subjectType, int $subjectId, array $attributes): void
    {
        $event = WorkflowEvent::query()->firstOrCreate([
            'source_table' => $sourceTable,
            'source_id' => $sourceId,
        ], array_merge($attributes, [
            'event_key' => (string) \Illuminate\Support\Str::uuid(),
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
        ]));

        if ($event->wasRecentlyCreated) {
            $this->events++;
        }
    }
}
