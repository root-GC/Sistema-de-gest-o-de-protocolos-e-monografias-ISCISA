<?php

namespace Modules\Monograph\database\seeders;

use Illuminate\Database\Seeder;

class MonographDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            MonographTestSeeder::class,
        ]);
    }
}
