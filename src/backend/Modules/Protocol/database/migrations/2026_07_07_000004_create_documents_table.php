<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submited_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->string('document_type');
            $table->string('file_name');
            $table->string('file_path');
            $table->integer('pages')->nullable();
            $table->integer('version')->default(1);
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['protocol_id', 'status']);
            $table->index(['submited_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
