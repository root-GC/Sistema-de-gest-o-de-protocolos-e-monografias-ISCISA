# API de Protocolos — Documentação

Base URL: `/api/v1`  
Autenticação: `Bearer token` (Sanctum)  
Content-Type: `application/json` (salvo onde indicado)

---

## 1. Submeter protocolo

`POST /api/v1/protocols`

Submete um protocolo .docx. Apenas o estudante dono do tópico pode submeter. Se existir
uma versão rejeitada, cria uma nova submissão com `submission_number` incrementado.

**Permissão:** Autenticado + dono do tópico.  
**Content-Type:** `multipart/form-data`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `topic_id` | integer | sim | ID do tópico aprovado |
| `protocol_type` | string | sim | Tipo de protocolo (max 100) |
| `document` | file | sim | Arquivo .docx (max 10MB) |

**Exemplo curl:**
```bash
curl -X POST http://localhost:8000/api/v1/protocols \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json" \
  -F "topic_id=6" \
  -F "protocol_type=protocol" \
  -F "document=@/home/estudante/protocolo.docx"
```

**Resposta 201:**
```json
{
  "message": "Protocolo submetido com sucesso.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_pending_supervisor",
    "status_label": "Aguardando aprovacao do supervisor",
    "submission_number": 1,
    "topic": {
      "id": 6,
      "title": "Titulo do Tema"
    },
    "documents": [
      {
        "id": 1,
        "file_name": "protocol-1-S1.docx",
        "file_url": "http://localhost:8000/storage/protocols/1/protocol-1-S1.docx",
        "version": 1,
        "status": "active"
      }
    ]
  }
}
```

---

## 2. Listar protocolos

`GET /api/v1/protocols`

Lista os protocolos. Se o usuário tiver permissão `protocol.view.all` retorna todos;
caso contrário retorna apenas os do estudante autenticado.

**Permissão:** Qualquer autenticado.

**Exemplo curl:**
```bash
curl http://localhost:8000/api/v1/protocols \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

**Resposta 200:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "PTM0001E",
      "status": "protocol_pending_supervisor",
      "status_label": "Aguardando aprovacao do supervisor",
      "protocol_type": "protocol",
      "submission_number": 1,
      "version": "1",
      "approved_by_supervisor": false,
      "submitted_at": "2026-07-07T14:30:00Z",
      "topic": {
        "id": 6,
        "title": "Titulo do Tema"
      },
      "documents": []
    }
  ]
}
```

---

## 3. Detalhar protocolo

`GET /api/v1/protocols/{id}`

Exibe um protocolo específico com tópico e documentos.

**Permissão:** Dono do protocolo ou `protocol.view.all`.

**Exemplo curl:**
```bash
curl http://localhost:8000/api/v1/protocols/1 \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

**Resposta 200:**
```json
{
  "data": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_pending_supervisor",
    "status_label": "Aguardando aprovacao do supervisor",
    "submitted_at": "2026-07-07T14:30:00Z",
    "approved_by_supervisor": false,
    "protocol_type": "protocol",
    "submission_number": 1,
    "version": "1",
    "supervisor_decision_at": null,
    "justification": null,
    "nc_version": 0,
    "cc_version": 0,
    "cb_version": 0,
    "topic": {
      "id": 6,
      "title": "Titulo do Tema",
      "status": "topic_approved_nucleo"
    },
    "documents": [
      {
        "id": 1,
        "file_name": "protocol-1-S1.docx",
        "file_url": "http://localhost:8000/storage/protocols/1/protocol-1-S1.docx",
        "version": 1,
        "status": "active",
        "submitted_by": { "id": 10, "name": "Joao Silva" },
        "submitted_at": "2026-07-07T14:30:00Z"
      }
    ]
  }
}
```

---

## 4. Aprovar protocolo (supervisor)

`PATCH /api/v1/protocols/{id}/supervisor-approve`

Supervisor aprova o protocolo. O status transita para `protocol_pending_nucleo`
e a versão passa a `NC_V{submission_number}`.

**Permissão:** Supervisor do tópico.

**Body:** vazio (`{}`)

**Exemplo curl:**
```bash
curl -X PATCH http://localhost:8000/api/v1/protocols/1/supervisor-approve \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Resposta 200:**
```json
{
  "message": "Protocolo aprovado pelo supervisor.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_pending_nucleo",
    "status_label": "Aguardando avaliacao do Nucleo Cientifico",
    "version": "NC_V1"
  }
}
```

---

## 5. Rejeitar protocolo (supervisor)

`PATCH /api/v1/protocols/{id}/supervisor-reject`

Supervisor rejeita o protocolo. O status volta para `protocol_rejected_supervisor`.
O estudante pode reenviar uma nova versão.

**Permissão:** Supervisor do tópico.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `justification` | string | não | Motivo da rejeição (max 5000) |

**Exemplo curl:**
```bash
curl -X PATCH http://localhost:8000/api/v1/protocols/1/supervisor-reject \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"justification": "O documento nao segue as normas do formato .docx."}'
```

**Resposta 200:**
```json
{
  "message": "Protocolo rejeitado pelo supervisor.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_rejected_supervisor",
    "status_label": "Rejeitado pelo supervisor",
    "justification": "O documento nao segue as normas do formato .docx.",
    "supervisor_decision_at": "2026-07-08T10:15:00Z"
  }
}
```

---

## 6. Listar protocolos para secretaria

`GET /api/v1/secretary/protocols`

Lista protocolos pendentes no Núcleo Científico (`protocol_pending_nucleo`
e `protocol_in_review_nucleo`) filtrados pelo órgão da secretária.
Inclui dados completos do estudante, supervisor e atribuições de revisão.

**Permissão:** `protocol.assign`

**Exemplo curl:**
```bash
curl http://localhost:8000/api/v1/secretary/protocols \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

**Resposta 200:**
```json
{
  "data": [
    {
      "id": 1,
      "code": "PTM0001E",
      "status": "protocol_pending_nucleo",
      "status_label": "Aguardando avaliacao do Nucleo Cientifico",
      "submission_number": 1,
      "version": "NC_V1",
      "student": { "id": 10, "name": "Joao Silva", "email": "joao@estudante.com" },
      "supervisor": { "id": 3, "name": "Dr. Mario Santos" },
      "topic": {
        "id": 6,
        "title": "Titulo do Tema",
        "scientific_area": { "id": 1, "name": "Saude Publica" },
        "course": { "id": 1, "name": "Medicina Geral" }
      },
      "documents": [
        { "id": 1, "file_name": "protocol-1-S1.docx", "file_url": "..." }
      ],
      "review_assignments": []
    }
  ]
}
```

---

## 7. Listar revisores elegíveis

`GET /api/v1/protocols/{id}/eligible-reviewers`

Retorna os professores que podem ser revisores do protocolo. Filtra pela área
científica do tópico e exclui o supervisor e revisores já atribuídos.

**Permissão:** `protocol.assign`

**Exemplo curl:**
```bash
curl http://localhost:8000/api/v1/protocols/1/eligible-reviewers \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

**Resposta 200:**
```json
{
  "data": [
    { "id": 5, "name": "Prof. Ana Maria", "email": "ana@iscisa.edu.mz", "scientific_area_name": "Saude Publica" },
    { "id": 8, "name": "Prof. Carlos Filipe", "email": "carlos@iscisa.edu.mz", "scientific_area_name": "Saude Publica" }
  ]
}
```

---

## 8. Atribuir revisores

`POST /api/v1/protocols/{id}/assign-reviewers`

Secretário atribui dois revisores ao protocolo. O status transita para
`protocol_in_review_nucleo`. Cria um registo em `protocol_review_assignments`.

**Permissão:** `protocol.assign` + ser da secretaria do mesmo órgão.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `reviewer_one_id` | integer | sim | ID do primeiro revisor |
| `reviewer_two_id` | integer | sim | ID do segundo revisor (diferente do primeiro) |

**Exemplo curl:**
```bash
curl -X POST http://localhost:8000/api/v1/protocols/1/assign-reviewers \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"reviewer_one_id": 5, "reviewer_two_id": 8}'
```

**Resposta 200:**
```json
{
  "message": "Revisores atribuidos com sucesso ao protocolo.",
  "protocol": {
    "id": 1,
    "code": "PTM0001E",
    "status": "protocol_in_review_nucleo",
    "status_label": "Em avaliacao pelo Nucleo Cientifico",
    "review_assignments": [
      {
        "id": 1,
        "reviewer_one": { "id": 5, "name": "Prof. Ana Maria" },
        "reviewer_two": { "id": 8, "name": "Prof. Carlos Filipe" },
        "status": "pending",
        "assigned_at": "2026-07-08T11:00:00Z"
      }
    ]
  }
}
```

---

## 9. Listar protocolos para revisor

`GET /api/v1/reviewer/protocols`

Lista os protocolos atribuídos ao revisor autenticado. A resposta omite dados
do estudante e supervisor (blind review). Cada item inclui `my_assignment` com
os detalhes da atribuição específica.

**Permissão:** `protocol.evaluate`

**Exemplo curl:**
```bash
curl http://localhost:8000/api/v1/reviewer/protocols \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

**Resposta 200:**
```json
{
  "data": [
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
        "title": "Titulo do Tema",
        "scientific_area": { "id": 1, "name": "Saude Publica" },
        "course": { "id": 1, "name": "Medicina Geral", "code": "MED01" }
      },
      "my_assignment": {
        "id": 1,
        "assigned_at": "2026-07-08T11:00:00Z",
        "status": "pending"
      }
    }
  ]
}
```

---

## Mapa de estados

```
Submisso do estudante
       │
       ▼
protocol_pending_supervisor
       │
       ├── supervisor-approve ──► protocol_pending_nucleo
       │                              │
       │                         assign-reviewers
       │                              │
       │                              ▼
       │                         protocol_in_review_nucleo
       │                              │
       │                         (avaliacao dos revisores)
       │
       └── supervisor-reject ──► protocol_rejected_supervisor
                                      │
                                 estudante reenvia
                                      │
                                      ▼
                              protocol_pending_supervisor
```

Estados futuros (mapeados no modelo mas sem endpoints implementados):
`protocol_pending_comite_cientifico`, `protocol_pending_comite_bioetica`,
`protocol_approved_final`, `protocol_rejected_final`.

---

## Regras de negócio

- O documento deve ser `.docx` válido (max 10MB).
- O `code` é gerado automaticamente no formato `PTM####E`.
- O `submission_number` incrementa a cada reenvio após rejeição.
- O supervisor não pode ser atribuído como revisor.
- Os dois revisores devem ser diferentes entre si.
- O revisor não pode ser reatribuído a um protocolo onde já está alocado.
- A secretária só vê protocolos do seu próprio órgão.
