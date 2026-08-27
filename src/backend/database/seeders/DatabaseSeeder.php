<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Auth\database\seeders\RoleSeeder;
use Modules\Organization\database\seeders\OrganSeeder;
use Modules\Organization\database\seeders\ScientificAreaAndCourseSeeder;
use Modules\User\database\seeders\AreaTeachersSeeder;
use Modules\User\database\seeders\OrganAdminsSeeder;
use Modules\User\database\seeders\OrganSecretariesSeeder;
use Modules\User\database\seeders\ScientificDirectionAdminSeeder;
use Modules\User\database\seeders\StudentsSeeder;
use Modules\User\database\seeders\SuperAdminSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            OrganSeeder::class,
            ScientificAreaAndCourseSeeder::class,
            AreaTeachersSeeder::class,
            StudentsSeeder::class,
            SuperAdminSeeder::class,
            ScientificDirectionAdminSeeder::class,
            OrganAdminsSeeder::class,
            OrganSecretariesSeeder::class,
        ]);
    }
}
