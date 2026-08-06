<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->boolean('is_optional')->default(false)->after('nome');
            $table->index(['protocol_id', 'required_for_organ', 'is_optional'], 'protocol_doc_req_optional_idx');
        });
    }

    public function down(): void
    {
        Schema::table('protocol_document_requirements', function (Blueprint $table) {
            $table->dropIndex('protocol_doc_req_optional_idx');
            $table->dropColumn('is_optional');
        });
    }
};
