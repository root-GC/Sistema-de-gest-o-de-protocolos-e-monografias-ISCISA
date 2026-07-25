<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('protocols', function (Blueprint $table) {
            if (! Schema::hasColumn('protocols', 'supervisor_decision_at')) {
                $table->timestamp('supervisor_decision_at')->nullable()->after('submitted_at');
            }

            if (! Schema::hasColumn('protocols', 'justification')) {
                $table->text('justification')->nullable()->after('supervisor_decision_at');
            }

            if (! Schema::hasColumn('protocols', 'nc_version')) {
                $table->unsignedInteger('nc_version')->default(0)->after('version');
            }

            if (! Schema::hasColumn('protocols', 'cc_version')) {
                $table->unsignedInteger('cc_version')->default(0)->after('nc_version');
            }

            if (! Schema::hasColumn('protocols', 'cb_version')) {
                $table->unsignedInteger('cb_version')->default(0)->after('cc_version');
            }
        });
    }

    public function down(): void
    {
        Schema::table('protocols', function (Blueprint $table) {
            if (Schema::hasColumn('protocols', 'cb_version')) {
                $table->dropColumn('cb_version');
            }
            if (Schema::hasColumn('protocols', 'cc_version')) {
                $table->dropColumn('cc_version');
            }
            if (Schema::hasColumn('protocols', 'nc_version')) {
                $table->dropColumn('nc_version');
            }
            if (Schema::hasColumn('protocols', 'justification')) {
                $table->dropColumn('justification');
            }
            if (Schema::hasColumn('protocols', 'supervisor_decision_at')) {
                $table->dropColumn('supervisor_decision_at');
            }
        });
    }
};

