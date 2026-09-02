<?php

namespace Modules\Protocol\database\seeders;

use Illuminate\Database\Seeder;

class ProtocolDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            EvaluationCriteriaSeeder::class,
            OrganDocumentRequirementSeeder::class,
        ]);
    }
}
