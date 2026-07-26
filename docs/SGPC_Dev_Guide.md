# SGPC-ISCISA — Guia de Implementação para Programadores

> **Stack:** Laravel 11 (PHP) · React.js · PostgreSQL · MinIO · Laravel Queues  
> **Período:** 10 Jun → 24 Jul 2026 · **Metodologia:** Scrum (sprints semanais)  
> **Arquitectura:** Monolítica em camadas · MVC + Service Layer + Repository Pattern

---

## Índice

1. [Visão Geral da Arquitectura](#1-visão-geral-da-arquitectura)
2. [Fluxo de Negócio (Estado da Máquina)](#2-fluxo-de-negócio-estado-da-máquina)
3. [Módulos e Estrutura de Pastas](#3-módulos-e-estrutura-de-pastas)
4. [Backlog por Sprint](#4-backlog-por-sprint)
5. [User Stories com Critérios de Validação](#5-user-stories-com-critérios-de-validação)
6. [Regras de Negócio (Blockers)](#6-regras-de-negócio-blockers)
7. [Controlo de Acesso (RBAC)](#7-controlo-de-acesso-rbac)
8. [API Endpoints por Módulo](#8-api-endpoints-por-módulo)
9. [Modelo de Dados (Tabelas Chave)](#9-modelo-de-dados-tabelas-chave)
10. [Eventos e Notificações](#10-eventos-e-notificações)
11. [Critérios de Aceitação por Entrega](#11-critérios-de-aceitação-por-entrega)
12. [Checklist de Definition of Done](#12-checklist-de-definition-of-done)

---

## 1. Visão Geral da Arquitectura

```
┌─────────────────────────────────────────────────┐
│              React SPA (Frontend)               │
│   React Router · Axios · Tailwind · Context API │
└──────────────────────┬──────────────────────────┘
                       │ REST JSON (JWT)
┌──────────────────────▼──────────────────────────┐
│            Laravel API (Backend)                │
│  Routes → Middleware → Controller → Service     │
│              ↓             ↓                    │
│         Repository      Events/Listeners        │
│              ↓             ↓                    │
│          Eloquent       Laravel Queues          │
└──────┬───────────────────────────┬──────────────┘
       │                           │
┌──────▼──────┐           ┌────────▼────────┐
│ PostgreSQL  │           │  MinIO (files)  │
│  (dados)    │           │  (uploads)      │
└─────────────┘           └─────────────────┘
```

### Padrões a aplicar

| Padrão | Onde usar |
|--------|-----------|
| **Repository Pattern** | Acesso à BD — nunca queries directas no Controller |
| **Service Layer** | Toda a lógica de negócio vive nos Services |
| **State Machine** | Controlar transições do workflow (`StateMachine.php`) |
| **Observer / Events** | Notificações e logs disparados por eventos |
| **Policy (RBAC)** | Autorização em cada controller action |

---

## 2. Fluxo de Negócio (Estado da Máquina)

### 2.1 Estados do Protocolo

```
[RASCUNHO]
    │
    ▼ estudante submete tema
[TEMA_PENDENTE]
    │
    ▼ núcleo aprova tema
[TEMA_APROVADO]
    │
    ▼ estudante submete protocolo + aval supervisor
[AGUARDA_AVAL_SUPERVISOR]
    │
    ├─ supervisor rejeita ──────────────────► [DEVOLVIDO_SUPERVISOR]
    │                                               │
    ▼ supervisor aprova                             ▼ estudante corrige
[NO_NUCLEO]                               [AGUARDA_AVAL_SUPERVISOR]
    │
    ├─ núcleo devolve ──────────────────────► [DEVOLVIDO_NUCLEO]
    │                                               │
    ▼ núcleo aprova + emite parecer                 ▼ estudante resubmete
[NO_COMITE_CIENTIFICO]                    [NO_NUCLEO]
    │
    ├─ comité devolve ──────────────────────► [DEVOLVIDO_COMITE_CIENTIFICO]
    │                                               │
    ▼ comité aprova (harmonizado)                   ▼
[NO_COMITE_BIOETICA]
    │
    ├─ bioética devolve ────────────────────► [DEVOLVIDO_BIOETICA]
    │                                               │
    ▼ bioética aprova                               ▼
[APROVADO_PARA_CAMPO]
    │
    ▼ estudante conclui campo + submete monografia
[MONOGRAFIA_SUBMETIDA]
    │
    ▼ verificação administrativa
[EM_VERIFICACAO_ADMINISTRATIVA]
    │
    ├─ documentos rejeitados ───────────────► [PENDENCIA_ADMINISTRATIVA]
    │                                               │
    ▼ tudo aprovado                                 ▼ estudante resubmete
[AGUARDA_ALOCACAO_JURI]
    │
    ▼ coordenador aloca júri
[JURI_ALOCADO]
    │
    ▼ data confirmada por todos
[DEFESA_AGENDADA]
    │
    ▼ defesa realizada
[DEFESA_REALIZADA]
    │
    ▼ acta + nota registada
[CONCLUIDO] ◄── estado terminal
```

### 2.2 Transições permitidas (State Machine)

```php
// Modules/Protocol/Workflow/StateMachine.php
cconst TRANSITIONS = [
    'submit_topic'            => ['from' => 'draft',                       'to' => 'topic_pending'],
    'approve_topic'           => ['from' => 'topic_pending',               'to' => 'topic_approved'],
    'reject_topic'            => ['from' => 'topic_pending',               'to' => 'returned_to_department'],

    'submit_protocol'         => ['from' => 'topic_approved',              'to' => 'awaiting_supervisor_review'],

    'supervisor_approve'      => ['from' => 'awaiting_supervisor_review', 'to' => 'in_department'],
    'supervisor_reject'       => ['from' => 'awaiting_supervisor_review', 'to' => 'returned_by_supervisor'],

    'department_approve'      => ['from' => 'in_department',               'to' => 'in_scientific_committee'],
    'department_reject'       => ['from' => 'in_department',               'to' => 'returned_to_department'],

    'scientific_approve'      => ['from' => 'in_scientific_committee',     'to' => 'in_ethics_committee'],
    'scientific_reject'       => ['from' => 'in_scientific_committee',     'to' => 'returned_by_scientific_committee'],

    'ethics_approve'          => ['from' => 'in_ethics_committee',         'to' => 'approved_for_fieldwork'],
    'ethics_reject'           => ['from' => 'in_ethics_committee',         'to' => 'returned_by_ethics_committee'],

    'submit_thesis'           => ['from' => 'approved_for_fieldwork',      'to' => 'thesis_submitted'],

    'admin_approve'           => ['from' => 'under_administrative_review', 'to' => 'awaiting_jury_assignment'],

    'assign_jury'             => ['from' => 'awaiting_jury_assignment',    'to' => 'jury_assigned'],
    'confirm_date'            => ['from' => 'jury_assigned',               'to' => 'defense_scheduled'],
    'record_grade'            => ['from' => 'defense_completed',           'to' => 'completed'],
];
```

### 2.3 Fluxo de revisão no Comité de Bioética

```
Secretário aloca 2 revisores:
  - revisor_externo  (role_in_review = 'externo')
  - revisor_area     (role_in_review = 'harmonizador')

Passo 1: revisor_externo preenche ficha + submete decisão
         → status: 'avaliado_externo'

Passo 2: revisor_area vê avaliação do externo + harmoniza
         → status: 'harmonizado'

Passo 3: revisor_externo aceita/recusa harmonização
         → se ambos aceitam → status: 'validado'
         → se recusa → volta ao Passo 2

Passo 4: Secretário submete parecer final
         → transição de estado do protocolo
```

---

## 3. Módulos e Estrutura de Pastas

```
Modules/
├── Auth/
│   ├── Controllers/
│   │   ├── LoginController.php          # POST /login, POST /logout
│   │   └── PasswordController.php       # POST /forgot-password, POST /reset-password
│   ├── Services/
│   │   ├── AuthService.php              # login(), logout(), generateToken()
│   │   └── UserService.php              # createUser(), assignRole(), deactivate()
│   ├── Interfaces/
│   │   ├── AuthServiceInterface.php
│   │   └── UserServiceInterface.php
│   ├── Models/
│   │   ├── User.php                     # hasMany roles via pivot
│   │   └── Role.php
│   ├── Repositories/
│   │   └── UserRepository.php
│   ├── Database/Migrations/
│   │   ├── create_users_table.php
│   │   ├── create_roles_table.php
│   │   ├── create_permissions_table.php
│   │   ├── create_role_permissions_table.php
│   │   └── create_user_roles_table.php  # pivot: user ↔ role (multi-role)
│   ├── Routes/api.php
│   └── Events/UserLoggedIn.php

├── Protocol/
│   ├── Controllers/
│   │   ├── TopicController.php          # validação de tema
│   │   ├── ProtocolController.php       # CRUD protocolo
│   │   └── SubmissionController.php     # submissão + histórico versões
│   ├── Services/
│   │   ├── ProtocolService.php
│   │   ├── SubmissionService.php
│   │   └── SupervisorValidationService.php
│   ├── Workflow/
│   │   ├── WorkflowService.php          # advance(), revert(), getAvailableTransitions()
│   │   └── StateMachine.php             # TRANSITIONS map + validate()
│   ├── Review/
│   │   ├── BlindReviewService.php       # alocação + anonimização
│   │   ├── ReviewRepository.php
│   │   └── HarmonizationService.php    # lógica específica da Bioética
│   ├── Notifications/
│   │   └── NotificationService.php
│   ├── Events/
│   │   ├── ProtocolSubmitted.php
│   │   ├── ProtocolApproved.php
│   │   ├── ProtocolReturned.php
│   │   └── ReviewerAssigned.php
│   ├── Models/
│   │   ├── Protocol.php
│   │   ├── ProtocolVersion.php
│   │   ├── Topic.php
│   │   ├── Review.php
│   │   └── ReviewAssignment.php
│   ├── Repositories/
│   │   └── ProtocolRepository.php
│   └── Routes/api.php

├── Monograph/
│   ├── Controllers/
│   │   └── MonographController.php
│   ├── Services/
│   │   ├── MonographService.php
│   │   └── AdministrativeValidationService.php  # check financeiro + académico
│   ├── Integration/
│   │   └── ProtocolBridge.php           # reutiliza lógica do Protocol
│   ├── Documents/
│   │   └── DocumentService.php          # upload → MinIO, validar formato/páginas
│   ├── Models/
│   │   ├── Monograph.php
│   │   └── Document.php
│   └── Routes/api.php

├── Defense/
│   ├── Controllers/
│   │   └── DefenseController.php
│   ├── Services/
│   │   ├── DefenseService.php
│   │   ├── JuryService.php              # alocação + confirmação
│   │   └── ScheduleService.php          # sugestão de datas
│   ├── Scheduling/
│   │   └── ConflictResolver.php         # verifica sobreposição sala + júri
│   ├── BI/
│   │   ├── ReportService.php            # relatórios exportáveis PDF
│   │   └── MetricsService.php           # tempo médio, gargalos, carga
│   ├── Models/
│   │   ├── Defense.php
│   │   ├── JuryMember.php
│   │   ├── Room.php
│   │   └── RoomBooking.php
│   └── Routes/api.php

└── Shared/
    ├── Notifications/
    │   └── BaseNotification.php         # canal interno + email
    ├── Storage/
    │   └── MinIOService.php             # upload, download, delete
    ├── Logs/
    │   └── ActivityLogger.php           # regista tudo no activity_logs
    └── Policies/                        # um por recurso
        ├── ProtocolPolicy.php
        ├── MonographPolicy.php
        └── DefensePolicy.php
```

---


### US-003 — Submissão de tema
```
Como estudante
Quero submeter uma proposta de tema ao Núcleo Científico
Para validar originalidade antes de elaborar o protocolo

Critérios de validação:
  ✅ CA1: Campos obrigatórios: título, área científica, curso
  ✅ CA2: Sistema verifica títulos similares no banco de temas aprovados (fuzzy match)
  ✅ CA3: Se tema similar existe → alerta com lista dos temas similares (não bloqueia)
  ✅ CA4: Secretário do Núcleo recebe notificação imediata
  ✅ CA5: Estudante não pode submeter protocolo enquanto tema não for aprovado
  ✅ CA6: Estudante recebe notificação da decisão com justificação
```

### US-004 — Submissão de protocolo
```
Como estudante
Quero submeter o protocolo com aval do supervisor
Para iniciar o processo de avaliação no Núcleo Científico

Critérios de validação:
  ✅ CA1: Checklist dinâmico conforme tipo (licenciatura/mestrado/pesquisa independente)
  ✅ CA2: Só aceita .docx e .pdf → outros formatos → HTTP 422
  ✅ CA3: Página máxima configurável → alerta visual se exceder (não bloqueia upload)
  ✅ CA4: Submissão cria estado 'aguarda_aval_supervisor' → supervisor notificado
  ✅ CA5: Sem aval do supervisor → transição para 'no_nucleo' bloqueada
  ✅ CA6: Estudante pode cancelar antes do aval do supervisor
  ✅ CA7: Versão número incrementa a cada resubmissão
```

### US-005 — Aval do supervisor
```
Como supervisor
Quero aprovar ou rejeitar a submissão do meu estudante
Para garantir que só trabalhos prontos chegam ao Núcleo

Critérios de validação:
  ✅ CA1: Supervisor recebe notificação com link directo ao protocolo
  ✅ CA2: Pode: Aprovar | Rejeitar | Pedir correcções (com comentário)
  ✅ CA3: Decisão registada com timestamp + ID do supervisor
  ✅ CA4: Aprovação → estado transita para 'no_nucleo' automaticamente
  ✅ CA5: Rejeição → estudante notificado + motivo visível
  ✅ CA6: supervisor_validations.validated_at preenchido
```

### US-006 — Alocação de revisores
```
Como secretário do Comité Científico
Quero alocar 2 revisores a um protocolo
Para assegurar avaliação independente e equilibrada

Critérios de validação:
  ✅ CA1: Lista mostra só revisores activos do órgão (organ_reviewers.is_active = true)
  ✅ CA2: Mestrado → filtra só revisores com grau ≥ mestre (academic_profiles.academic_degree)
  ✅ CA3: Ao lado de cada revisor → número de revisões activas pendentes
  ✅ CA4: Não permite alocar o próprio supervisor do protocolo
  ✅ CA5: Revisores notificados com prazo = now() + organs.max_review_days
  ✅ CA6: review_assignments criados com deadline_at preenchido
```

### US-007 — Ficha de avaliação
```
Como revisor
Quero preencher a ficha de avaliação e submeter a minha decisão
Para registar formalmente o meu parecer

Critérios de validação:
  ✅ CA1: Acede ao protocolo (versão mais recente) directamente na plataforma
  ✅ CA2: Ficha mostra todos os critérios do órgão (evaluation_criteria filtrados por organ_id)
  ✅ CA3: Cada critério tem campo: status (conforme/não conforme/N/A) + comentário
  ✅ CA4: Pode fazer download do documento para revisão offline
  ✅ CA5: Decisão final: Aprovado | Corrigir | Rejeitado
  ✅ CA6: Após submissão → review_assignments.completed_at + duration_hours calculado
  ✅ CA7: Estudante recebe feedback SEM nome do revisor (is_anonymous = true)
```

### US-008 — Harmonização Bioética
```
Como revisor harmonizador (Comité de Bioética)
Quero harmonizar a avaliação após o revisor externo
Para produzir um parecer conjunto aceite por ambos

Critérios de validação:
  ✅ CA1: Revisor harmonizador só vê ficha do externo APÓS externo submeter
  ✅ CA2: Harmonizador pode editar campos + adicionar comentários de harmonização
  ✅ CA3: Após harmonização → revisor externo recebe notificação para aceitar/recusar
  ✅ CA4: Ambos aceitam → reviews.is_harmonized = true + harmonization_accepted_by preenchido
  ✅ CA5: Externo recusa → volta ao passo de harmonização
  ✅ CA6: Usa código (não nome) para identificar os revisores entre si
```

### US-009 — Verificação administrativa
```
Como secretário administrativo
Quero verificar conformidade financeira e académica
Para assegurar que só estudantes em regra avançam para defesa

Critérios de validação:
  ✅ CA1: Lista mostra monografias em 'monografia_submetida' aguardando verificação
  ✅ CA2: Pode aprovar/rejeitar cada documento individualmente
  ✅ CA3: administrative_checks.overall_status = 'aprovado' SÓ quando ambos aprovados
  ✅ CA4: Qualquer rejeição → estudante notificado com motivo imediatamente
  ✅ CA5: Estudante pode resubmeter documentos rejeitados (sem nova submissão)
  ✅ CA6: Histórico de todas as versões de documentos preservado
  ✅ CA7: Estado não avança sem overall_status = 'aprovado' (bloqueio hard no backend)
```

```php
// RB-001: Nenhuma submissão avança sem aval do supervisor
if (!$submission->supervisor_approved) {
    abort(403, 'Submissão requer aval do supervisor.');
}

// RB-002: Fluxo respeita ordem institucional
if (!$stateMachine->canTransition($submission->current_state, $targetState)) {
    abort(422, 'Transição inválida para o estado actual.');
}

// RB-003: Revisão é anónima — nunca expor reviewer_id ao estudante
// → Feito na API Resource (nunca incluir reviewer_id na response ao estudante)

// RB-004: Estudante não defende com pendências
if ($administrativeCheck->overall_status !== 'aprovado') {
    abort(403, 'Pendências administrativas por resolver.');
}

// RB-005: Histórico imutável
// → Nunca DELETE em workflow_transitions, reviews, comments, documents
// → Só soft-delete onde aplicável (users, organ_reviewers)
```

---

## 7. Controlo de Acesso (RBAC)

### Papéis e permissões

### Implementação (Laravel Policy)

```php
// Modules/Shared/Policies/ProtocolPolicy.php

public function advance(User $user, Protocol $protocol): bool
{
    // Secretário do órgão actual pode avançar
    return $user->hasPermissionTo('emit_opinion')
        && $user->organ_id === $protocol->current_organ_id;
}

public function review(User $user, Protocol $protocol): bool
{
    // Só o revisor alocado pode preencher a ficha
    return ReviewAssignment::where('submission_id', $protocol->id)
        ->where('reviewer_id', $user->id)
        ->where('completed_at', null)
        ->exists();
}
```


### Protocol

```
# Temas
POST   /api/topics                   # estudante: submeter tema
GET    /api/topics                   # secretário: listar temas pendentes
PATCH  /api/topics/{id}/approve      # secretário: aprovar
PATCH  /api/topics/{id}/reject       # secretário: rejeitar

# Protocolos
POST   /api/protocols                # estudante: submeter protocolo
GET    /api/protocols                # filtrado por papel
GET    /api/protocols/{id}
POST   /api/protocols/{id}/versions  # resubmissão com nova versão

# Aval supervisor
PATCH  /api/protocols/{id}/supervisor-validation

# Workflow
PATCH  /api/protocols/{id}/advance   # secretário: avançar estado
PATCH  /api/protocols/{id}/return    # secretário: devolver para correcção

# Revisores
POST   /api/protocols/{id}/assignments        # secretário: alocar revisores
POST   /api/protocols/{id}/reviews            # revisor: submeter avaliação
POST   /api/protocols/{id}/harmonize          # harmonizador: harmonizar
PATCH  /api/protocols/{id}/accept-harmonization  # externo: aceitar

# Documentos
POST   /api/protocols/{id}/documents          # upload documento
GET    /api/protocols/{id}/history            # histórico completo
```

