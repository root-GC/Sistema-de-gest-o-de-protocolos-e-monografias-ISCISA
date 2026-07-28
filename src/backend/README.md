# Núcleo Científico (NC) — Fluxo de Avaliação

## Visão Geral

**Dois revisores** analisam o protocolo de forma independente. Cada revisor submete:
- **decision**: `approved` | `not_approved`
- **criterion_reviews**: comentários para cada critério (28 critérios em 3 grupos)

Após ambos submeterem, o sistema decide:

| Condição | Resultado |
|---|---|
| Ambos `approved` | **Auto-Approve** — gera parecer, avança protocolo |
| Algum `not_approved` | **Deliberação Pendente** |

Em caso de deliberação, a secretaria marca data e local, os revisores iniciam a reunião e refinam/editam os comentários na mesma ficha.

---

## Rotas (NC)

Todas as rotas de avaliação do Núcleo estão sob `/api/v1/nucleo/`:

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
| GET | `secretary/evaluations` | Lista da secretaria | Secretaria |
| GET | `protocols/{protocol}/eligible-reviewers` | Revisores elegíveis | Secretaria |
| POST | `protocols/{protocol}/assign-reviewers` | Atribuir revisores | Secretaria |

---

## Endpoints

### 1. Submeter Avaliação Individual

```
POST /api/v1/nucleo/evaluation-forms/{form}/submit
```

**Payload:**
```json
{
  "reviewer_id": 42,
  "decision": "approved",
  "criterion_reviews": {
    "103": { "comment": "Bem estruturado" },
    "104": { "comment": "Adequado" }
  }
}
```

**Resposta (auto-approve):**
```json
{
  "message": "Protocolo aprovado e encaminhado ao Comité Científico.",
  "auto_approved": true,
  "deliberation_pending": false,
  "evaluation_form": {
    "id": 1,
    "status": "concluded",
    "auto_approved": true,
    "deliberation_pending": false,
    "protocol": { ... }
  },
  "opinion": { ... }
}
```

**Resposta (deliberação necessária):**
```json
{
  "message": "Avaliação submetida. Aguardando reunião de deliberação.",
  "auto_approved": false,
  "deliberation_pending": true,
  "evaluation_form": {
    "id": 1,
    "status": "deliberation_pending",
    "deliberation_pending": true,
    "protocol": { ... }
  }
}
```

**Resposta (pendente do outro revisor):**
```json
{
  "message": "Avaliação submetida com sucesso.",
  "auto_approved": false,
  "deliberation_pending": false,
  "evaluation_form": {
    "id": 1,
    "status": "in_review",
    "reviewer_evaluations": [
      { "reviewer_id": 42, "status": "submitted", "submitted_at": "..." },
      { "reviewer_id": 43, "status": "pending", "submitted_at": null }
    ]
  }
}
```

---

### 2. Marcar Deliberação (Secretaria)

```
POST /api/v1/nucleo/evaluation-forms/{form}/schedule-deliberation
```

**Payload:**
```json
{
  "deliberation_date": "2026-08-01 14:00",
  "deliberation_location": "Sala de Reuniões 2"
}
```

**Regras:**
- A ficha deve estar em `deliberation_pending`
- Apenas a secretaria pode marcar
- O status passa a `deliberation_scheduled`

**Resposta:**
```json
{
  "message": "Deliberação marcada com sucesso.",
  "evaluation_form": {
    "id": 1,
    "status": "deliberation_scheduled",
    "deliberation_date": "2026-08-01T14:00:00.000000Z",
    "deliberation_location": "Sala de Reuniões 2"
  }
}
```

---

### 3. Iniciar Deliberação (Revisor)

```
POST /api/v1/nucleo/evaluation-forms/{form}/start-deliberation
```

**Regras:**
- A ficha deve estar em `deliberation_scheduled`
- Apenas um revisor atribuído pode iniciar
- Faz merge dos comentários: copia os comentários do segundo revisor para o primeiro, separados por `---`, e apaga os do segundo
- O status passa a `in_deliberation`
- A partir daqui, ambos os revisores editam os MESMOS comentários (partilhados no first reviewer)

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

### 4. Submeter Deliberação (Revisor)

```
POST /api/v1/nucleo/evaluation-forms/{form}/submit-deliberation
```

**Payload:**
```json
{
  "decision": "approved",
  "conclusion_summary": "Após análise e discussão, o Núcleo aprova o protocolo."
}
```

**Regras:**
- A ficha deve estar em `in_deliberation`
- Qualquer revisor pode submeter a decisão final
- Marca ambas as `ReviewerEvaluation` como `submitted`
- Gera parecer PDF automaticamente

**Resposta:**
```json
{
  "message": "Protocolo aprovado e encaminhado ao Comité Científico.",
  "evaluation_form": {
    "id": 1,
    "status": "concluded",
    "final_decision": "approved"
  },
  "opinion": {
    "id": 5,
    "decision": "approved",
    "issued_at": "2026-08-01T15:30:00.000000Z",
    "download_url": "/api/v1/opinions/5/download"
  }
}
```

---

### 5. Auto-Save de Critérios

```
POST /api/v1/nucleo/evaluation-forms/{form}/criteria/{formCriterion}/review
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
- `in_deliberation`: ambos guardam no `ReviewerEvaluation` do primeiro revisor (partilhado)

---

### 6. Visualizar Ficha

```
GET /api/v1/nucleo/evaluation-forms/{form}?reviewer_id=42
```

A resposta inclui:
- `status`, `auto_approved`, `deliberation_pending`, `deliberation_scheduled`, `in_deliberation`
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
      { "reviewer_id": 42, "reviewer_name": "Dr. João", "comment": "Bem definido e claro." },
      { "reviewer_id": 43, "reviewer_name": "Dra. Maria", "comment": "Poderia ser mais específico." }
    ]
  }
]
```

---

### 7. Decisão Final (Secretaria)

```
POST /api/v1/nucleo/evaluation-forms/{form}/decide
```

Usado quando a secretaria precisa de intervir manualmente (casos excepcionais).

---

## Regras de Visibilidade

| Role | Vê decisões individuais? | Vê comentários do outro? | Vê `criteria_comments`? |
|---|---|---|---|
| Revisor | Sim | Sim | Sim (diálogo) |
| Secretaria | Não (só `submitted` / `null`) | Não | Não |
| Estudante | Não (só parecer final) | Não | Não |

---

## Fluxo Completo (NC)

```
Secretaria atribui 2 revisores
        │
        ▼
  Cria ficha de avaliação (form_type=evaluation)
  Cada revisor avalia (28 critérios + decision)
        │
        ▼
  Ambos submeteram?
        │
        ├── Não ──► Aguarda
        │
        └── Sim ──► Algum not_approved?
                        │
                        ├── Não ──► Auto-Approve (parecer + avança)
                        │
                        └── Sim ──► deliberation_pending
                                      │
                                      ▼
                              Secretaria: schedule-deliberation
                              (data + local)
                                      │
                                      ▼
                              deliberation_scheduled
                                      │
                                      ▼
                              Revisor: start-deliberation
                              (merge comentários)
                                      │
                                      ▼
                              in_deliberation
                              (comentários partilhados)
                                      │
                                      ▼
                              Revisores refinam/editam
                                      │
                                      ▼
                              Revisor: submit-deliberation
                                      │
                                      ├── approved ──► Avança + parecer
                                      │
                                      └── not_approved ──► Rejeita + parecer
```