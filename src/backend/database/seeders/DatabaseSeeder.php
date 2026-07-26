<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Password\database\seeders\PasswordDatabaseSeeder;
use Modules\Auth\database\seeders\AuthDatabaseSeeder;
use Modules\Defense\database\seeders\DefenseDatabaseSeeder;
use Modules\Monograph\database\seeders\MonographDatabaseSeeder;
use Modules\Organization\database\seeders\OrganizationDatabaseSeeder;
use Modules\Protocol\database\seeders\ProtocolDatabaseSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AuthDatabaseSeeder::class,
            OrganizationDatabaseSeeder::class,
            PasswordDatabaseSeeder::class,
            ProtocolDatabaseSeeder::class,
            MonographDatabaseSeeder::class,
            DefenseDatabaseSeeder::class,
        ]);
    }
}