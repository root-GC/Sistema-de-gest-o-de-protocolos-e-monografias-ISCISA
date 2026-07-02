<?php

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Permissions definitivas — SGPMC-ISCISA
 *
 * Derivadas de:
 *   - Estrutura da DB (protocols, topic_reviews, protocol_review_assignments,
 *     protocol_evaluations, documents, organs, teacher_profiles, student_profiles)
 *   - Documento de requisitos v1.0 (RF-001 a RF-077)
 *   - Fluxo institucional: Núcleo → Comitê Científico → Bioética → Direção
 *
 * Domínios:
 *   topic.*          — RF-018, RF-019 (proposta de tema)
 *   protocol.*       — RF-009, RF-026 a RF-032 (ciclo de vida do protocolo)
 *   document.*       — RF-011, RF-041 a RF-047 (ficheiros e validação administrativa)
 *   evaluation.*     — RF-033 a RF-040 (fichas de avaliação / revisão cega)
 *   supervision.*    — RF-023 a RF-025 (aval do supervisor)
 *   reviewer.*       — RF-060, RF-061 (gestão de pool de revisores)
 *   workload.*       — RF-057 a RF-059 (carga de trabalho dos docentes)
 *   defense.*        — RF-062 a RF-070 (agendamento e júri)
 *   monograph.*      — RF-010, RF-062 (monografia final)
 *   reports.*        — RF-072 a RF-077 (BI e relatórios)
 *   admin.*          — RF-004, RF-005 (gestão do sistema)
 */
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $permissions = [

            // ── TOPIC (proposta de tema — Fase 1 Núcleo) ──────────────────
            ['code' => 'topic.create',      'description' => 'Submeter proposta de tema para validação'],
            ['code' => 'topic.view',         'description' => 'Ver o próprio tema e o seu estado'],
            ['code' => 'topic.resubmit',     'description' => 'Resubmeter tema após devolução para correcções'],
            ['code' => 'topic.review',       'description' => 'Avaliar propostas de tema (Núcleo)'],
            ['code' => 'topic.view.all',     'description' => 'Ver todos os temas do órgão'],

            // ── PROTOCOL (ciclo completo do protocolo) ────────────────────
            ['code' => 'protocol.create',    'description' => 'Criar rascunho de protocolo'],
            ['code' => 'protocol.submit',    'description' => 'Submeter protocolo ao Núcleo Científico'],
            ['code' => 'protocol.view',      'description' => 'Ver o próprio protocolo e histórico de estados'],
            ['code' => 'protocol.view.all',  'description' => 'Ver todos os protocolos do órgão ou curso'],
            ['code' => 'protocol.resubmit',  'description' => 'Resubmeter protocolo após correcções'],
            ['code' => 'protocol.triage',    'description' => 'Fazer triagem documental (secretário)'],
            ['code' => 'protocol.assign',    'description' => 'Atribuir revisores a um protocolo'],
            ['code' => 'protocol.review',    'description' => 'Aceder ao protocolo para revisão científica'],
            ['code' => 'protocol.evaluate',  'description' => 'Preencher ficha de avaliação'],
            ['code' => 'protocol.forward',   'description' => 'Encaminhar protocolo para próximo órgão'],
            ['code' => 'protocol.return',    'description' => 'Devolver protocolo para correcções com parecer'],
            ['code' => 'protocol.reject',    'description' => 'Rejeitar definitivamente um protocolo'],
            ['code' => 'protocol.approve',   'description' => 'Emitir parecer de aprovação final do protocolo'],

            // ── DOCUMENT (ficheiros e validação administrativa) ───────────
            // Corresponde às tabelas: documents, e ao fluxo de verificação
            // documental do Comitê Científico e Bioética
            ['code' => 'document.upload',    'description' => 'Fazer upload de documentos (estudante)'],
            ['code' => 'document.view',      'description' => 'Ver documentos do próprio processo'],
            ['code' => 'document.view.all',  'description' => 'Ver todos os documentos de um processo (secretário/gestor)'],
            ['code' => 'document.validate',  'description' => 'Validar ou rejeitar documento administrativo'],
            ['code' => 'document.resubmit',  'description' => 'Resubmeter documento rejeitado'],

            // ── EVALUATION (ficha de avaliação — revisão cega) ────────────
            // Tabelas: protocol_evaluations, topic_review_evaluations
            ['code' => 'evaluation.create',     'description' => 'Criar avaliação numa ficha estruturada'],
            ['code' => 'evaluation.accept',     'description' => 'Aceitar explicitamente avaliação final (obrigatório no Bioética)'],
            ['code' => 'evaluation.harmonize',  'description' => 'Harmonizar avaliação entre revisores'],
            ['code' => 'evaluation.view',       'description' => 'Ver avaliações do processo com identidade dos revisores (revisores e gestores)'],
            ['code' => 'evaluation.view.own',   'description' => 'Ver parecer final do próprio processo sem identidade dos revisores (estudante — só após deliberação)'],
            ['code' => 'evaluation.view.all',   'description' => 'Ver todas as avaliações incluindo identidade (secretário/gestor)'],

            // ── SUPERVISION (aval do supervisor — RF-023 a RF-025) ────────
            ['code' => 'supervision.approve',   'description' => 'Aprovar ou rejeitar submissão do tutorado'],
            ['code' => 'supervision.view',      'description' => 'Ver lista de tutorandos e estado dos seus processos'],
            ['code' => 'supervision.comment',   'description' => 'Adicionar comentário à submissão do tutorado'],

            // ── REVIEWER (pool de revisores por órgão — RF-060, RF-061) ──
            ['code' => 'reviewer.manage',       'description' => 'Cadastrar e gerir pool de revisores por órgão'],
            ['code' => 'reviewer.assign',       'description' => 'Atribuir revisor específico a um protocolo'],

            // ── WORKLOAD (carga de trabalho — RF-057 a RF-059) ────────────
            ['code' => 'workload.view',         'description' => 'Ver a própria carga de trabalho (revisões, supervisões)'],
            ['code' => 'workload.view.all',     'description' => 'Ver carga de trabalho de todos os docentes'],

            // ── DEFENSE (defesas — RF-062 a RF-070) ───────────────────────
            ['code' => 'defense.view',          'description' => 'Ver calendário de defesas'],
            ['code' => 'defense.schedule',      'description' => 'Agendar defesa (data, hora, sala)'],
            ['code' => 'defense.jury.assign',   'description' => 'Indicar membros do júri'],
            ['code' => 'defense.jury.participate', 'description' => 'Participar numa banca como membro do júri'],
            ['code' => 'defense.grade.record',  'description' => 'Registar nota final após defesa'],
            ['code' => 'defense.minutes.upload', 'description' => 'Fazer upload da acta digitalizada'],

            // ── MONOGRAPH (monografia final — RF-010, RF-062) ─────────────
            ['code' => 'monograph.submit',      'description' => 'Submeter monografia final com aval do supervisor'],
            ['code' => 'monograph.view',        'description' => 'Ver a própria monografia'],
            ['code' => 'monograph.view.all',    'description' => 'Ver todas as monografias'],
            ['code' => 'monograph.validate',    'description' => 'Verificar documentação completa antes de aceitar para defesa'],

            // ── REPORTS (BI — RF-072 a RF-077) ────────────────────────────
            ['code' => 'reports.view',          'description' => 'Ver relatórios do próprio curso/órgão'],
            ['code' => 'reports.view.all',      'description' => 'Ver todos os relatórios e painel consolidado'],
            ['code' => 'reports.export',        'description' => 'Exportar relatórios'],

            // ── ADMIN (gestão do sistema) ─────────────────────────────────
            ['code' => 'admin.users',           'description' => 'Gerir utilizadores e atribuir papéis'],
            ['code' => 'admin.organs',          'description' => 'Gerir órgãos, áreas científicas e cursos'],
            ['code' => 'admin.reports',         'description' => 'Acesso total a relatórios e métricas'],
            ['code' => 'admin.settings',        'description' => 'Configurar parâmetros do sistema'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['code' => $permission['code']],
                [
                    'description' => $permission['description'],
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]
            );
        }
    }
}
