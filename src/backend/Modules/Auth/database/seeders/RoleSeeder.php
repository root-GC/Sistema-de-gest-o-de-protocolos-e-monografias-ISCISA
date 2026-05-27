<?php

namespace Modules\Auth\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate([
            'name' => 'admin'
        ]);

        Role::firstOrCreate([
            'name' => 'docente'
        ]);

        Role::firstOrCreate([
            'name' => 'estudante'
        ]);

         Role::firstOrCreate([
            'name' => 'secretaria'
        ]);
    }
}