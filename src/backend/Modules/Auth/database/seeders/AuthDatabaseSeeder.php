<?php
// Modules/Auth/Database/Seeders/DatabaseSeeder.php
// Executar com: php artisan module:seed Auth

namespace Modules\Auth\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Auth\Database\Seeders\PermissionSeeder;
use Modules\Auth\Database\Seeders\RoleSeeder;
use Modules\Auth\Database\Seeders\TestUserSeeder;

class AuthDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ORDEM OBRIGATÓRIA: permissions antes de roles (FK)
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            TestUserSeeder::class,
        ]);
    }
}
