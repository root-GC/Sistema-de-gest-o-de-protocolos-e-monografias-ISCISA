<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opinions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->foreignId('evaluation_form_id')->nullable()->constrained('evaluation_forms')->nullOnDelete();
            $table->string('version');
            $table->string('organ');
            $table->string('decision');
            $table->text('observations')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('issued_at');
            $table->string('document_path')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['protocol_id', 'version', 'organ']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opinions');
    }
};
