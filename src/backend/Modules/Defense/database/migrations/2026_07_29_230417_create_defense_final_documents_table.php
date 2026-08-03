<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defense_final_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_id')->constrained('defenses');
            $table->foreignId('submitted_by')->constrained('users');
            $table->string('file_name');
            $table->string('file_path');
            $table->unsignedInteger('version');
            $table->string('status')->default('pendente'); // pendente | aprovado | rejeitado
            $table->foreignId('validated_by')->nullable()->constrained('users');
            $table->text('validation_notes')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_final_documents');
    }
};