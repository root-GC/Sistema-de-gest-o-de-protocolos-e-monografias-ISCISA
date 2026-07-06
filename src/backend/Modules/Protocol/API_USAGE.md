
---
# Protocol - API Usage

## Base URL

- Backend local: `http://127.0.0.1:8000`
- Prefixo da API: `/api/v1`
- Base final: `http://127.0.0.1:8000/api/v1`

## Autenticação

As rotas do módulo Protocol usam Bearer Token do Sanctum.

Header obrigatório:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

## Formato padrão de resposta

Sucesso:

```json
{
  "message": "Tema submetido com sucesso e enviado ao Nucleo Cientifico.",
  "topic": {},
  "similar_topics_warning": {
    "has_similar": false,
    "items": []
  }
}
```

Erro:

```json
{
  "message": "This action is unauthorized."
}
```

## APIs já implementadas

| Método | Rota | Proteção | Descrição |
| --- | --- | --- | --- |
| POST | `/topics` | `auth:sanctum` + `topic.create` | Submeter novo tema |
| GET | `/topics` | `auth:sanctum` + `topic.view` ou `topic.view.all` | Listar temas do estudante ou de todos, conforme permissão |
| PATCH | `/topics/{topic}/supervisor-approve` | supervisor atribuído + `supervision.approve` | Aprovar tema submetido e encaminhar ao núcleo |
| PATCH | `/topics/{topic}/supervisor-reject` | supervisor atribuído + `supervision.approve` | Rejeitar tema submetido |
| GET | `/secretary/topics` | `protocol.assign` | Listar temas do núcleo aguardando atribuição |
| GET | `/topics/{topic}/eligible-reviewers` | `protocol.assign` | Listar avaliadores elegíveis do mesmo núcleo |
| POST | `/topics/{topic}/assign-reviewers` | `protocol.assign` | Atribuir avaliadores ao tema |
| GET | `/reviewer/topics` | `protocol.evaluate` | Listar temas atribuídos ao revisor autenticado |
| POST | `/topics/{topic}/evaluations` | `protocol.evaluate` | Registar avaliação do tema |

## Fluxo atual de estados

- `topic_pending_supervisor` — tema submetido, aguardando o supervisor.
- `topic_pending_nucleo` — supervisor aprovou e o tema entrou na fila da secretaria.
- `topic_assigned_for_review` — secretaria atribuiu avaliadores.
- `topic_in_review` — pelo menos uma avaliação foi registada.
- `topic_approved_nucleo` — avaliação final aprovada.
- `topic_rejected_supervisor` — supervisor rejeitou o tema.
- `topic_rejected_nucleo` — avaliação final rejeitada.
## Regras já aplicadas

- O estudante não pode submeter um novo tema se já existir um tema `topic_pending_supervisor`.
- O estudante não pode submeter um novo tema se já existir um tema `topic_pending_nucleo`.
- O estudante não pode submeter um novo tema se já existir um tema `topic_approved_nucleo`.
- O estudante pode submeter uma nova versão quando o último tema estiver `topic_rejected_supervisor` ou `topic_rejected_nucleo`.
- Ao submeter um tema, o backend pode devolver `similar_topics_warning` com títulos parecidos já aprovados.
- A listagem de temas é filtrada por permissão: `topic.view` ou `topic.view.all`.
- A secretaria só vê temas do seu próprio núcleo.
- Os avaliadores elegíveis também são filtrados pelo núcleo do tema.

## Exemplos de uso

### 1. Submeter tema

```bash
curl -X POST http://127.0.0.1:8000/api/v1/topics \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Impacto da adesao terapeutica em pacientes hipertensos",
    "scientific_area_id":1,
    "course_id":2
  }'
```

### 2. Listar temas

```bash
curl -X GET http://127.0.0.1:8000/api/v1/topics \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

### 3. Aprovar como supervisor

```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/topics/6/supervisor-approve \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

### 4. Listar temas do núcleo na secretaria

```bash
curl -X GET http://127.0.0.1:8000/api/v1/secretary/topics \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

### 5. Atribuir avaliadores

```bash
curl -X POST http://127.0.0.1:8000/api/v1/topics/6/assign-reviewers \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewer_ids": [1, 2]
  }'
```

### 6. Registar avaliação

```bash
curl -X POST http://127.0.0.1:8000/api/v1/topics/6/evaluations \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approved",
    "comments": "Tema consistente e viável."
  }'
```

## APIs futuras do módulo Protocol

| Método | Rota | Proteção | Estado |
| --- | --- | --- | --- |
| PATCH | `/topics/{id}/approve` | secretário / permissão de aprovação | futura |
| PATCH | `/topics/{id}/reject` | secretário / permissão de rejeição | futura |
| POST | `/protocols` | estudante autenticado | futura |
| GET | `/protocols` | por papel/permissão | futura |
| GET | `/protocols/{id}` | autenticado | futura |
| POST | `/protocols/{id}/versions` | estudante autenticado | futura |
| PATCH | `/protocols/{id}/supervisor-validation` | supervisor | futura |
| PATCH | `/protocols/{id}/advance` | secretário | futura |
| PATCH | `/protocols/{id}/return` | secretário | futura |
| POST | `/protocols/{id}/assignments` | secretário | futura |
| POST | `/protocols/{id}/reviews` | revisor | futura |
| POST | `/protocols/{id}/harmonize` | harmonizador | futura |
| PATCH | `/protocols/{id}/accept-harmonization` | externo | futura |
| POST | `/protocols/{id}/documents` | autenticado | futura |
| GET | `/protocols/{id}/history` | autenticado | futura |

## Observações do módulo

1. O prefixo real das rotas do módulo é carregado pelo provider do Protocol.
2. A submissão de temas usa política de acesso via `TopicPolicy`.
3. O estado inicial de um tema é `topic_pending_supervisor`.
