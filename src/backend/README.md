# Núcleo Científico (NC) — Fluxo de Avaliação

## Visão Geral

**Dois revisores** analisam o protocolo de forma independente. Cada revisor submete:
- **decision**: `approved` | `not_approved`
- **criterion_reviews**: comentários para cada critério (28 critérios em 3 grupos)

Após ambos submeterem, o sistema decide:

| Condição | Resultado |
|---|---|
| Ambos `approved` + ninguém marcou `needs_deliberation` | **Auto-Approve** — gera parecer, avança protocolo |
| Alguém marcou `needs_deliberation` ou `not_approved` | **Deliberation Pending** |

Em caso de deliberação pendente, a secretaria cria uma ficha de deliberação e os revisores decidem após reunião.

---

## Rotas (NC)

Todas as rotas de avaliação do Núcleo estão sob `/api/v1/nucleo/`:

| Método | Rota | Acção |
|---|---|---|
| GET | `evaluation-forms/{form}` | Visualizar ficha |
| POST | `evaluation-forms/{form}/criteria/{c}/review` | Guardar comentário |
| POST | `evaluation-forms/{form}/submit` | Submeter avaliação |
| POST | `evaluation-forms/{form}/init-deliberation` | Criar deliberação (secretaria) |
| POST | `evaluation-forms/{form}/submit-deliberation` | Submeter deliberação (revisor) |
| POST | `evaluation-forms/{form}/decide` | Decisão final (secretaria) |
| GET | `reviewer/evaluations` | Lista do revisor |
| GET | `secretary/evaluations` | Lista da secretaria |
| GET | `protocols/{protocol}/eligible-reviewers` | Revisores elegíveis |
| POST | `protocols/{protocol}/assign-reviewers` | Atribuir revisores |

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
  "message": "Avaliacao submetida com sucesso.",
  "form": {
    "id": 1,
    "form_type": "evaluation",
    "status": "approved",
    "auto_approved": true,
    "deliberation_pending": false,
    "deliberation_form": null,
    "protocol": { ... },
    "reviews": [ ... ]
  }
}
```

**Resposta (deliberação necessária):**
```json
{
  "message": "Avaliacao submetida. Deliberacao necessaria.",
  "form": {
    "id": 1,
    "form_type": "evaluation",
    "status": "deliberation_pending",
    "auto_approved": false,
    "deliberation_pending": true,
    "deliberation_form": null,
    "reviews": [ ... ]
  }
}
```

**Resposta (pendente do outro revisor):**
```json
{
  "message": "Avaliacao submetida com sucesso. Aguardando o outro revisor.",
  "form": {
    "id": 1,
    "status": "pending",
    "auto_approved": false,
    "deliberation_pending": false,
    "deliberation_form": null,
    "reviews": [
      { "reviewer_id": 42, "submitted_at": "2026-07-25T10:00:00Z", "decision": "approved", ... },
      { "reviewer_id": 43, "submitted_at": null, "decision": null, ... }
    ]
  }
}
```

---

### 2. Iniciar Reunião de Deliberação (Secretaria)

```
POST /api/v1/nucleo/evaluation-forms/{form}/init-deliberation
```

Disponível quando a ficha está em `deliberation_pending`.

**Acções:**
1. Cria ficha de deliberação (`form_type = 'deliberation'`) ligada à ficha original
2. Copia os 28 critérios para a nova ficha
3. Copia os comentários do primeiro revisor como base
4. Cria 2 `ReviewerEvaluation` com conteúdo partilhado
5. Marca o status para `in_deliberation`

---

### 3. Submeter Deliberação (Revisor)

```
POST /api/v1/nucleo/evaluation-forms/{form}/submit-deliberation
```

**Payload:**
```json
{
  "decision": "approved",
  "conclusion_summary": "Após análise e discussão, o Núcleo aprova."
}
```

**Regras:**
- Conteúdo partilhado — ambos vêem e editam os mesmos comentários
- Qualquer revisor pode submeter a decisão final
- Gera parecer PDF automaticamente

---

### 4. Auto-Save de Critérios (Frontend)

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

Endpoint idempotente — chamado em cada `onBlur`. O comentário na deliberação é partilhado (guarda no `ReviewerEvaluation` do primeiro revisor).

---

### 5. Visualizar Ficha

```
GET /api/v1/nucleo/evaluation-forms/{form}?reviewer_id=42
```

A resposta inclui `auto_approved`, `deliberation_pending`, `deliberation_form`, `reviewer_evaluations[]` com decisões e comentários.

---

### 6. Decisão Final (Secretaria)

```
POST /api/v1/nucleo/evaluation-forms/{form}/decide
```

Usado quando a secretaria precisa de intervir manualmente (casos excepcionais).

---

## Regras de Visibilidade

| Role | Vê decisões individuais? | Vê comentários do outro revisor? |
|---|---|---|
| Revisor | Sim | Sim (diálogo aberto) |
| Secretaria | Não (apenas `submitted` / `null`) | Não |
| Estudante | Não (apenas parecer final) | Não |

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
        └── Sim ──► Ambos approved + sem needs_deliberation?
                        │
                        ├── Sim ──► Auto-Approve (parecer, avança)
                        │
                        └── Não ──► deliberation_pending
                                      │
                                      ▼
                              Secretaria: init-deliberation
                                      │
                                      ▼
                              in_deliberation
                                      │
                                      ▼
                              Reunião (fora do sistema)
                                      │
                                      ▼
                              Revisor: submit-deliberation
                                      │
                                      ├── approved ──► Avança + parecer
                                      │
                                      └── not_approved ──► Rejeita + parecer
```
