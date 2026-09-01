<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->dropUnique('protocol_doc_req_unique');
            $table->unique(
                ['protocol_id', 'submission_number', 'required_for_organ', 'document_key'],
                'protocol_doc_req_submission_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->dropUnique('protocol_doc_req_submission_unique');
            $table->unique(
                ['protocol_id', 'required_for_organ', 'document_key'],
                'protocol_doc_req_unique'
            );
        });
    }
};
