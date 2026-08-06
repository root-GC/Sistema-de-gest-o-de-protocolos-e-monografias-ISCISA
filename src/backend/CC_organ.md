# Comité Científico (CC) — Fluxo de Avaliação

## Visão Geral

No CC, **dois revisores** (apenas membros do comité) analisam o protocolo de forma independente. Cada revisor submete:
- **decision**: `approved` | `not_approved`
- **criterion_reviews**: comentários para cada critério (28 critérios em 3 grupos)

**Diferença do NC:** No CC **não há auto-approve**. Após ambos submeterem, a deliberação é **sempre obrigatória**.

---

## Rotas (CC)

Todas as rotas de avaliação do Comité Científico estão sob `/api/v1/comite-cientifico/`:

| Método | Rota | Acção | Quem |
|---|---|---|---|
| GET | `evaluation-forms/{form}` | Visualizar ficha | Revisor / Secretaria |
| POST | `evaluation-forms/{form}/criteria/{c}/review` | Guardar comentário | Revisor |
| POST | `evaluation-forms/{form}/submit` | Submeter avaliação | Revisor |
| POST | `evaluation-forms/{form}/schedule-deliberation` | Marcar data/local | Secretaria |
| POST | `evaluation-forms/{form}/start-deliberation` | Iniciar reunião | Revisor |
| POST | `evaluation-forms/{form}/submit-deliberation` | Submeter decisão final | Revisor |
| POST | `evaluation-forms/{form}/decide` | Decisão manual | Secretaria |
| GET | `reviewer/evaluations` | Lista do revisor | Revisor |
| GET | `reviewer/works` | Lista combinada (temas + protocolos) | Revisor |
| GET | `secretary/evaluations` | Lista da secretaria | Secretaria |
| GET | `protocols/{protocol}/eligible-reviewers` | Revisores elegíveis | Secretaria |
| GET | `protocols/{protocol}/reviewers` | Ver revisores atribuídos | Secretaria |
| POST | `protocols/{protocol}/assign-reviewers` | Atribuir revisores | Secretaria |

---

## Endpoints

### 1. Listar Revisores Elegíveis (Secretaria)

```
GET /api/v1/comite-cientifico/protocols/{protocol}/eligible-reviewers
Auth: Secretaria do CC (perm=protocol.assign)
```

**Resposta:**
```json
{
  "reviewers": [
    {
      "id": 42,
      "name": "Dr. Joao Silva",
      "email": "joao@email.com",
      "active_works": 3
    },
    {
      "id": 43,
      "name": "Dra. Maria Santos",
      "email": "maria@email.com",
      "active_works": 1
    }
  ]
}
```

**Campos:**
- `id` — ID do `teacher_profiles`
- `name` — Nome do utilizador
- `email` — Email do utilizador
- `active_works` — **Carga de trabalho actual** (quantos trabalhos pendentes este revisor tem)

**Cálculo de `active_works`:**
- **Temas** atribuídos (`TopicReviewAssignment`) com status `topic_assigned_for_review` ou `topic_in_review`
- **Protocolos** atribuídos (`ReviewerEvaluation`) com ficha de avaliação em status `pending_review` ou `in_review`

> A secretaria vê a carga para decidir se o revisor tem disponibilidade.

---

### 2. Ver Revisores Atribuídos (Secretaria)

```
GET /api/v1/comite-cientifico/protocols/{protocol}/reviewers
Auth: Secretaria do CC (perm=protocol.assign)
```

**Resposta:**
```json
{
  "reviewers": [ ... ],
  "review_assignments": [
    {
      "id": 1,
      "reviewer_one": { "id": 42, "name": "Dr. Joao Silva" },
      "reviewer_two": { "id": 43, "name": "Dra. Maria Santos" },
      "status": "pending",
      "assigned_at": "2026-07-25T10:00:00.000000Z"
    }
  ]
}
```

---

### 3. Atribuir Revisores (Secretaria)

```
POST /api/v1/comite-cientifico/protocols/{protocol}/assign-reviewers
Auth: Secretaria do CC (perm=protocol.assign)
```

**Payload:**
```json
{
  "reviewer_one_id": 42,
  "reviewer_two_id": 43
}
```

**Acções:**
1. Cria `ProtocolReviewAssignment`
2. Actualiza protocolo para `protocol_in_review_comite_cientifico`
3. Cria ficha de avaliação (`EvaluationForm`) com `organ = 'comite_cientifico'` e `form_type = 'evaluation'`

---

### 4. Listar Trabalhos do Revisor (CC)

```
GET /api/v1/comite-cientifico/reviewer/works
Auth: Revisor (perm=protocol.evaluate)
```

Devolve **todos os trabalhos pendentes** do revisor logado: temas + protocolos de avaliação.

**Resposta:**
```json
{
  "works": {
    "topics": [
      {
        "id": 5,
        "title": "Impacto da IA na Saude",
        "status": "topic_assigned_for_review",
        "my_assignment": { "id": 10, "status": "pending" }
      }
    ],
    "evaluations": [
      {
        "id": 3,
        "form_type": "evaluation",
        "status": "pending_review",
        "organ": "comite_cientifico",
        "protocol": { "id": 12, "code": "CC_V01" },
        "reviewer_evaluations": [ ... ]
      }
    ]
  },
  "total_active": 2
}
```

**Notas:**
- A lista inclui **apenas trabalhos não concluídos**
- `topics` = temas atribuídos via `TopicReviewAssignment`
- `evaluations` = fichas de avaliação de protocolo atribuídas via `ReviewerEvaluation`

---

### 5. Submeter Avaliação Individual

```
POST /api/v1/comite-cientifico/evaluation-forms/{form}/submit
Auth: Revisor (perm=protocol.evaluate)
```

**Payload:**
```json
{
  "reviewer_id": 42,
  "decision": "approved",
  "criterion_reviews": {
    "103": { "comment": "Bem estruturado" }
  }
}
```

Após **ambos** submeterem, o sistema muda automaticamente para `deliberation_pending` (nunca auto-approve no CC).

---

### 6. Marcar Deliberação (Secretaria)

```
POST /api/v1/comite-cientifico/evaluation-forms/{form}/schedule-deliberation
Auth: Secretaria (perm=protocol.assign)
```

**Payload:**
```json
{
  "deliberation_date": "2026-08-01 14:00",
  "deliberation_location": "Sala de Reuniões CC"
}
```

**Regras:**
- A ficha deve estar em `deliberation_pending`
- Apenas a secretaria pode marcar
- Guarda `deliberation_date`, `deliberation_location`, `deliberation_scheduled_by`
- Status passa a `deliberation_scheduled`

---

### 7. Iniciar Deliberação (Revisor)

```
POST /api/v1/comite-cientifico/evaluation-forms/{form}/start-deliberation
Auth: Revisor (perm=protocol.evaluate)
```

**Regras:**
- A ficha deve estar em `deliberation_scheduled`
- Apenas um revisor atribuído pode iniciar
- Faz merge dos comentários: copia os do segundo revisor para o primeiro (separados por `---`), apaga os do segundo
- A partir daqui, ambos os revisores editam os **mesmos** comentários (partilhados)
- Status passa a `in_deliberation`

**Resposta:**
```json
{
  "message": "Reunião de deliberação iniciada.",
  "evaluation_form": {
    "id": 1,
    "status": "in_deliberation",
    "in_deliberation": true,
    "criteria_comments": [
      {
        "criterion_name": "Clareza do problema",
        "group_name": "Introdução",
        "reviews": [
          { "reviewer_name": "Dr. João", "comment": "Bem definido.\n---\nPoderia ser mais específico." }
        ]
      }
    ]
  }
}
```

---

### 8. Submeter Deliberação (Revisor)

```
POST /api/v1/comite-cientifico/evaluation-forms/{form}/submit-deliberation
Auth: Revisor (perm=protocol.evaluate)
```

**Payload:**
```json
{
  "decision": "approved",
  "conclusion_summary": "Após análise e discussão, o CC aprova o protocolo."
}
```

**Regras:**
- A ficha deve estar em `in_deliberation`
- Qualquer revisor pode submeter a decisão final
- Marca ambas as `ReviewerEvaluation` como `submitted`
- Gera parecer PDF (+ ficha de avaliação PDF)

**Resposta:**
```json
{
  "message": "Protocolo aprovado e encaminhado ao Comité de Bioética.",
  "evaluation_form": {
    "id": 1,
    "status": "concluded",
    "final_decision": "approved"
  },
  "opinion": {
    "id": 5,
    "decision": "approved",
    "download_url": "/api/v1/opinions/5/download",
    "evaluation_form_download_url": "/api/v1/evaluation-forms/1/download"
  }
}
```

---

### 9. Auto-Save de Critérios

```
POST /api/v1/comite-cientifico/evaluation-forms/{form}/criteria/{formCriterion}/review
Auth: Revisor (perm=protocol.evaluate)
```

**Payload:**
```json
{
  "reviewer_id": 42,
  "comment": "Parcial"
}
```

**Comportamento por estado:**
- `pending_review` / `in_review`: cada revisor guarda no seu `ReviewerEvaluation` (individual)
- `deliberation_scheduled`: ainda visível, mas só leitura (ou edição até iniciar?)
- `in_deliberation`: ambos guardam no `ReviewerEvaluation` do primeiro revisor (partilhado)

---

### 10. Visualizar Ficha

```
GET /api/v1/comite-cientifico/evaluation-forms/{form}?reviewer_id=42
```

A resposta inclui:
- `status`, `deliberation_pending`, `deliberation_scheduled`, `in_deliberation`
- `deliberation_date`, `deliberation_location`
- `form_criteria[]` — todos os 28 critérios
- `reviewer_evaluations[]` — avaliações de cada revisor (secretaria vê só status e submitted_at)
- `criteria_comments[]` — agrupado por critério, com comentários de cada revisor (diálogo)

**Exemplo de `criteria_comments`:**
```json
"criteria_comments": [
  {
    "criterion_id": 1,
    "criterion_name": "Clareza do problema",
    "group_name": "Introdução",
    "order_column": 1,
    "reviews": [
      { "reviewer_id": 42, "reviewer_name": "Dr. João", "comment": "Bem definido." },
      { "reviewer_id": 43, "reviewer_name": "Dra. Maria", "comment": "Específico." }
    ]
  }
]
```

---

## Regras de Visibilidade

| Role | Vê decisões individuais? | Vê comentários do outro? |
|---|---|---|
| Revisor | Sim | Sim (diálogo) |
| Secretaria | Não (só `submitted` / `null`) | Não |
| Estudante | Não (só parecer final) | Não |

---

## Fluxo Completo (CC)

```
Protocolo aprovado pelo Núcleo
        │
        ▼
  Secretaria atribui 2 revisores (só membros do CC)
        │
        ▼
  Cada revisor avalia (28 critérios + decision)
        │
        ▼
  Ambos submeteram?
        │
        ├── Não ──► Aguarda
        │
        └── Sim ──► deliberation_pending (SEMPRE)
                      │
                      ▼
              Secretaria: POST schedule-deliberation
              { deliberation_date, deliberation_location }
                      │
                      ▼
              deliberation_scheduled
                      │
                      ▼
              Revisor: POST start-deliberation
              (merge comentários 2º → 1º)
                      │
                      ▼
              in_deliberation
              (comentários partilhados)
                      │
                      ▼
              Revisores refinam/editam
                      │
                      ▼
              Revisor: POST submit-deliberation
                      │
                      ├── approved ──► Bioética + parecer
                      │
                      └── not_approved ──► Rejeita + parecer
```

---

## Regras de Negócio

1. **Apenas membros do CC** (via `organ_members`) podem ser revisores.
2. **Carga de trabalho** (`active_works`) inclui temas + protocolos pendentes.
3. **Supervisor** do protocolo é excluído da lista de elegíveis.
4. **Revisores já atribuídos** a este protocolo no CC são excluídos.
5. **Não há auto-approve no CC** — após ambos submeterem, a deliberação é obrigatória.
6. **A deliberação não cria ficha nova** — os comentários são refinados na mesma ficha original.
7. Durante `in_deliberation`, os comentários são **partilhados** (ambos editam os mesmos).
8. **Qualquer revisor** pode submeter a decisão final.
9. Após a deliberação, são gerados **parecer PDF** + **ficha de avaliação PDF**.

---

## Modelo de Dados

```
Organ (type = 'scientific_committee')
    │
    ├── OrganMember (user_id → User → TeacherProfile)
    └── SecretaryProfile (organ_id)

EvaluationForm
    ├── organ = 'comite_cientifico'
    ├── form_type = 'evaluation' (apenas, sem ficha de deliberação separada)
    ├── status = 'pending_review' | 'in_review' | 'deliberation_pending'
    │         | 'deliberation_scheduled' | 'in_deliberation' | 'concluded'
    ├── deliberation_date (datetime, nullable)
    ├── deliberation_location (string, nullable)
    ├── deliberation_scheduled_by → users (nullable)
    ├── protocol_id → Protocol
    └── reviewerEvaluations → ReviewerEvaluation
```

---

## Ficheiros

| Ficheiro | Descrição |
|---|---|
| `app/Services/EvaluationService.php` | Lógica: scheduleDeliberation, startDeliberation (merge), submitDeliberation |
| `app/Http/Controllers/EvaluationFormController.php` | Endpoints partilhados NC/CC |
| `app/Http/Controllers/ComiteCientificoController.php` | reviewerWorks |
| `app/Http/Resources/EvaluationFormResource.php` | criteria_comments, deliberation_date, deliberation_scheduled, in_deliberation |
| `app/Models/EvaluationForm.php` | STATUS_DELIBERATION_SCHEDULED, deliberation_* fillable |
| `routes/api.php` | Rotas separadas NC e CC |