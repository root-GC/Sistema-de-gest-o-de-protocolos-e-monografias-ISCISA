<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->dateTime('deliberation_date')->nullable()->after('decided_at');
            $table->string('deliberation_location')->nullable()->after('deliberation_date');
            $table->foreignId('deliberation_scheduled_by')->nullable()->after('deliberation_location')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->dropForeign(['deliberation_scheduled_by']);
            $table->dropColumn(['deliberation_date', 'deliberation_location', 'deliberation_scheduled_by']);
        });
    }
};