<?php

namespace Modules\Organization\database\seeders;

use Illuminate\Database\Seeder;

class OrganizationDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganSeeder::class,
            ScientificAreaAndCourseSeeder::class,
        ]);
    }
}
