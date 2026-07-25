<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monograph_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monograph_submission_id')->constrained('monograph_submissions');
            $table->foreignId('commented_by_user_id')->constrained('users');
            $table->string('commented_by_role');   // supervisor | secretary | coordinator
            $table->text('comment');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monograph_comments');
    }
};