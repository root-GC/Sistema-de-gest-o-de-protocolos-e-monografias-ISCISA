<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->foreignId('supervisor_id')
                ->nullable()
                ->after('student_id')
                ->constrained('teacher_profiles')
                ->nullOnDelete();

            $table->string('supervisor_status')->default('pending')->after('status');

            $table->timestamp('supervisor_decision_at')->nullable()->after('supervisor_status');
        });
    }

    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supervisor_id');
            $table->dropColumn(['supervisor_status', 'supervisor_decision_at']);
        });
    }
};
