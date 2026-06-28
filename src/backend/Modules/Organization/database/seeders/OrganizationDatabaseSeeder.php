<?php

namespace Modules\Organization\Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Orchestrador do módulo Organization.
 *
 * Ordem obrigatória:
 *   1. OrganSeeder                    — órgãos institucionais
 *   2. ScientificAreaAndCourseSeeder  — áreas e cursos (depende de organs)
 *   3. OrganizationProfileSeeder      — perfis dos users (depende de tudo acima
 *                                       + Auth\TestUserSeeder já ter corrido)
 *
 * No DatabaseSeeder global deve correr DEPOIS de Auth\DatabaseSeeder.
 */
class OrganizationDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganSeeder::class,
            ScientificAreaAndCourseSeeder::class,
            OrganizationProfileSeeder::class,
        ]);
    }
}