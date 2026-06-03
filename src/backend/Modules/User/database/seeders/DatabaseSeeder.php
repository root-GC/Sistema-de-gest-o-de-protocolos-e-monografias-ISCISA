<?php

namespace Modules\User\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;


/**
 * Executar com: php artisan module:seed User
 * ATENÇÃO: correr DEPOIS do módulo Auth (permissions e roles precisam de existir)
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganScientificAreaCourseSeeder::class,
        ]);
    }
}