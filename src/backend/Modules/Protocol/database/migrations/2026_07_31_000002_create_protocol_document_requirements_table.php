<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('protocol_document_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->string('document_key', 80);
            $table->string('nome');
            $table->string('required_for_organ', 50);
            $table->string('file_path', 500)->nullable();
            $table->string('file_name')->nullable();
            $table->boolean('enviado')->default(false);
            $table->boolean('aprovado')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['protocol_id', 'required_for_organ', 'document_key'], 'protocol_doc_req_unique');
            $table->index(['protocol_id', 'required_for_organ']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('protocol_document_requirements');
    }
};
