<?php

namespace Modules\Organization\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrganSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $organs = [
            [
                'name' => 'Direção Científica',
                'type' => 'scientific_direction',
                'description' => 'Órgão superior de direção científica.',
            ],
            [
                'name' => 'Comité Científico',
                'type' => 'scientific_committee',
                'description' => 'Órgão superior responsável pela avaliação científica.',
            ],
            [
                'name' => 'Comité de Bioética',
                'type' => 'bioethics_committee',
                'description' => 'Órgão superior responsável pela avaliação ética.',
            ],
            [
                'name' => 'Núcleo Científico de Medicina',
                'type' => 'nucleus',
                'description' => 'Núcleo científico da área de Medicina.',
            ],
            [
                'name' => 'Núcleo Científico de Saúde Pública',
                'type' => 'nucleus',
                'description' => 'Núcleo científico da área de Saúde Pública.',
            ],
            [
                'name' => 'Núcleo Científico de Enfermagem',
                'type' => 'nucleus',
                'description' => 'Núcleo científico da área de Enfermagem.',
            ],
            [
                'name' => 'Núcleo Científico de Reabilitação',
                'type' => 'nucleus',
                'description' => 'Núcleo científico da área de Reabilitação.',
            ],
        ];

        foreach ($organs as $organ) {
            DB::table('organs')->updateOrInsert(
                [
                    'name' => $organ['name'],
                    'type' => $organ['type'],
                ],
                [
                    'description' => $organ['description'],
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
