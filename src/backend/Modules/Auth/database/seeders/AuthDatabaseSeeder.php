<?php

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;

class AuthDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);
    }
}
