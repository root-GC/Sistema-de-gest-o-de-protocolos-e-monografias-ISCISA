<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monograph_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monograph_id')->constrained('monographs');
            $table->foreignId('monograph_document_id')->constrained('monograph_documents');
            $table->unsignedInteger('version');
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['monograph_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monograph_submissions');
    }
};