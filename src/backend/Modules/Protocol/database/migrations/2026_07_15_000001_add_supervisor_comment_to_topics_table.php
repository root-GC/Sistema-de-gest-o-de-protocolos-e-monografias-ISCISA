<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            if (! Schema::hasColumn('topics', 'supervisor_comment')) {
                $table->text('supervisor_comment')->nullable()->after('supervisor_decision_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            if (Schema::hasColumn('topics', 'supervisor_comment')) {
                $table->dropColumn('supervisor_comment');
            }
        });
    }
};
