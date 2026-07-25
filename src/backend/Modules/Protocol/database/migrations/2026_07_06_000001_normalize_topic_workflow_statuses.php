<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('topics')->where('status', 'topic_pending')->update([
            'status' => 'topic_pending_supervisor',
        ]);

        DB::table('topics')->where('status', 'topic_approved')->update([
            'status' => 'topic_pending_nucleo',
        ]);

        DB::table('topics')->where('status', 'topic_rejected')->update([
            'status' => 'topic_rejected_supervisor',
        ]);
    }

    public function down(): void
    {
        DB::table('topics')->where('status', 'topic_pending_supervisor')->update([
            'status' => 'topic_pending',
        ]);

        DB::table('topics')->where('status', 'topic_pending_nucleo')->update([
            'status' => 'topic_approved',
        ]);

        DB::table('topics')->where('status', 'topic_rejected_supervisor')->update([
            'status' => 'topic_rejected',
        ]);
    }
};
