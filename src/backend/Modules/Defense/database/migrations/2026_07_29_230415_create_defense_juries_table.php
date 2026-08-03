<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('defense_juries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_id')->constrained('defenses');
            $table->foreignId('teacher_id')->constrained('teacher_profiles');
            $table->string('jury_role'); // presidente | arguente | orientador
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['defense_id', 'teacher_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_juries');
    }
};