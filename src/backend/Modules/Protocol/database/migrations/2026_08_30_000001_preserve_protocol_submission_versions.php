<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->unsignedInteger('submission_number')->nullable()->index()->after('protocol_id');
            $table->timestamp('archived_at')->nullable()->index()->after('reviewed_at');
        });

        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->foreignId('source_document_id')->nullable()->after('protocol_id')
                ->constrained('documents')->nullOnDelete();
        });

        DB::table('protocol_document_requirements')->orderBy('id')->chunkById(100, function ($requirements) {
            foreach ($requirements as $requirement) {
                $submission = DB::table('protocols')->where('id', $requirement->protocol_id)->value('submission_number') ?: 1;
                DB::table('protocol_document_requirements')->where('id', $requirement->id)->update([
                    'submission_number' => $submission,
                ]);
            }
        });

        DB::table('evaluation_forms')->orderBy('id')->chunkById(100, function ($forms) {
            foreach ($forms as $form) {
                $document = DB::table('documents')
                    ->where('protocol_id', $form->protocol_id)
                    ->where('created_at', '<=', $form->created_at)
                    ->orderByDesc('version')
                    ->orderByDesc('id')
                    ->first()
                    ?? DB::table('documents')
                        ->where('protocol_id', $form->protocol_id)
                        ->orderByDesc('version')
                        ->orderByDesc('id')
                        ->first();

                if ($document) {
                    DB::table('evaluation_forms')->where('id', $form->id)->update([
                        'source_document_id' => $document->id,
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->dropConstrainedForeignId('source_document_id');
        });

        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->dropIndex(['submission_number']);
            $table->dropIndex(['archived_at']);
            $table->dropColumn(['submission_number', 'archived_at']);
        });
    }
};
