<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monograph_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monograph_submission_id')->constrained('monograph_submissions');
            $table->string('stage');            // supervisor | orgao
            $table->string('decision');         // aprovado | devolvido
            $table->text('reason')->nullable();
            $table->timestamp('decided_at');
            $table->foreignId('decided_by_user_id')->constrained('users');
            $table->string('decided_by_role');  // supervisor | secretary | coordinator
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monograph_reviews');
    }
};