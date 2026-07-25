<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluation_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('protocol_id')->constrained('protocols')->cascadeOnDelete();
            $table->string('version');
            $table->string('organ');
            $table->string('status')->default('pending_review');
            $table->string('final_decision')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->text('conclusion_summary')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['protocol_id', 'version', 'organ']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_forms');
    }
};
