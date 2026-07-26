<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'password' => bcrypt('password')]
        );

        $this->call([
            \Modules\Auth\Database\Seeders\AuthDatabaseSeeder::class,
            \Modules\Organization\Database\Seeders\OrganizationDatabaseSeeder::class,
            \Modules\Protocol\Database\Seeders\ProtocolDatabaseSeeder::class,
            \Modules\Monograph\Database\Seeders\MonographDatabaseSeeder::class,
        ]);
    }
}