# Comité Científico (CC) — Fluxo de Atribuição e Listagem

## Membros do CC

O Comité Científico tem **membros formais** registados na tabela `organ_members` com `organ.type = 'scientific_committee'`.

Apenas docentes que são membros deste órgão são elegíveis para revisão de protocolos no CC.


## Rotas (CC)

Todas as rotas de avaliação do Comité Científico estão sob `/api/v1/comite-cientifico/`:

| Método | Rota | Acção |
|---|---|---|
| GET | `evaluation-forms/{form}` | Visualizar ficha |
| POST | `evaluation-forms/{form}/criteria/{c}/review` | Guardar comentário |
| POST | `evaluation-forms/{form}/submit` | Submeter avaliação |
| POST | `evaluation-forms/{form}/init-deliberation` | Criar deliberação (secretaria) |
| POST | `evaluation-forms/{form}/submit-deliberation` | Submeter deliberação (revisor) |
| POST | `evaluation-forms/{form}/decide` | Decisão final (secretaria) |
| GET | `reviewer/evaluations` | Lista do revisor |
| GET | `reviewer/works` | Lista combinada (temas + protocolos) |
| GET | `secretary/evaluations` | Lista da secretaria |
| GET | `protocols/{protocol}/eligible-reviewers` | Revisores elegíveis |
| POST | `protocols/{protocol}/assign-reviewers` | Atribuir revisores |

---

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

> A secretaria vê a carga para decidir se o revisor tem disponibilidade (ex: evitar atribuir a alguém com 5+ trabalhos pendentes).

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
      "reviewer_one": { "id": 42, "name": "Dr. Joao Silva", "email": "joao@email.com" },
      "reviewer_two": { "id": 43, "name": "Dra. Maria Santos", "email": "maria@email.com" },
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

**Resposta:**
```json
{
  "message": "Revisores atribuidos com sucesso ao protocolo no Comite Cientifico.",
  "protocol": { ... }
}
```

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
        "status_label": "Avaliadores atribuídos, em revisão",
        "scientific_area": { "id": 1, "name": "Ciencias da Saude" },
        "course": { "id": 2, "name": "Medicina", "code": "MED" },
        "my_assignment": { "id": 10, "status": "pending", "evaluation": null }
      }
    ],
    "evaluations": [
      {
        "id": 3,
        "form_type": "evaluation",
        "status": "pending_review",
        "organ": "comite_cientifico",
        "protocol": { "id": 12, "code": "CC_V01", "status": "protocol_in_review_comite_cientifico" },
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
- O campo `total_active` é a soma de ambos

---

### 5. Listar Fichas de Avaliação do Revisor (CC)

```
GET /api/v1/comite-cientifico/reviewer/evaluations
Auth: Revisor (perm=protocol.evaluate)
```

**Resposta:**
```json
{
  "evaluation_forms": [
    {
      "id": 3,
      "form_type": "evaluation",
      "status": "pending_review",
      "organ": "comite_cientifico",
      "protocol": { "id": 12, "code": "CC_V01", "status": "protocol_in_review_comite_cientifico" },
      "reviewer_evaluations": [ ... ]
    }
  ]
}
```

---

### 6. Listar Fichas da Secretaria (CC)

```
GET /api/v1/comite-cientifico/secretary/evaluations
Auth: Secretaria (perm=protocol.assign)
```

Filtra automaticamente por `organ = 'comite_cientifico'` e status do protocolo (`protocol_pending_comite_cientifico`, `protocol_in_review_comite_cientifico`).

---

### 7. Iniciar Reunião de Deliberação (Secretaria)

```
POST /api/v1/comite-cientifico/evaluation-forms/{form}/init-deliberation
Auth: Secretaria (perm=protocol.assign)
```

Disponível quando a ficha de avaliação está em status `deliberation_pending` (ambos revisores já submeteram).

**Acções:**
1. Cria ficha de deliberação (`form_type = 'deliberation'`) ligada à ficha original
2. Copia os 28 critérios para a nova ficha
3. Copia os comentários do primeiro revisor como base de trabalho
4. Cria 2 `ReviewerEvaluation` (um por revisor) com **conteúdo partilhado**
5. Marca a ficha original como `in_deliberation`

**Resposta:**
```json
{
  "message": "Reunião de deliberação iniciada. Ficha de deliberação criada.",
  "deliberation_form": {
    "id": 3,
    "form_type": "deliberation",
    "status": "pending_review",
    "reviewer_evaluations": [ ... ],
    "form_criteria": [ ... ]
  },
  "evaluation_form": {
    "id": 1,
    "form_type": "evaluation",
    "status": "in_deliberation",
    ...
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
  "conclusion_summary": "Após análise do protocolo e discussão em reunião, o Comité Científico decide pela aprovação."
}
```

**Regras:**
- A ficha de deliberação tem **conteúdo partilhado** — ambos os revisores vêem e editam os mesmos comentários
- **Qualquer um dos dois** pode submeter a decisão final
- Se `approved`: protocolo avança para Bioética + gera parecer PDF
- Se `not_approved`: protocolo rejeitado + gera parecer PDF (estudante recebe)

**Resposta:**
```json
{
  "message": "Protocolo aprovado e encaminhado ao Comité de Bioética.",
  "evaluation_form": { "id": 1, "status": "concluded", "final_decision": "approved", ... },
  "deliberation_form": { "id": 3, "status": "concluded", ... },
  "opinion": {
    "id": 5,
    "decision": "approved",
    "issued_at": "2026-07-26T15:00:00.000000Z",
    "document_url": "/storage/opinions/opinion_5.pdf",
    "download_url": "/api/v1/opinions/5/download"
  }
}
```

---

## Fluxo Completo (CC)

```
Protocolo aprovado pelo Núcleo
        │
        ▼
  status = protocol_pending_comite_cientifico
        │
        ▼
  Secretaria atribui 2 revisores (só membros do CC)
        │
        ▼
  status = protocol_in_review_comite_cientifico
  Cada revisor avalia (28 critérios + decision)
        │
        ▼
  Ambos submeteram?
        │
        ├── Não ──► Aguarda (secretaria vê status actualizado)
        │
        └── Sim ──► status = deliberation_pending
                      │
                      ▼
              Secretaria: POST /init-deliberation
                      │
                      ▼
              Cria ficha de deliberação (form_type='deliberation')
              status = in_deliberation
                      │
                      ▼
              Reunião de deliberação (fora do sistema)
                      │
                      ▼
              Revisores ajustam a ficha (conteúdo partilhado)
                      │
                      ▼
              Qualquer revisor: POST /submit-deliberation
                      │
                      ├── approved ──► Avança para Bioética + parecer
                      │
                      └── not_approved ──► Rejeita + parecer (feedback ao estudante)
```

---

## Regras de Negócio

1. **Apenas membros do CC** (via `organ_members`) podem ser revisores — docentes que não são membros do CC não aparecem na lista de elegíveis.

2. **Carga de trabalho** (`active_works`) é calculada automaticamente e inclui tanto temas como protocolos pendentes.

3. **Supervisor** do protocolo é excluído da lista de elegíveis.

4. **Revisores já atribuídos** a este protocolo no CC são excluídos da lista.

5. Após atribuição, o protocolo avança para `protocol_in_review_comite_cientifico` e os revisores podem aceder às fichas de avaliação.

6. **No CC não há auto-approve nem harmonização automática** — após ambos os revisores submeterem, o sistema aguarda a reunião de deliberação.

7. **A ficha de deliberação tem conteúdo partilhado** — ambos os revisores vêem e editam os mesmos comentários. O sistema guarda na `ReviewerEvaluation` do primeiro revisor (partilhada).

8. **Qualquer um dos dois revisores** pode submeter a decisão final na ficha de deliberação.

9. Após a deliberação, um **parecer PDF** é gerado automaticamente com a decisão final.

---

## Modelo de Dados (Organização)

```
Organ (type = 'scientific_committee')
    │
    ├── OrganMember (user_id → User → TeacherProfile)
    │       └── role: 'president' | 'coordinator' | 'reviewer' | 'member'
    │
    └── SecretaryProfile (organ_id)

ProtocolReviewAssignment
    ├── organ_id → Organ (CC)
    ├── reviewer_one → TeacherProfile
    ├── reviewer_two → TeacherProfile
    └── status: 'pending'

EvaluationForm
    ├── organ = 'comite_cientifico'
    ├──     form_type = 'evaluation' | 'deliberation'
    ├── status = 'pending_review' | 'in_review' | 'deliberation_pending' | 'in_deliberation' | 'concluded'
    ├── protocol_id → Protocol
    ├── parent_form_id → EvaluationForm (null para evaluation, preenchido para deliberation)
    └── reviewerEvaluations → ReviewerEvaluation
```

---


