<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topic_review_evaluations', function (Blueprint $table) {
            $table->foreignId('comment_id')
                ->nullable()
                ->after('reviewer_id')
                ->constrained('topic_review_comments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('topic_review_evaluations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('comment_id');
        });
    }
};
