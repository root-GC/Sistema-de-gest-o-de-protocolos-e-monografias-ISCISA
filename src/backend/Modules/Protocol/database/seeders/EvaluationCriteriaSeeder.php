<?php

namespace Modules\Protocol\database\seeders;

use Illuminate\Database\Seeder;
use Modules\Protocol\app\Models\EvaluationCriterion;

class EvaluationCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $order = 0;

        $criteria = [
            'Elementos Pré-Textuais' => [
                'Template',
                'Título do protocolo',
                'Lista de autores e responsabilidade/Declaração de conformidade e responsabilidade',
                'Abreviaturas acrónimos e siglas',
                'Índice',
                'Resumo',
            ],
            'Elementos Textuais' => [
                'Introdução',
                'Revisão da Literatura e estado da arte',
                'Enunciado do problema e Questão de partida',
                'Hipóteses',
                'Justificativa',
                'Objectivos',
                'Descrição do local do estudo',
                'Tipo(s) de estudo',
                'Horizonte temporal estudo',
                'População e amostra',
                'Técnica da amostragem',
                'Critérios de inclusão e exclusão',
                'Variáveis de estudo',
                'Técnicas e instrumentos de recolha de dados',
                'Procedimentos',
                'Método de analise e processamento de dados',
                'Considerações éticas',
                'Cronograma',
                'Orçamento',
                'Referências bibliógrafas',
            ],
            'Elementos Pós-Textuais' => [
                'Apêndices',
                'Anexos',
            ],
        ];

        foreach ($criteria as $groupName => $items) {
            foreach ($items as $name) {
                $criterion = EvaluationCriterion::withTrashed()->firstOrNew([
                    'group_name' => $groupName,
                    'name' => $name,
                ]);

                if ($criterion->trashed()) {
                    $criterion->restore();
                }

                $criterion->fill([
                    'order_column' => $order++,
                    'is_active' => true,
                ]);
                $criterion->save();
            }
        }
    }
}
