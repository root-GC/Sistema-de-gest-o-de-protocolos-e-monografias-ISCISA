<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (! Schema::hasColumn('documents', 'version_label')) {
                $table->string('version_label', 40)->nullable()->after('version');
            }

            if (! Schema::hasColumn('documents', 'rejected_by')) {
                $table->foreignId('rejected_by')->nullable()->after('version_label')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('documents', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'rejected_at')) {
                $table->dropColumn('rejected_at');
            }

            if (Schema::hasColumn('documents', 'rejected_by')) {
                $table->dropConstrainedForeignId('rejected_by');
            }

            if (Schema::hasColumn('documents', 'version_label')) {
                $table->dropColumn('version_label');
            }
        });
    }
};
