
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
|PATCH |/topics/{topic}/supervisor-approve	supervisor atribuído + supervision.approve	Aprovar tema submetido
|PATCH |/topics/{topic}/supervisor-reject	supervisor atribuído + supervision.approve	Rejeitar tema submetido
## Regras já aplicadas

- O estudante não pode submeter um novo tema se já existir um tema `topic_pending`.
- O estudante não pode submeter um novo tema se já existir um tema `topic_approved`.
- O estudante pode submeter uma nova versão apenas quando o último tema estiver `topic_rejected`.
- Ao submeter um tema, o backend pode devolver `similar_topics_warning` com títulos parecidos já aprovados.
- A listagem de temas é filtrada por permissão: `topic.view` ou `topic.view.all`.

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
3. O estado inicial de um tema é `topic_pending`.
