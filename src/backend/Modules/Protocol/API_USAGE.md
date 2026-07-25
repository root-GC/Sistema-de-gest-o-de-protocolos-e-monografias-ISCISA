
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
| GET | `/supervisor/supervisees` | docente autenticado + `supervision.view` | Listar supervisandos do docente autenticado e a fase atual (`topic`, `protocol` ou `none`) |
| GET | `/secretary/topics` | `protocol.assign` | Listar todos os temas do núcleo da secretaria |
| GET | `/topics/{topic}/eligible-reviewers` | `protocol.assign` | Listar avaliadores elegíveis do mesmo núcleo |
| GET | `/topics/{topic}/reviewers` | `protocol.assign` | Listar avaliadores já atribuídos ao tema |
| POST | `/topics/{topic}/assign-reviewers` | `protocol.assign` | Atribuir avaliadores ao tema |
| GET | `/reviewer/topics` | `protocol.evaluate` | Listar temas atribuídos ao revisor autenticado |
| GET | `/topics/{topic}/comments` | `protocol.evaluate` | Listar comentários do tema para revisores atribuídos |
| POST | `/topics/{topic}/comments` | `protocol.evaluate` | Registar comentário do revisor, separado da decisão |
| POST | `/topics/{topic}/evaluations` | `protocol.evaluate` | Registar avaliação do tema |
| POST | `/protocols` | estudante autenticado | Submeter protocolo em `.docx` após aprovação do tema |
| GET | `/protocols` | estudante / supervisor / administrador | Listar protocolos conforme permissão |
| GET | `/protocols/{protocol}` | participante / administrador | Ver detalhe do protocolo |
| PATCH | `/protocols/{protocol}/supervisor-approve` | supervisor atribuído | Aprovar protocolo submetido |
| PATCH | `/protocols/{protocol}/supervisor-reject` | supervisor atribuído | Rejeitar protocolo submetido |
| GET | `/secretary/protocols` | `protocol.assign` | Listar protocolos pendentes no núcleo da secretaria |
| GET | `/protocols/{protocol}/eligible-reviewers` | `protocol.assign` | Listar revisores elegíveis do mesmo núcleo |
| GET | `/protocols/{protocol}/reviewers` | `protocol.assign` | Listar revisores já atribuídos ao protocolo |
| POST | `/protocols/{protocol}/assign-reviewers` | `protocol.assign` | Atribuir revisores e transicionar para `protocol_in_review_nucleo` |
| GET | `/reviewer/protocols` | `protocol.evaluate` | Listar protocolos atribuídos ao revisor autenticado (blind review) |

## Fluxo atual de estados

- `topic_pending_supervisor` — tema submetido, aguardando o supervisor.
- `topic_pending_nucleo` — supervisor aprovou e o tema entrou na fila da secretaria.
- `topic_assigned_for_review` — secretaria atribuiu avaliadores.
- `topic_in_review` — pelo menos uma avaliação foi registada.
- `topic_approved_nucleo` — avaliação final aprovada.
- `topic_rejected_supervisor` — supervisor rejeitou o tema.
- `topic_rejected_nucleo` — avaliação final rejeitada.
- `protocol_in_review_nucleo` — Em avaliação pelos revisores do Nucleo Cientifico.

## Regras já aplicadas

- O estudante não pode submeter um novo tema se já existir um tema `topic_pending_supervisor`.
- O estudante não pode submeter um novo tema se já existir um tema `topic_pending_nucleo`.
- O estudante não pode submeter um novo tema se já existir um tema `topic_approved_nucleo`.
- O estudante pode submeter uma nova versão quando o último tema estiver `topic_rejected_supervisor` ou `topic_rejected_nucleo`.
- Ao submeter um tema, o backend pode devolver `similar_topics_warning` com títulos parecidos já aprovados.
- A listagem de temas é filtrada por permissão: `topic.view` ou `topic.view.all`.
- A secretaria vê todos os temas do seu próprio núcleo que chegaram ao núcleo, incluindo aprovados, pendentes de revisão e pendentes de avaliador.
- Temas `topic_rejected_supervisor` não aparecem para a secretaria, porque não entram no núcleo.
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
    "justification":"O estudo é relevante para melhorar a adesão e o acompanhamento dos pacientes no contexto local.",
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
    "comment_id": 1
  }'
```

### 7. Listar comentários de um tema

```bash
curl -X GET http://127.0.0.1:8000/api/v1/topics/6/comments \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Filtros opcionais:

- `search=metodologia`
- `order=asc|desc`
- `status=active|inactive`

### 8. Registar comentário separado

```bash
curl -X POST http://127.0.0.1:8000/api/v1/topics/6/comments \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "O tema precisa de clarificar a metodologia."
  }'
```

Notas:

- O endpoint de comentário só cria `topic_review_comments`.
- O endpoint de avaliação cria/actualiza `topic_review_evaluations` e pode receber `comment_id` opcional para ligar um comentário já criado.

### 14. Listar protocolos para a secretaria do núcleo

```bash
curl -X GET http://127.0.0.1:8000/api/v1/secretary/protocols \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Resposta:

```json
{
  "protocols": [
    {
      "id": 1,
      "code": "PTM0001E",
      "status": "protocol_pending_nucleo",
      "status_label": "Encaminhado ao Nucleo Cientifico",
      "submitted_at": "2026-07-07T14:30:00Z",
      "topic": {
        "id": 6,
        "title": "Titulo do Tema Aprovado",
        "status": "topic_approved_nucleo"
      },
      "review_assignments": []
    }
  ]
}
```

### 15. Listar revisores elegíveis para um protocolo

```bash
curl -X GET http://127.0.0.1:8000/api/v1/protocols/1/eligible-reviewers \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Resposta:

```json
{
  "reviewers": [
    {
      "id": 1,
      "name": "Dr. Carlos Nhampossa",
      "email": "carlos@iscisa.ac.mz",
      "scientific_area_name": "Saude Publica"
    },
    {
      "id": 3,
      "name": "Dra. Maria Langa",
      "email": "maria@iscisa.ac.mz",
      "scientific_area_name": "Saude Publica"
    }
  ]
}
```

### 16. Atribuir revisores a um protocolo

```bash
curl -X POST http://127.0.0.1:8000/api/v1/protocols/1/assign-reviewers \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewer_one_id": 1,
    "reviewer_two_id": 3
  }'
```

Resposta:

```json
{
  "message": "Revisores atribuidos com sucesso ao protocolo.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_in_review_nucleo",
    "status_label": "Em avaliacao pelo Nucleo Cientifico",
    "version": "NC_V1",
    "review_assignments": [
      {
        "id": 1,
        "organ_id": 1,
        "reviewer_one": 1,
        "reviewer_two": 3,
        "review_order": false,
        "status": "pending",
        "assigned_at": "2026-07-08T10:00:00Z"
      }
    ]
  }
}
```

### 17. Listar protocolos atribuídos ao revisor (blind review)

```bash
curl -X GET http://127.0.0.1:8000/api/v1/reviewer/protocols \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Resposta:

```json
{
  "protocols": [
    {
      "id": 1,
      "code": "PTM0001E",
      "protocol_type": "protocol",
      "status": "protocol_in_review_nucleo",
      "status_label": "Em avaliacao pelo Nucleo Cientifico",
      "version": "NC_V1",
      "submitted_at": "2026-07-07T14:30:00Z",
      "topic": {
        "id": 6,
        "title": "Titulo do Tema Aprovado",
        "status": "topic_approved_nucleo",
        "scientific_area": {
          "id": 1,
          "name": "Saude Publica"
        },
        "course": {
          "id": 1,
          "name": "Medicina Geral",
          "code": "MED01"
        }
      },
      "my_assignment": {
        "id": 1,
        "assigned_at": "2026-07-08T10:00:00Z",
        "status": "pending",
        "review_order": false
      }
    }
  ]
}
```

Notas:
- O estudante e o supervisor **não** são expostos (blind review).
- São listados todos os protocolos atribuídos ao revisor autenticado, incluindo os já avaliados.

- O campo `my_assignment` mostra apenas os dados da atribuição do revisor autenticado.

## Exemplos de protocolo (Fase do Núcleo)

### 9. Submeter protocolo em .docx

Pré-requisito: o utilizador autenticado deve ser o estudante dono do tema.

```bash
curl -X POST http://127.0.0.1:8000/api/v1/protocols \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -F "topic_id=6" \
  -F "protocol_type=protocol" \
  -F "document=@/path/to/protocol.docx"
```

Resposta de sucesso (201):

```json
{
  "message": "Protocolo submetido com sucesso e aguardando aprovacao do supervisor.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_pending_supervisor",
    "status_label": "Aguardando aprovacao do supervisor",
      "protocol_type": "protocol",
      "submission_number": 1,
      "version": "1",
    "submitted_at": "2026-07-07T14:30:00Z",
    "supervisor_decision_at": null,
    "justification": null,
    "topic": {
      "id": 6,
        "title": "Titulo do Tema",
        "status": "topic_pending_supervisor"
    },
    "documents": [
      {
        "id": 1,
        "document_type": "protocol",
        "file_name": "protocol-1.docx",
        "file_path": "protocols/1/protocol-1.docx",
        "file_url": "http://127.0.0.1:8000/storage/protocols/1/protocol-1.docx",
        "pages": null,
        "version": 1,
        "status": "active",
        "submitted_at": "2026-07-07T14:30:00Z"
      }
    ]
  }
}
```

### 10. Listar protocolos

Estudante: lista seus próprios protocolos.
Supervisor/Admin: lista conforme permissão.

```bash
curl -X GET http://127.0.0.1:8000/api/v1/protocols \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Resposta:

```json
{
  "protocols": [
    {
      "id": 1,
      "code": "PTM0001E",
      "status": "protocol_pending_supervisor",
      "status_label": "Aguardando aprovacao do supervisor",
      "submitted_at": "2026-07-07T14:30:00Z",
      "supervisor_decision_at": null,
      "justification": null,
      "topic": {
        "id": 6,
        "title": "Titulo do Tema Aprovado",
        "status": "topic_approved_nucleo"
      },
      "documents": [
        {
          "id": 1,
          "document_type": "protocol",
          "file_name": "protocol-1.docx",
          "file_path": "protocols/1/protocol-1.docx",
          "file_url": "http://127.0.0.1:8000/storage/protocols/1/protocol-1.docx",
          "pages": null,
          "version": 1,
          "status": "active",
          "submitted_at": "2026-07-07T14:30:00Z"
        }
      ]
    }
  ]
}
```

### 11. Ver detalhe do protocolo

```bash
curl -X GET http://127.0.0.1:8000/api/v1/protocols/1 \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

### 12. Aprovação do protocolo pelo supervisor

```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/protocols/1/supervisor-approve \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

Resposta:

```json
{
  "message": "Protocolo aprovado pelo supervisor.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_pending_nucleo",
    "status_label": "Encaminhado ao Nucleo Cientifico",
    "submitted_at": "2026-07-07T14:30:00Z",
    "supervisor_decision_at": "2026-07-07T15:45:00Z",
    "justification": null,
    "nc_version": 1,
    "cc_version": 0,
    "cb_version": 0,
    "version": "NC_V1",
    "topic": {
      "id": 6,
      "title": "Titulo do Tema",
      "status": "topic_pending_supervisor"
    },
    "documents": [
      {
        "id": 1,
        "document_type": "protocol",
        "file_name": "protocol-1.docx",
        "file_path": "protocols/1/protocol-1.docx",
        "file_url": "http://127.0.0.1:8000/storage/protocols/1/protocol-1.docx",
        "pages": null,
        "version": 1,
        "status": "active",
        "submitted_at": "2026-07-07T14:30:00Z"
      }
    ]
  }
}
```

### 13. Rejeição do protocolo pelo supervisor

```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/protocols/1/supervisor-reject \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "justification": "O protocolo precisa de revisar a secção de metodologia com mais clareza nos procedimentos."
  }'
```

Resposta:

```json
{
  "message": "Protocolo rejeitado pelo supervisor.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_rejected_supervisor",
    "status_label": "Rejeitado pelo supervisor",
    "submitted_at": "2026-07-07T14:30:00Z",
    "supervisor_decision_at": "2026-07-07T15:50:00Z",
    "justification": "O protocolo precisa de revisar a secção de metodologia com mais clareza nos procedimentos.",
    "topic": {
      "id": 6,
      "title": "Titulo do Tema",
      "status": "topic_pending_supervisor"
    },
    "documents": [
      {
        "id": 1,
        "document_type": "protocol",
        "file_name": "protocol-1.docx",
        "file_path": "protocols/1/protocol-1.docx",
        "file_url": "http://127.0.0.1:8000/storage/protocols/1/protocol-1.docx",
        "pages": null,
        "version": 1,
        "status": "active",
        "submitted_at": "2026-07-07T14:30:00Z"
      }
    ]
  }
}
```

Notas:

- O código do protocolo é gerado automaticamente no padrão `PTM####E`.
- O protocolo é submetido pelo estudante dono do tema (após submeter, aguarda decisão do supervisor).
- Apenas o estudante dono do tema pode submeter o protocolo.
- Apenas o supervisor atribuído ao tema pode aprovar ou rejeitar o protocolo.
- Após rejeição, o estudante pode submeter uma nova versão do protocolo.
- Em cada nova submissão, `submission_number` incrementa e os documentos anteriores do mesmo protocolo ficam `inactive`.
/- Ao aprovar pelo supervisor e encaminhar ao Nucleo, `version` fica no formato `NC_V{submission_number}`.
- Os documentos são guardados na tabela `documents` e ligados ao protocolo via `protocol_id`.
- Cada versão de documento tem um número de versão e um tipo de documento (`protocol`, `comprovativo`, etc).
- O `file_url` é gerado automaticamente a partir de `file_path` para facilitar o acesso ao ficheiro via HTTP.
- O estudante pode submeter múltiplos documentos comprovativos relacionados ao protocolo (futuro endpoint).

## APIs futuras do módulo Protocol

| Método | Rota | Proteção | Estado |
| --- | --- | --- | --- |
| PATCH | `/topics/{id}/approve` | secretário / permissão de aprovação | futura |
| PATCH | `/topics/{id}/reject` | secretário / permissão de rejeição | futura |
| POST | `/protocols/{id}/versions` | estudante autenticado | futura |
| PATCH | `/protocols/{id}/advance` | secretário | futura |
| PATCH | `/protocols/{id}/return` | secretário | futura |
| POST | `/protocols/{id}/reviews` | revisor | futura |
| POST | `/protocols/{id}/harmonize` | harmonizador | futura |
| PATCH | `/protocols/{id}/accept-harmonization` | externo | futura |
| GET | `/protocols/{id}/history` | autenticado | futura |

## Observações do módulo

1. O prefixo real das rotas do módulo é carregado pelo provider do Protocol.
2. A submissão de temas usa política de acesso via `TopicPolicy`.
3. O estado inicial de um tema é `topic_pending_supervisor`.
4. O comentário do revisor é guardado em `topic_review_comments` e referenciado em `topic_review_evaluations.comment_id`.
5. O protocolo é uma entidade separada do tema e aceita apenas ficheiros `.docx`.
6. O código anónimo do protocolo segue o padrão `PTM####E`.
