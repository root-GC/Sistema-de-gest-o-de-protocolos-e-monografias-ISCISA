<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $scientificCommitteeId = DB::table('organs')
            ->where('type', 'scientific_committee')
            ->value('id');

        if (! $scientificCommitteeId) {
            return;
        }

        DB::table('protocols')
            ->whereIn('status', ['protocol_pending_nucleo', 'protocol_in_review_nucleo'])
            ->orderBy('id')
            ->select(['id', 'status'])
            ->each(function (object $protocol) use ($scientificCommitteeId): void {
                DB::table('protocols')->where('id', $protocol->id)->update([
                    'status' => 'protocol_documents_pending_cc',
                    'current_organ_id' => $scientificCommitteeId,
                    'updated_at' => now(),
                ]);

                DB::table('protocol_histories')->insert([
                    'protocol_id' => $protocol->id,
                    'organ_id' => $scientificCommitteeId,
                    'actor_id' => null,
                    'action' => 'legacy_nucleus_protocol_migrated',
                    'description' => 'Fluxo legado do Núcleo encerrado; protocolo encaminhado para validação documental do Comité Científico.',
                    'old_status' => $protocol->status,
                    'new_status' => 'protocol_documents_pending_cc',
                    'metadata' => json_encode(['legacy_status' => $protocol->status, 'migration' => '2026_08_30_000004']),
                    'occurred_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        // Não restaura fluxos antigos: a migração preserva o estado anterior no histórico.
    }
};
