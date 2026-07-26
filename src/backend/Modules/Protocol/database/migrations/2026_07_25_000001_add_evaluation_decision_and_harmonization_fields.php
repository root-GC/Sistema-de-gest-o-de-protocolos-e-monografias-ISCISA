<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviewer_evaluations', function (Blueprint $table) {
            $table->renameColumn('recommendation', 'decision');
            $table->boolean('needs_deliberation')->default(false)->after('decision');
        });

        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->string('form_type')->default('evaluation')->after('version');
            $table->foreignId('parent_form_id')
                ->nullable()
                ->after('form_type')
                ->constrained('evaluation_forms')
                ->nullOnDelete();
            $table->string('harmonized_decision')->nullable()->after('final_decision');
            $table->timestamp('harmonized_at')->nullable()->after('harmonized_decision');
        });
    }

    public function down(): void
    {
        Schema::table('reviewer_evaluations', function (Blueprint $table) {
            $table->renameColumn('decision', 'recommendation');
            $table->dropColumn('needs_deliberation');
        });

        Schema::table('evaluation_forms', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_form_id');
            $table->dropColumn(['form_type', 'harmonized_decision', 'harmonized_at']);
        });
    }
};
