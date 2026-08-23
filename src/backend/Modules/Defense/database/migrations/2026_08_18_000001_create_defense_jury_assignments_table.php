<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defense_jury_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_jury_id')->constrained('defense_juries')->cascadeOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->enum('status', ['pending', 'returned', 'completed'])->default('pending');
            $table->text('return_note')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_jury_assignments');
    }
};
