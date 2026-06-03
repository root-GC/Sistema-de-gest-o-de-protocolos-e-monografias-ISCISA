<?php

namespace Modules\User\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Semeia os dados institucionais reais do ISCISA:
 * Órgãos → Áreas Científicas → Cursos (secção 2.2 do documento de requisitos)
 */
class OrganScientificAreaCourseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Órgãos ──────────────────────────────────────────────────
        $organs = [
            ['name' => 'Núcleo Científico',    'type' => 'nucleus',               'description' => 'Primeira avaliação do protocolo; validação de temas'],
            ['name' => 'Comitê Científico',    'type' => 'scientific_committee',  'description' => 'Avaliação aprofundada; verificação documental completa'],
            ['name' => 'Comitê de Bioética',   'type' => 'bioethics_committee',   'description' => 'Avaliação ética do protocolo'],
            ['name' => 'Direção Científica',   'type' => 'scientific_direction',  'description' => 'Verificação final; agendamento de defesas; alocação de júris'],
        ];

        foreach ($organs as $organ) {
            DB::table('organs')->updateOrInsert(['name' => $organ['name']], array_merge($organ, [
                'created_at' => $now, 'updated_at' => $now,
            ]));
        }

        $nucleoId = DB::table('organs')->where('type', 'nucleus')->value('id');

        // ── Áreas Científicas (ligadas ao Núcleo) ─────────────────────
        $areas = [
            'Reabilitação',
            'Saúde Pública',
            'Administração Hospitalar',
            'Diagnóstico',
            'Enfermagem',
            'Mestrado',
        ];

        foreach ($areas as $area) {
            DB::table('scientific_areas')->updateOrInsert(['name' => $area], [
                'organ_id'   => $nucleoId,
                'name'       => $area,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ── Cursos por área (secção 2.2) ──────────────────────────────
        $cursos = [
            'Reabilitação'            => [['name'=>'Terapia da Fala','code'=>'TF'],['name'=>'Terapia Ocupacional','code'=>'TO'],['name'=>'Fisioterapia','code'=>'FT']],
            'Saúde Pública'           => [['name'=>'Nutrição','code'=>'NU'],['name'=>'Saúde Pública','code'=>'SP'],['name'=>'Psicologia Clínica','code'=>'PC'],['name'=>'Serviços Sociais','code'=>'SS']],
            'Administração Hospitalar'=> [['name'=>'Administração e Gestão Hospitalar','code'=>'AGH'],['name'=>'Logística em Saúde','code'=>'LS']],
            'Diagnóstico'             => [['name'=>'Anatomia Patológica','code'=>'AP'],['name'=>'Tecnologias Biomédicas','code'=>'TB']],
            'Enfermagem'              => [['name'=>'Enfermagem','code'=>'ENF']],
            'Mestrado'                => [['name'=>'Estatística e Planificação','code'=>'EP'],['name'=>'Neonatologia','code'=>'NEO'],['name'=>'Segurança e Saúde do Trabalho','code'=>'SST']],
        ];

        foreach ($cursos as $areaName => $courses) {
            $areaId = DB::table('scientific_areas')->where('name', $areaName)->value('id');
            foreach ($courses as $course) {
                DB::table('courses')->updateOrInsert(['code' => $course['code']], [
                    'scientific_area_id' => $areaId,
                    'name'               => $course['name'],
                    'code'               => $course['code'],
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ]);
            }
        }

        $this->command->info('Órgãos, áreas científicas e cursos carregados.');
    }
}