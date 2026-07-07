<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topic_review_comments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('topic_id')
                ->constrained('topics')
                ->cascadeOnDelete();

            $table->text('content');
            $table->string('status')->default('active');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['topic_id', 'status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topic_review_comments');
    }
};
