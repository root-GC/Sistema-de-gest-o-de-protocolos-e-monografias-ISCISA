<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('protocols', 'supervisor_id')) {
            return;
        }

        Schema::table('protocols', function (Blueprint $table) {
            $table->foreignId('supervisor_id')
                ->nullable()
                ->after('student')
                ->constrained('teacher_profiles')
                ->nullOnDelete();

            $table->index('supervisor_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('protocols', 'supervisor_id')) {
            return;
        }

        Schema::table('protocols', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropIndex(['supervisor_id']);
            $table->dropColumn('supervisor_id');
        });
    }
};
