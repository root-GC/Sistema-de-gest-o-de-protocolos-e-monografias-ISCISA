<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    public function up(): void
    {
        Permission::firstOrCreate(
            ['name' => 'monograph.comment', 'guard_name' => 'web']
        );
    }

    public function down(): void
    {
        Permission::where('name', 'monograph.comment')->delete();
    }
};