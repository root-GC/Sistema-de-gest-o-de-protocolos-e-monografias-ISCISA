<?php

namespace Modules\Protocol\database\seeders;

use Illuminate\Database\Seeder;
use Modules\Protocol\app\Models\OrganDocumentRequirement;
use Modules\Protocol\app\Models\Protocol;
use Modules\Organization\app\Models\Organ;

class OrganDocumentRequirementSeeder extends Seeder
{
    public function run(): void
    {
        $catalogues = [
            Protocol::ORGAN_TYPE_SCIENTIFIC_COMMITTEE => [
                ['cover_letter', 'Carta de cobertura', false],
                ['credentials', 'Credenciais', false],
                ['originality_declaration', 'Declaração de originalidade', false],
                ['academic_record_declaration', 'Declaração do registo académico', false],
                ['financial_statement_declaration', 'Declaração do extracto financeiro', false],
                ['authors_responsibility_list', 'Lista de autores e responsabilidade', false],
                ['folha_info_instrucoes', 'Folha de informação ao participante – instruções de preenchimento', false],
                ['folha_info_participante', 'Folha de informação ao participante', false],
                ['consentimento_participante', 'Termo de consentimento livre e informado do participante', false],
                ['carta_autorizacao_supervisor', 'Carta de autorização do supervisor para a submissão do protocolo (actualizada)', false],
                ['cv_estudante', 'Curriculum Vitae do estudante ou pesquisador', false],
                ['cv_supervisor', 'Curriculum Vitae do supervisor (e do co-supervisor, caso aplicável)', false],
                ['consentimento_tutor', 'Termo de consentimento livre e informado do pai/mãe ou tutor legal da criança menor de dezoito anos de idade', true],
                ['assentimento_menor', 'Termo de assentimento do participante menor, de doze a dezassete anos de idade', true],
            ],
            Protocol::ORGAN_TYPE_BIOETHICS_COMMITTEE => [
                ['carta_revisao_bioetica_cibs', 'Carta de solicitação de revisão bioética ao CIBS-ISCISA', false],
                ['declaracao_compromisso_bioetica_cibs', 'Declaração de compromisso do estudante ou investigador, em cumprir os princípios de bioética e aceitação das normas e procedimentos do CIBS-ISCISA', false],
                ['declaracao_conflito_interesses', 'Declaração de comunicação de conflito de interesse', false],
            ],
        ];

        foreach ($catalogues as $organType => $requirements) {
            Organ::query()->where('type', $organType)->each(function (Organ $organ) use ($requirements): void {
                foreach ($requirements as [$key, $name, $isOptional]) {
                    OrganDocumentRequirement::query()->firstOrCreate(
                        ['organ_id' => $organ->id, 'document_key' => $key],
                        [
                            'name' => $name,
                            'description' => null,
                            'is_optional' => $isOptional,
                            'is_active' => true,
                        ]
                    );
                }
            });
        }
    }
}
