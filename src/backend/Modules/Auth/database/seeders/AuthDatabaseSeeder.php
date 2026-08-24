<?php
// Modules/Auth/Database/Seeders/DatabaseSeeder.php
// Executar com: php artisan module:seed Auth

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;
use Modules\Auth\database\seeders\PermissionSeeder;
use Modules\Auth\database\seeders\RoleSeeder;
use Modules\Auth\database\seeders\TestUserSeeder;

class AuthDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ORDEM OBRIGATÓRIA: permissions antes de roles (FK)
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            //TestUserSeeder::class,
        ]);
    }
}