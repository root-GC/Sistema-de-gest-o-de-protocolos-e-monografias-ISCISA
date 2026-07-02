<?php

namespace Modules\Organization\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Áreas científicas e cursos do ISCISA.
 *
 * Estrutura: Órgão → Área Científica → Curso
 *
 * As áreas estão todas sob o Núcleo Científico (organ_id = nucleus)
 * porque é ele que agrupa os cursos para efeitos de coordenação.
 * Os outros órgãos (Comitê, Bioética) actuam transversalmente sobre
 * todos os cursos — não têm áreas próprias.
 */
class ScientificAreaAndCourseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $nucleoId = DB::table('organs')->where('type', 'nucleus')->value('id');

        if (! $nucleoId) {
            throw new \Exception('OrganSeeder deve correr antes de ScientificAreaAndCourseSeeder.');
        }

        $structure = [
            'Saúde Pública' => [
                ['name' => 'Medicina',                    'code' => 'MED'],
                ['name' => 'Saúde Pública',               'code' => 'SP'],
            ],
            'Enfermagem' => [
                ['name' => 'Enfermagem',                  'code' => 'ENF'],
                ['name' => 'Enfermagem de Saúde Mental',  'code' => 'ESM'],
            ],
            'Reabilitação' => [
                ['name' => 'Fisioterapia',                'code' => 'FIS'],
                ['name' => 'Terapia Ocupacional',         'code' => 'TO'],
            ],
            'Farmácia e Ciências Laboratoriais' => [
                ['name' => 'Farmácia',                    'code' => 'FARM'],
                ['name' => 'Análises Clínicas',           'code' => 'AC'],
            ],
        ];

        foreach ($structure as $areaName => $courses) {
            $areaId = DB::table('scientific_areas')->insertGetId([
                'organ_id'   => $nucleoId,
                'name'       => $areaName,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($courses as $course) {
                DB::table('courses')->updateOrInsert(
                    ['code' => $course['code']],
                    [
                        'scientific_area_id' => $areaId,
                        'name'               => $course['name'],
                        'created_at'         => $now,
                        'updated_at'         => $now,
                    ]
                );
            }
        }
    }
}
