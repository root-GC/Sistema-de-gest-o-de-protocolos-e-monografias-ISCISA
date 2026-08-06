<?php

namespace Modules\Auth\database\seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Roles e permissions — SGPMC-ISCISA
 *
 * Roles (6 + separação teacher/supervisor):
 *   student      — submete e acompanha o seu processo
 *   teacher      — docente genérico: júri, relatórios, workload
 *   supervisor   — docente com tutorandos: valida submissões deles
 *   reviewer     — docente avaliador de órgão: preenche fichas
 *   coordinator  — atribui revisores, gere defesas, estatísticas
 *   secretary    — triagem documental e gestão administrativa do órgão
 *   admin        — gestão de utilizadores e sistema
 *
 * Relação teacher ↔ supervisor na DB:
 *   Ambos usam teacher_profiles — não existe supervisor_profiles.
 *   A distinção é pela role. Um utilizador pode ter teacher + supervisor
 *   ao mesmo tempo (ex: docente que orienta E participa em júris).
 *   student_profiles.supervisorID → teacher_profiles.id do supervisor.
 *
 * STUDENT — correcções aplicadas:
 *   - Removido evaluation.view  (revisão cega activa durante o processo — RNF-004;
 *                                 estudante só vê parecer FINAL após deliberação)
 *   - Removido workload.view    (não tem sentido para estudante — é métrica de docentes)
 *   - Removido defense.view     (só vê a sua defesa quando agendada — coberto por protocol.view)
 *   - Adicionado evaluation.view.own  (ver parecer final do próprio processo, não durante revisão)
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $roles = [

            // ── STUDENT ───────────────────────────────────────────────────
            // O estudante actua sempre no contexto do SEU processo.
            // Não vê avaliações durante a revisão (RNF-004 — revisão cega).
            // Só vê o parecer final após deliberação do órgão.
            // RF: 009,010,011,012,013,014,015,016,017,018,019,022,031,049,050
            'student' => [
                'description' => 'Estudante — submete temas, protocolos e monografias',
                'permissions' => [
                    // Tema
                    'topic.create',           // propor tema ao Núcleo (RF-018)
                    'topic.view',             // ver estado do próprio tema
                    'topic.resubmit',         // resubmeter após devolução

                    // Protocolo
                    'protocol.create',        // criar rascunho
                    'protocol.submit',        // submeter ao Núcleo
                    'protocol.view',          // ver estado e histórico do próprio protocolo
                    'protocol.resubmit',      // corrigir e resubmeter (RF-031)

                    // Documentos
                    'document.upload',        // fazer upload de declarações, CV, etc.
                    'document.view',          // ver os seus próprios documentos
                    'document.resubmit',      // reenviar documento nao aprovado (RF-045)

                    // Pareceres — só o resultado final, nunca durante revisão
                    'evaluation.view.own',    // ver parecer final do seu processo (não identidade dos revisores)

                    // Monografia
                    'monograph.submit',       // submeter monografia final (RF-010)
                    'monograph.view',         // ver estado da própria monografia
                ],
            ],

            // ── TEACHER (docente sem tutorandos activos) ──────────────────
            // Docente que participa em júris e vê relatórios do seu departamento
            // mas NÃO tem responsabilidade de supervisão directa.
            // Se tiver tutorandos → acumula role supervisor.
            // RF: 007, 057, 058, 059, 064, 075
            'teacher' => [
                'description' => 'Docente — participa em júris e acompanha carga de trabalho',
                'permissions' => [
                    'document.view',              // ver documentos dos processos em que participa
                    'workload.view',              // ver a própria carga (revisões, júris)
                    'defense.view',               // ver calendário de defesas
                    'defense.jury.participate',   // participar como membro de júri (RF-064)
                    'reports.view',               // ver relatórios do próprio departamento/área
                ],
            ],

            // ── SUPERVISOR (docente com tutorandos) ───────────────────────
            // Docente que orienta estudantes. Usa teacher_profiles (mesma tabela).
            // A diferença está na role: supervisor tem permissão para validar
            // submissões — acção bloqueante no fluxo (RF-015, RF-023 a RF-025).
            // Um supervisor acumula sempre a role teacher também.
            // RF: 023, 024, 025, 007, 057, 058
            'supervisor' => [
                'description' => 'Supervisor — orienta tutorandos e valida as suas submissões',
                'permissions' => [
                    'supervision.approve',    // aprovar ou rejeitar submissão do tutorado (RF-023)
                    'supervision.view',       // ver lista de tutorandos e estado dos processos
                    'supervision.comment',    // adicionar comentário à submissão (RF-024)
                    'document.view',          // ver documentos dos tutorandos
                    'workload.view',          // ver a própria carga (tutorandos, revisões)
                    'defense.view',           // ver defesas dos tutorandos
                    'defense.jury.participate',
                    'reports.view',
                ],
            ],

            // ── REVIEWER (membro avaliador de órgão) ─────────────────────
            // Docente designado para avaliar protocolos num órgão específico.
            // Usa teacher_profiles para filtro de grau académico (RF-061):
            //   mestrado/doutoramento → revisor precisa de grau mínimo de mestre.
            // Revisão cega: revisor vê nome do estudante, estudante NÃO vê revisor.
            // RF: 033, 034, 035, 036, 037, 038, 039, 040, 061
            'reviewer' => [
                'description' => 'Revisor — avalia protocolos e preenche fichas de avaliação',
                'permissions' => [
                    'topic.review',             //Ver o tema, colocar comentarios e mais
                    'protocol.review',        // aceder ao protocolo para revisão
                    'protocol.evaluate',      // preencher ficha estruturada de avaliação (RF-036)
                    'evaluation.create',      // criar avaliação
                    'evaluation.accept',      // aceitar explicitamente avaliação final (obrigatório Bioética — RF-035)
                    'evaluation.harmonize',   // harmonizar com co-revisor (RF-034)
                    'evaluation.view',        // ver avaliações do processo (com identidade)
                    'document.view',          // ver documentos do protocolo em revisão
                    'workload.view',          // ver a própria fila de revisões
                ],
            ],

            // ── COORDINATOR ───────────────────────────────────────────────
            // Coordenador de curso: gere atribuição de revisores, defesas e BI.
            // Usa coordinator_profile → course + scientific_area.
            // RF: 026,027,033,057,058,059,064,065,066,072,073,074,075,076,077
            'coordinator' => [
                'description' => 'Coordenador — atribui revisores, gere defesas e relatórios',
                'permissions' => [
                    'protocol.view.all',
                    'protocol.assign',
                    'protocol.forward',
                    'protocol.return',
                    'protocol.approve',
                    'topic.view.all',
                    'topic.review',
                    'document.view.all',
                    'document.validate',
                    'evaluation.view.all',
                    'reviewer.manage',
                    'reviewer.assign',
                    'workload.view',
                    'workload.view.all',
                    'defense.view',
                    'defense.schedule',
                    'defense.jury.assign',
                    'defense.grade.record',
                    'defense.minutes.upload',
                    'monograph.view.all',
                    'monograph.validate',
                    'reports.view',
                    'reports.view.all',
                    'reports.export',
                ],
            ],

            // ── SECRETARY ─────────────────────────────────────────────────
            // Secretário do órgão (administrativo ou executivo).
            // Usa secretary_profile → organ_id.
            // A diferença administrativo/executivo é contextual (organ) — mesmas permissions.
            // RF: 041,042,043,044,045,046,047,051,052,053,060
            'secretary' => [
                'description' => 'Secretário — triagem documental e gestão administrativa do órgão',
                'permissions' => [
                    'protocol.view.all',
                    'protocol.triage',
                    'protocol.assign',
                    'protocol.forward',
                    'protocol.return',
                    'topic.view.all',
                    'document.view.all',
                    'document.validate',
                    'evaluation.view.all',
                    'reviewer.manage',
                    'reviewer.assign',
                    'workload.view.all',
                    'defense.view',
                    // 'defense.schedule',
                    'monograph.view.all',
                    'monograph.validate',
                    'reports.view',
                ],
            ],

            // ── ADMIN ─────────────────────────────────────────────────────
            // RF: 004, 005, 006
            'admin' => [
                'description' => 'Administrador — gere utilizadores, permissões e sistema',
                'permissions' => [
                    'admin.users',
                    'admin.organs',
                    'admin.reports',
                    'admin.roles',
                    'admin.settings',
                    'reports.view.all',
                    'reports.export',
                    'workload.view.all',
                ],
            ],
        ];

        foreach ($roles as $name => $data) {
            DB::table('roles')->updateOrInsert(
                ['name' => $name],
                [
                    'description' => $data['description'],
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]
            );

            $roleId = DB::table('roles')->where('name', $name)->value('id');

            foreach ($data['permissions'] as $code) {
                $permId = DB::table('permissions')->where('code', $code)->value('id');

                if (! $permId) {
                    //$this->command->warn("Permission não encontrada: {$code} (role: {$name}) — corre PermissionSeeder primeiro.");
                    continue;
                }

                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $roleId, 'permission_id' => $permId],
                    ['created_at' => $now, 'updated_at' => $now]
                );
            }
        }

        // $this->command->info('Roles e permissions carregadas com sucesso.');
    }
}
