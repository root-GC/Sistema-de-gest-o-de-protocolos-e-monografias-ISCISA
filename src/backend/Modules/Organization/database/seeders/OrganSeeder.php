<?php

namespace Modules\Organization\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Órgãos institucionais do ISCISA.
 *
 * Fluxo de um protocolo:
 *   Núcleo Científico → Comitê Científico → Comitê de Bioética → Direção Científica
 *
 * Ordem importa: scientific_areas referencia organs.id.
 */
class OrganSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $organs = [
            [
                'name'        => 'Núcleo Científico',
                'type'        => 'nucleus',
                'description' => 'Ponto de entrada dos protocolos. Faz triagem documental e validação inicial dos temas e protocolos submetidos pelos estudantes.',
            ],
            [
                'name'        => 'Comitê Científico',
                'type'        => 'scientific_committee',
                'description' => 'Avalia o mérito científico dos protocolos aprovados pelo Núcleo. Atribui revisores e harmoniza avaliações.',
            ],
            [
                'name'        => 'Comitê de Bioética',
                'type'        => 'bioethics_committee',
                'description' => 'Avalia a conformidade ética dos protocolos de investigação. Aceite explícito obrigatório (RF-035).',
            ],
            [
                'name'        => 'Direção Científica',
                'type'        => 'scientific_direction',
                'description' => 'Órgão máximo. Emite parecer final e autoriza defesas.',
            ],
        ];

        foreach ($organs as $organ) {
            DB::table('organs')->updateOrInsert(
                ['type' => $organ['type']],
                array_merge($organ, ['created_at' => $now, 'updated_at' => $now])
            );
        }
    }
}