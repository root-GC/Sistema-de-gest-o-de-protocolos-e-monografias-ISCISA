<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('permissions')->where('code', 'monograph.endorse')->exists();

        if (!$exists) {
            DB::table('permissions')->insert([
                'code'        => 'monograph.endorse',
                'description' => 'Supervisor aprova ou devolve submissão de monografia',
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('permissions')->where('code', 'monograph.endorse')->delete();
    }
};