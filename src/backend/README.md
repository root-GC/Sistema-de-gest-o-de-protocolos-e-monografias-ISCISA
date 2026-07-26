# Fluxo de Avaliação de Protocolos — Núcleo Científico

## Visão Geral

A avaliação de protocolos no Núcleo segue um fluxo em que **dois revisores** analisam o protocolo de forma independente e, se necessário, harmonizam as suas decisões.

Cada revisor submete:
- **decision**: `approved` | `not_approved`
- **needs_deliberation**: `true` | `false` (checkbox que indica se o revisor acha necessário discutir com o outro revisor)
- **criterion_reviews**: pontuações e comentários para cada critério (28 critérios em 3 grupos)
Cada revisor submete:
- **decision**: `approved` | `not_approved`
- **needs_deliberation**: `true` | `false` (checkbox que indica se o revisor acha necessário discutir com o outro revisor)
- **criterion_reviews**: comentários para cada critério (28 critérios em 3 grupos). Observação: o campo `score` NÃO é persistido no backend por enquanto (ver seção "Notas").

O backend decide automaticamente o próximo passo após ambos os revisores submeterem.

---

## Decisão Automática (checkEvaluationCompletion)

Quando o segundo revisor submete, o sistema avalia:

| Condição                                                   | Resultado                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| Ambos `approved` E nenhum marcou `needs_deliberation=true` | **Auto-Approve** — gera parecer favorável, avança protocolo |
| Qualquer outro caso                                        | **Cria ficha de Harmonização** — ambos revisores ajustam    |

---

## Endpoints

### 1. Submeter Avaliação Individual

```
POST /api/v1/evaluation-forms/{form}/submit
```

**Payload (exemplo):**
```json
{
  "reviewer_id": 42,
  "decision": "approved",
  "needs_deliberation": false,
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
    "needs_harmonization": false,
    "harmonization_form": null,
    "protocol": { ... },
    "reviews": [ ... ]
  }
}
```

**Resposta (harmonização necessária):**
```json
{
  "message": "Avaliacao submetida. Harmonizacao necessaria.",
  "form": {
    "id": 1,
    "form_type": "evaluation",
    "status": "pending_harmonization",
    "auto_approved": false,
    "needs_harmonization": true,
    "harmonization_form": {
      "id": 2,
      "form_type": "harmonization",
      "status": "pending",
      "reviews": [ ... ]
    },
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
    "needs_harmonization": false,
    "harmonization_form": null,
    "reviews": [
      { "reviewer_id": 42, "submitted_at": "2026-07-25T10:00:00Z", "decision": "approved", ... },
      { "reviewer_id": 43, "submitted_at": null, "decision": null, ... }
    ]
  }
}
```

---

### 2. Submeter Harmonização

```
POST /api/v1/evaluation-forms/{form}/harmonize
```

**Payload:**
```json
{
  "reviewer_id": 42,
  "decision": "approved",
  "criterion_reviews": {
    "103": { "comment": "Bem estruturado (após discussão)" }
  }
}
```

**Regras:**
- Ambos os revisores submetem na mesma ficha de harmonização
- Cada revisor pode alterar os seus próprios comentários
- A decisão final é aplicada quando ambos submeterem
- Se algum revisor submeter `not_approved` → o protocolo é rejeitado

**Resposta:**
```json
{
  "message": "Harmonizacao submetida com sucesso.",
  "form": {
    "id": 2,
    "form_type": "harmonization",
    "status": "approved",
    "harmonized_decision": "approved",
    "harmonized_at": "2026-07-25T14:30:00Z",
    "parent_form": { "id": 1, "form_type": "evaluation" },
    "reviews": [ ... ]
  }
}
```

---

### 3. Auto-Save de Critérios (Frontend apenas)

```
POST /api/v1/evaluation-forms/{form}/criteria/{formCriterion}/review
```

**Payload:**
```json
{
  "reviewer_id": 42,
  "comment": "Parcial"
}
```

**Nota:** Este endpoint é **idempotente** — o frontend pode chamá-lo em cada `onBlur`. O backend persiste mas não acciona qualquer lógica de workflow.

---

### 4. Visualizar Ficha

```
GET /api/v1/evaluation-forms/{form}
```

**Query params:** `?reviewer_id=42` (opcional — usado para filtrar dados por role)

A resposta inclui:
- `auto_approved`, `needs_harmonization`, `harmonization_form`, `parent_form`
- `reviewer_evaluations[]` com decisões, timestamps e `criterion_reviews`

**Estrutura do `criterion_reviews` (dentro de `reviewer_evaluations[]`):**

```json
{
  "reviewer_evaluations": [
    {
      "id": 1,
      "reviewer_id": 42,
      "status": "submitted",
      "submitted_at": "2026-07-25T10:00:00Z",
      "decision": "approved",
      "needs_deliberation": false,
      "overall_comment": "Bom trabalho",
      "criterion_reviews": [
        {
          "id": 10,
          "comment": "Bem estruturado e claro",
          "reviewer_evaluation_id": 1,
          "reviewer": {
            "id": 42,
            "name": "Dr. Joao Silva"
          }
        },
        {
          "id": 11,
          "comment": "Metodologia adequada",
          "reviewer_evaluation_id": 1,
          "reviewer": {
            "id": 42,
            "name": "Dr. Joao Silva"
          }
        }
      ]
    }
  ]
}
```

**Notas:**
- Cada `criterion_review` inclui o objecto `reviewer` com `id` e `name` do autor — os revisores vêem os comentários uns dos outros etiquetados (formato de diálogo)
- A secretaria NÃO recebe `decision`, `needs_deliberation`, `overall_comment` nem `criterion_reviews` — apenas `status` e `submitted_at`
- O campo `score` **não é persistido** no backend (o model `EvaluationCriterionReview` só tem `comment`). Se precisarem de guardar pontuação por critério, é necessário adicionar um campo `score` à migration e ao model.

---

## Regras de Visibilidade

| Role       | Vê decisões individuais?             | Vê comentários do outro revisor? | Vê `needs_deliberation`? |
| ---------- | ------------------------------------ | -------------------------------- | ------------------------ |
| Revisor    | Sim                                  | Sim (diálogo aberto)             | Sim                      |
| Secretaria | Não (vê apenas `submitted` / `null`) | Não                              | Não                      |
| Estudante  | Não (vê apenas parecer final)        | Não                              | Não                      |

**Implementação:** O resource `ReviewerEvaluationResource` filtra os campos `decision`, `needs_deliberation` e `criterion_reviews` baseado no `reviewer_id` recebido no request. Se o `reviewer_id` corresponde ao revisor, ou se é um revisor da mesma ficha, os dados são incluídos. Caso contrário (secretaria), apenas o status de submissão é exposto.

---

## Formatos de Data

Todos os timestamps são retornados em **ISO 8601** (`YYYY-MM-DDTHH:mm:ssZ`).

---

## Modelo de Dados

### reviewer_evaluations

| Campo                   | Tipo       | Descrição                     |
| ----------------------- | ---------- | ----------------------------- |
| id                      | integer    | PK                            |
| evaluation_form_id      | integer    | FK                            |
| reviewer_id             | integer    | FK (teacher_profiles)         |
| decision                | enum       | `approved` ou `not_approved`  |
| needs_deliberation      | boolean    | Se revisor solicita discussão |
| submitted_at            | timestamp  | Quando o revisor submeteu     |
| created_at / updated_at | timestamps |                               |

### evaluation_forms

| Campo               | Tipo      | Descrição                                                  |
| ------------------- | --------- | ---------------------------------------------------------- |
| id                  | integer   | PK                                                         |
| form_type           | enum      | `evaluation` ou `harmonization`                            |
| parent_form_id      | integer   | FK → evaluation_forms (null para evaluation)               |
| status              | string    | `pending`, `approved`, `rejected`, `pending_harmonization` |
| auto_approved       | boolean   | Se foi aprovado automaticamente                            |
| harmonized_decision | enum      | `approved` ou `not_approved` (preenchido na harmonização)  |
| harmonized_at       | timestamp | Quando a harmonização foi concluída                        |

---

## Fluxo Completo

```
Secretaria atribui 2 revisores
        │
        ▼
  Cria ficha de avaliação (form_type=evaluation)
  Cada revisor avalia e marca necessita_deliberacao?
        │
        ▼
  Ambos submeteram?
        │
        ├── Sim ──► Ambos approved E sem deliberação?
        │               ├── Sim ──► Auto-Approve (parecer, avanço)
        │               └── Não ──► Cria ficha de harmonização
        │                              │
        │                              ▼
        │                          Ambos harmonizam
        │                              │
        │                              ▼
        │                          Decide (approved / not_approved)
        │
        └── Não ──► Aguarda
```
