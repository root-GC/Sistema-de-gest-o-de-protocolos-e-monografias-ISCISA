<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monograph_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monograph_id')->constrained('monographs');
            $table->foreignId('submitted_by')->constrained('users');
            $table->string('document_type');   // monografia_final, declaracao_originalidade, etc.
            $table->string('file_name');
            $table->string('file_path');
            $table->integer('pages')->nullable();
            $table->unsignedInteger('version');
            $table->string('status')->default('pendente'); // pendente | aprovado | rejeitado
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monograph_documents');
    }
};