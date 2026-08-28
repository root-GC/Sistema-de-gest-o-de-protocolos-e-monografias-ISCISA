# Implementação do Sistema de Avaliação de Protocolos

## Módulo Protocol — Núcleo Científico

---

## 1. Objectivo

Implementar o sistema de avaliação de protocolos científicos no Núcleo Científico, permitindo que dois revisores avaliem um protocolo através de uma ficha de avaliação digital com critérios estruturados, e que qualquer um dos revisores possa tomar a decisão final (Aprovado/Reprovado), gerando automaticamente o parecer final.

---

## 2. Arquitectura

```
Protocol
 └── version (NC_V1)
      └── EvaluationForm (1 ficha por versão/órgão)
           ├── EvaluationFormCriteria (snapshot dos critérios)
           │    └── EvaluationCriterionReviews (comentários de cada revisor)
           ├── ReviewerEvaluation (1 por revisor: recomendação + comentário geral)
           └── Opinion (parecer final após decisão)
                └── document_path (PDF gerado)
```

### Fluxo de estados

```
assign-reviewers
  → protocol_in_review_nucleo
  → EvaluationForm (pending_review)
  → revisor preenche critérios (in_progress)
  → revisor submete (submitted → form: in_review)
  → qualquer revisor decide (concluded)
      ├─ approved → protocol_pending_comite_cientifico
      └─ rejected → protocol_rejected_final
      └─ Opinion gerada
```

---

## 3. Base de Dados — 6 Novas Tabelas

### `evaluation_criteria`
Template global de critérios de avaliação. Populado pelo seeder.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK | |
| group_name | VARCHAR | "Elementos Pré-Textuais", "Textuais", "Pós-Textuais" |
| name | VARCHAR | "Introdução", "Objectivos"... |
| order_column | INT | Ordem de apresentação |
| is_active | BOOLEAN | Activar/desactivar critério |

**Seeder**: 28 critérios extraídos da ficha oficial do Comité Científico do ISCISA.

### `evaluation_forms`
Uma ficha por par (protocolo, versão, órgão).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK | |
| protocol_id | FK→protocols | Protocolo avaliado |
| version | VARCHAR | Versão do protocolo à data da criação |
| organ | VARCHAR | "nucleo", "comite_cientifico", "comite_bioetica" |
| status | VARCHAR | pending_review → in_review → concluded |
| final_decision | VARCHAR NULL | approved / rejected |
| decided_by | FK→users NULL | Quem decidiu |
| decided_at | TIMESTAMP NULL | Quando decidiu |
| conclusion_summary | TEXT NULL | Resumo da conclusão |

**Unique**: `(protocol_id, version, organ)`

### `evaluation_form_criteria`
Snapshot dos critérios no momento da criação da ficha.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK | |
| evaluation_form_id | FK→evaluation_forms | |
| criterion_id | FK→evaluation_criteria | |
| group_name | VARCHAR | Congelado do template |
| criterion_name | VARCHAR | Congelado do template |
| order_column | INT | |

**Unique**: `(evaluation_form_id, criterion_id)`

### `reviewer_evaluations`
Avaliação completa de cada revisor.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK | |
| evaluation_form_id | FK→evaluation_forms | |
| protocol_review_assignment_id | FK→protocol_review_assignments | |
| reviewer_id | FK→teacher_profiles | |
| overall_comment | TEXT NULL | Comentário geral do revisor |
| recommendation | VARCHAR NULL | approved / rejected |
| status | VARCHAR | pending → in_progress → submitted |
| submitted_at | TIMESTAMP NULL | |

**Unique**: `(evaluation_form_id, reviewer_id)`

### `evaluation_criterion_reviews`
Comentário do revisor para cada critério individual.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK | |
| reviewer_evaluation_id | FK→reviewer_evaluations | |
| evaluation_form_criterion_id | FK→evaluation_form_criteria | |
| comment | TEXT NULL | Apenas comentário (sem score/parecer) |

**Unique**: `(reviewer_evaluation_id, evaluation_form_criterion_id)`

### `opinions`
Parecer final gerado após decisão.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK | |
| protocol_id | FK→protocols | |
| evaluation_form_id | FK→evaluation_forms NULL | |
| version | VARCHAR | Versão do protocolo |
| organ | VARCHAR | Órgão que emitiu |
| decision | VARCHAR | approved / rejected |
| observations | TEXT NULL | |
| issued_by | FK→users NULL | |
| issued_at | TIMESTAMP | |
| document_path | VARCHAR NULL | Caminho do PDF gerado |

**Unique**: `(protocol_id, version, organ)`

---

## 4. Models Criados (6)

| Model | Namespace | Funcionalidade |
|-------|-----------|----------------|
| `EvaluationCriterion` | `Modules\Protocol\app\Models` | Template de critério (soft deletes, scope active/ordered) |
| `EvaluationForm` | `Modules\Protocol\app\Models` | Ficha de avaliação (status constants, relations) |
| `EvaluationFormCriterion` | `Modules\Protocol\app\Models` | Snapshot de critério (belongsTo form + criterion) |
| `ReviewerEvaluation` | `Modules\Protocol\app\Models` | Avaliação do revisor (status constants, relations) |
| `EvaluationCriterionReview` | `Modules\Protocol\app\Models` | Comentário por critério (belongsTo evaluation + formCriterion) |
| `Opinion` | `Modules\Protocol\app\Models` | Parecer final (soft deletes, relations) |

---

## 5. Services Criados (2)

### `EvaluationService`

| Método | Descrição |
|--------|-----------|
| `createForProtocol(Protocol, array $reviewerIds, User $secretary, string $organ)` | Cria ficha + snapshot critérios + reviewer evaluations |
| `getFormWithReviews(EvaluationForm, User)` | Carrega ficha com todas as relações |
| `saveCriterionReview(EvaluationForm, EvaluationFormCriterion, User, ?string $comment)` | Guarda/actualiza comentário de critério; auto-transita para in_progress |
| `submitEvaluation(EvaluationForm, User, string $recommendation, ?string $overallComment)` | Submete avaliação do revisor (valida preenchimento mínimo) |
| `decide(EvaluationForm, User, string $decision, ?string $conclusionSummary)` | Decisão final; transita protocolo; cria Opinion |
| `listForReviewer(User)` | Lista fichas atribuídas ao revisor |
| `listForSecretary(User)` | Lista fichas do núcleo para secretaria |

### `DocumentGenerationService`

| Método | Descrição |
|--------|-----------|
| `generateOpinionPdf(Opinion)` | Gera PDF do parecer final a partir do template Blade |
| `generateEvaluationFormPdf(EvaluationForm)` | Gera PDF da ficha de avaliação completa |

Requer `barryvdh/laravel-dompdf` para funcionar.

---

## 6. Endpoints REST

### Avaliação

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/evaluation-forms/{form}` | Ver ficha com critérios e avaliações |
| POST | `/api/v1/evaluation-forms/{form}/criteria/{formCriterion}/review` | Registar comentário de critério |
| POST | `/api/v1/evaluation-forms/{form}/submit` | Submeter avaliação do revisor |
| POST | `/api/v1/evaluation-forms/{form}/decide` | Decisão final (qualquer revisor) |
| GET | `/api/v1/reviewer/evaluations` | Listar fichas do revisor autenticado |
| GET | `/api/v1/secretary/evaluations` | Listar fichas do núcleo |

### Ficheiros adicionados/modificados

**Novos**:
- `Routes:api.php` — 6 rotas adicionadas com `EvaluationFormController`
- `ProtocolService.assignReviewers()` — passou a criar `EvaluationForm` automaticamente após atribuir revisores
- `ProtocolServiceProvider` — registado `EvaluationService`, `EvaluationFormPolicy`, `loadViews`

---

## 7. Regras de Negócio Implementadas

1. A ficha de avaliação é criada **automaticamente** quando a secretaria atribui revisores (`assign-reviewers`)
2. Os critérios são copiados do template global no momento da criação (snapshot)
3. Cada revisor tem a sua própria `ReviewerEvaluation` — comentários, recomendação e estado independentes
4. Os comentários dos critérios **não têm score/parecer** — apenas texto
5. Ao submeter, valida-se que existe pelo menos 1 comentário preenchido
6. **Qualquer** revisor atribuído pode tomar a decisão final (`/decide`), sem necessidade de ambos terem submetido
7. A decisão final transita o protocolo: `approved → protocol_pending_comite_cientifico`, `rejected → protocol_rejected_final`
8. Quando o núcleo aprova e encaminha para o comitê, a versão do protocolo passa de `NC_V{submission_number}` para `CC_V01`
9. Após a decisão, é criado um registo `Opinion` com os dados estruturados para posterior geração de PDF
10. O parecer é gerado a partir de template Blade + dados (não guarda o documento na BD — apenas o caminho)

---

## 8. Templates Blade para PDF

### `resources/views/pdf/parecer-final.blade.php`
Template do parecer final com:
- Cabeçalho institucional (ISCISA + órgão)
- Dados do protocolo (código, título, proponente, orientador, curso, versão)
- Texto da decisão com texto condicional (aprovado vs reprovado)
- Campo de observações
- Tabela de assinaturas (Presidente + 2 membros)
- Local e data

### `resources/views/pdf/ficha-avaliacao.blade.php`
Template da ficha de avaliação completa:
- Cabeçalho institucional do órgão avaliador
- Dados do protocolo e estudante
- Tabela de critérios agrupados por tipo (Pré-Textuais, Textuais, Pós-Textuais)
- Comentários de cada revisor por critério
- Recomendação individual de cada revisor
- Decisão final destacada

---

## 9. Ficheiros Criados (28)

```
database/migrations/
├── 2026_07_09_000001_create_evaluation_criteria_table.php
├── 2026_07_09_000002_create_evaluation_forms_table.php
├── 2026_07_09_000003_create_evaluation_form_criteria_table.php
├── 2026_07_09_000004_create_reviewer_evaluations_table.php
├── 2026_07_09_000005_create_evaluation_criterion_reviews_table.php
└── 2026_07_09_000006_create_opinions_table.php

database/seeders/
├── EvaluationCriteriaSeeder.php (28 critérios em 3 grupos)
└── ProtocolDatabaseSeeder.php   (actualizado)

app/Models/
├── EvaluationCriterion.php
├── EvaluationForm.php
├── EvaluationFormCriterion.php
├── ReviewerEvaluation.php
├── EvaluationCriterionReview.php
└── Opinion.php

app/Services/
├── EvaluationService.php
└── DocumentGenerationService.php

app/Http/Controllers/
└── EvaluationFormController.php

app/Http/Requests/
├── SubmitCriterionReviewRequest.php
├── SubmitEvaluationRequest.php
└── DecideEvaluationRequest.php

app/Http/Resources/
├── EvaluationCriteriaResource.php
├── EvaluationFormCriterionResource.php
├── EvaluationCriterionReviewResource.php
├── EvaluationFormResource.php
└── ReviewerEvaluationResource.php

app/Policies/
└── EvaluationFormPolicy.php

resources/views/pdf/
├── parecer-final.blade.php
└── ficha-avaliacao.blade.php
```

## Ficheiros Modificados (3)

```
routes/api.php              → +6 rotas de avaliação + import EvaluationFormController
app/Services/ProtocolService.php → assignReviewers() cria EvaluationForm
app/Providers/ProtocolServiceProvider.php → bindings, policy, views
```

---

## 10. Comandos para Activar

```bash
# Correr migrações do módulo
php artisan module:migrate Protocol

# Popular critérios de avaliação
php artisan module:seed Protocol

# Instalar pacote para geração de PDF (quando necessário)
composer require barryvdh/laravel-dompdf
```

---

## 11. Exemplos de Uso (API)

### Ver ficha de avaliação
```bash
curl -X GET http://127.0.0.1:8000/api/v1/evaluation-forms/1 \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

### Registar comentário de critério
```bash
curl -X POST http://127.0.0.1:8000/api/v1/evaluation-forms/1/criteria/5/review \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"comment": "A introdução está bem estruturada, mas falta contextualizar o problema."}'
```

### Submeter avaliação
```bash
curl -X POST http://127.0.0.1:8000/api/v1/evaluation-forms/1/submit \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"recommendation": "approved", "overall_comment": "Protocolo bem elaborado, metodologia adequada."}'
```

### Decidir (qualquer revisor)
```bash
curl -X POST http://127.0.0.1:8000/api/v1/evaluation-forms/1/decide \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"decision": "approved", "conclusion_summary": "O protocolo reúne os requisitos científicos e metodológicos exigidos."}'
```

### Listar fichas do revisor
```bash
curl -X GET http://127.0.0.1:8000/api/v1/reviewer/evaluations \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```
