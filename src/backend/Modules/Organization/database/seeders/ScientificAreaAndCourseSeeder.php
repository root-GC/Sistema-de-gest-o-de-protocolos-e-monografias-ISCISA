<?php

namespace Modules\Organization\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ScientificAreaAndCourseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $structure = [
            'Medicina' => [
                'organ' => 'Núcleo Científico de Medicina',
                'courses' => [
                    ['name' => 'Medicina', 'code' => 'MED'],
                    ['name' => 'Cirurgia', 'code' => 'CIR'],
                    ['name' => 'Anatomia Patológica', 'code' => 'AP'],
                    ['name' => 'Imagiologia', 'code' => 'IMG'],
                    ['name' => 'Tecnologia Biomédica e Laboratorial', 'code' => 'TBL'],
                ],
            ],
            'Saúde Pública' => [
                'organ' => 'Núcleo Científico de Saúde Pública',
                'courses' => [
                    ['name' => 'Saúde Pública', 'code' => 'SP'],
                    ['name' => 'Nutrição', 'code' => 'NUT'],
                    ['name' => 'Administração e Gestão Hospitalar', 'code' => 'AGH'],
                    ['name' => 'Gestão Logística em Saúde', 'code' => 'GLS'],
                    ['name' => 'Serviço Social', 'code' => 'SS'],
                ],
            ],
            'Enfermagem' => [
                'organ' => 'Núcleo Científico de Enfermagem',
                'courses' => [
                    ['name' => 'Enfermagem Geral', 'code' => 'EG'],
                    ['name' => 'Enfermagem', 'code' => 'ENF'],
                    ['name' => 'Enfermagem de Saúde Mental', 'code' => 'ESM'],
                    ['name' => 'Enfermagem de Saúde Materna e Infantil', 'code' => 'ESMI'],
                    ['name' => 'Enfermagem Médico-Cirúrgica', 'code' => 'EMC'],
                ],
            ],
            'Reabilitação' => [
                'organ' => 'Núcleo Científico de Reabilitação',
                'courses' => [
                    ['name' => 'Fisioterapia', 'code' => 'FIS'],
                    ['name' => 'Terapia Ocupacional', 'code' => 'TO'],
                    ['name' => 'Terapia da Fala', 'code' => 'TF'],
                    ['name' => 'Psicologia Clínica', 'code' => 'PC'],
                    ['name' => 'Reabilitação Psicossocial', 'code' => 'RP'],
                ],
            ],
        ];

        foreach ($structure as $areaName => $data) {
            $organId = DB::table('organs')->where('name', $data['organ'])->value('id');

            if (! $organId) {
                throw new RuntimeException("Órgão não encontrado: {$data['organ']}");
            }

            DB::table('scientific_areas')->updateOrInsert(
                ['name' => $areaName],
                [
                    'organ_id' => $organId,
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );

            $areaId = DB::table('scientific_areas')->where('name', $areaName)->value('id');

            foreach ($data['courses'] as $course) {
                DB::table('courses')->updateOrInsert(
                    ['code' => $course['code']],
                    [
                        'scientific_area_id' => $areaId,
                        'name' => $course['name'],
                        'deleted_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}
