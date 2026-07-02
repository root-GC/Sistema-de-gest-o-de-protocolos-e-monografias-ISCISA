# Protocol API - Documentacao (Fase 1: Temas)

## Visao geral

Base path: `/api`

Endpoints documentados nesta fase:

- `POST /api/topics`
- `GET /api/topics`

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

Regras:

- `POST /api/topics` requer `topic.create`
- `GET /api/topics` requer `topic.view` ou `topic.view.all`
- com `topic.view`: retorno apenas dos proprios temas
- com `topic.view.all`: retorno de todos os temas

Status de seguranca:

- [x] Auth: aplicado (`auth:sanctum`)
- [x] Policy: aplicado (`TopicPolicy`)
- [x] RBAC por permission: aplicado
- [x] Restricao de escopo de dados: aplicada no service

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
    "status": "topic_pending",
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
- A busca de similares e aviso informativo, nao bloqueante.
- O estado inicial sempre e `topic_pending`.
- Policy registrada no provider do modulo Protocol.
