<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monograph_id')->unique()->constrained('monographs');
            $table->foreignId('coordinator_id')->nullable()->constrained('teacher_profiles');
            $table->string('status')->default('aguarda_juri');
            $table->timestamp('scheduled_at')->nullable();
            $table->string('location')->nullable();
            $table->decimal('final_grade', 4, 2)->nullable();
            $table->boolean('requires_corrections')->default(false);
            $table->text('corrections_notes')->nullable();
            $table->string('minutes_file_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defenses');
    }
};