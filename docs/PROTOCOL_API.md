# Protocol API - Documentacao (Fase 1: Temas)

## Visao geral

Base path: `/api`

Endpoints documentados nesta fase:

- `POST /api/topics`
- `GET /api/topics`
- `PATCH /api/topics/{topic}/supervisor-approve`
- `PATCH /api/topics/{topic}/supervisor-reject`
- `GET /api/secretary/topics`
- `GET /api/topics/{topic}/eligible-reviewers`
- `POST /api/topics/{topic}/assign-reviewers`
- `GET /api/reviewer/topics`
- `POST /api/topics/{topic}/evaluations`

Autenticacao:

- Bearer Token (Sanctum)
- Header obrigatorio:

```http
Authorization: Bearer <token>
Accept: application/json
```

---

## Matriz RBAC (roles x permissions x endpoint)

Permissoes usadas:

- `topic.create`
- `topic.view`
- `topic.view.all`
- `protocol.assign`
- `protocol.evaluate`
- `supervision.approve`

Regras:

- `POST /api/topics` requer `topic.create`
- `GET /api/topics` requer `topic.view` ou `topic.view.all`
- com `topic.view`: retorno apenas dos proprios temas
- com `topic.view.all`: retorno de todos os temas
- a submissao do tema exige supervisor atribuido ao estudante
- o tema entra em `topic_pending_supervisor`
- a aprovacao do supervisor move o tema para `topic_pending_nucleo`
- a secretaria do nucleo move o tema para `topic_assigned_for_review`
- a primeira avaliacao move o tema para `topic_in_review`
- ao terminar a avaliacao, o tema pode ir para `topic_approved_nucleo` ou `topic_rejected_nucleo`

Status de seguranca:

- [x] Auth: aplicado (`auth:sanctum`)
- [x] Policy: aplicado (`TopicPolicy`)
- [x] RBAC por permission: aplicado
- [x] Restricao de escopo de dados: aplicada no service
- [x] Fluxo supervisor -> nucleo -> avaliacao: aplicado

---

## 1) POST /api/topics

Submete um novo tema para avaliacao inicial.

### Request body

```json
{
  "title": "Impacto da adesao terapeutica em pacientes hipertensos",
  "scientific_area_id": 1,
  "course_id": 2
}
```

### Validacoes

- `title`: required, string, min 10, max 255
- `scientific_area_id`: required, integer, existe em `scientific_areas.id`
- `course_id`: required, integer, existe em `courses.id` e pertence a `scientific_area_id`

### Response - sucesso (201)

```json
{
  "message": "Tema submetido com sucesso e enviado ao Nucleo Cientifico.",
  "topic": {
    "id": 10,
    "student_id": 6,
    "scientific_area_id": 1,
    "course_id": 2,
    "title": "Impacto da adesao terapeutica em pacientes hipertensos",
    "status": "topic_pending_supervisor",
    "justification": null,
    "submitted_at": "2026-07-02T10:15:41.000000Z",
    "created_at": "2026-07-02T10:15:41.000000Z",
    "updated_at": "2026-07-02T10:15:41.000000Z",
    "scientific_area": {
      "id": 1,
      "name": "Saude Publica"
    },
    "course": {
      "id": 2,
      "name": "Saude Publica",
      "code": "SP"
    }
  },
  "similar_topics_warning": {
    "has_similar": true,
    "items": [
      {
        "id": 4,
        "title": "Adesao terapeutica em doentes cronicos",
        "similarity_percent": 67.91
      }
    ]
  }
}
```
### Regra de repeticao de submissao

O estudante nao pode submeter um novo tema enquanto existir um tema anterior com estado diferente de `topic_rejected`.

Comportamento:

- `topic_pending` -> bloqueia nova submissao e informa que ja existe um tema pendente
- `topic_pending_supervisor` -> bloqueia nova submissao e informa que ja existe um tema pendente
- `topic_pending_nucleo` -> bloqueia nova submissao e informa que o tema ja foi encaminhado ao nucleo
- `topic_approved_nucleo` -> bloqueia nova submissao e informa que o tema ja foi aprovado
- `topic_rejected_supervisor` / `topic_rejected_nucleo` -> permite submeter nova versao
- sem tema anterior -> permite submeter normalmente

### Response - tema ja existente e nao rejeitado (409)

```json
{
  "message": "Você já tem um tema pendente — aguarde decisão antes de submeter outro.",
  "existing_topic": {
    "id": 10,
    "title": "Impacto da adesao terapeutica em pacientes hipertensos",
    "status": "topic_pending_supervisor",
    "submitted_at": "2026-07-02T10:15:41.000000Z",
    "scientific_area": {
      "id": 1,
      "name": "Saude Publica"
    },
    "course": {
      "id": 2,
      "name": "Medicina",
      "code": "MED"
    }
  }
}
###Response - tema anterior aprovado (409)
{
  "message": "Seu tema anterior já foi aprovado — não é possível submeter outro.",
  "existing_topic": {
    "id": 10,
    "title": "Impacto da adesao terapeutica em pacientes hipertensos",
    "status": "topic_approved"
  }
}

### Response - erro de validacao (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "course_id": [
      "O curso informado e invalido para a area cientifica selecionada."
    ]
  }
}
```

### Response - sem permissao (403)

```json
{
  "message": "This action is unauthorized."
}
```

### Response - sem token (401)

```json
{
  "message": "Unauthenticated."
}
```

---

## 2) GET /api/topics

Lista temas com escopo condicionado por permissao.

### Regras de retorno

- com `topic.view.all`: retorna todos os temas
- com `topic.view`: retorna somente temas do usuario autenticado

### Response - sucesso (200)

```json
{
  "topics": [
    {
      "id": 10,
      "student_id": 6,
      "scientific_area_id": 1,
      "course_id": 2,
      "title": "Impacto da adesao terapeutica em pacientes hipertensos",
      "status": "topic_pending",
      "justification": null,
      "submitted_at": "2026-07-02T10:15:41.000000Z",
      "created_at": "2026-07-02T10:15:41.000000Z",
      "updated_at": "2026-07-02T10:15:41.000000Z",
      "student": {
        "id": 6,
        "name": "Sofia Estudante",
        "email": "estudante@iscisa.ac.mz"
      },
      "scientific_area": {
        "id": 1,
        "name": "Saude Publica"
      },
      "course": {
        "id": 2,
        "name": "Saude Publica",
        "code": "SP"
      }
    }
  ]
}
```

### Response - sem permissao (403)

```json
{
  "message": "This action is unauthorized."
}
```

### Response - sem token (401)

```json
{
  "message": "Unauthenticated."
}
```

---

## Exemplos rapidos (cURL)

### Criar tema

```bash
curl -X POST http://127.0.0.1:8000/api/topics \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Impacto da adesao terapeutica em pacientes hipertensos",
    "scientific_area_id":1,
    "course_id":2
  }'
```

### Listar temas

```bash
curl -X GET http://127.0.0.1:8000/api/topics \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

---

## Notas de implementacao

- Similaridade de titulos usa `similar_text` sobre temas `topic_approved`.
- Similaridade de titulos usa `similar_text` sobre temas `topic_approved_nucleo`.
- A busca de similares e aviso informativo, nao bloqueante.
- O estado inicial sempre e `topic_pending_supervisor`.
- Policy registrada no provider do modulo Protocol.
- A tabela `topics` guarda o supervisor do aluno e o estado da aprovacao do supervisor.

---

## 3) Endpoints de secretaria e avaliação

### GET /api/secretary/topics

Lista temas do núcleo da secretaria que estão em `topic_pending_nucleo`.

### GET /api/topics/{topic}/eligible-reviewers

Lista avaliadores elegíveis do mesmo núcleo do tema.

### POST /api/topics/{topic}/assign-reviewers

```json
{
  "reviewer_ids": [1, 2]
}
```

### GET /api/reviewer/topics

Lista os temas atribuídos ao revisor autenticado.

### POST /api/topics/{topic}/evaluations

```json
{
  "decision": "approved",
  "comments": "Tema consistente e viável."
}
```
