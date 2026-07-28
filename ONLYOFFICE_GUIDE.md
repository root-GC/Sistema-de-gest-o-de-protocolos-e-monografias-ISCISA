# Integração ONLYOFFICE — Guia de Implementação

## Visão Geral

O ONLYOFFICE Document Server é o editor de documentos oficial do SGPC-ISCISA. Substitui visualizadores externos (Google Docs) e permite edição, track changes e comentários directamente na plataforma.

## Fluxo

```
Secretaria
     │
     ▼
Atribui revisores
     │
     ▼
Revisor abre protocolo
     │
     ▼
ONLYOFFICE
     │
     ├── lê documento
     ├── comenta
     ├── faz track changes
     └── grava
     │
     ▼
Preenche ficha de avaliação
     │
     ▼
Submete avaliação
```

O editor é o mesmo para todos os órgãos (Núcleo, Comité Científico, Bioética, Direcção). O que muda são permissões, documento aberto e formulário de avaliação associado.

## Arquitectura

```
┌───────────────────────────────────────────────────────────────────┐
│  React Frontend :5173                                            │
│                                                                   │
│  1. GET /api/onlyoffice/config/{protocol} (com Bearer token)      │
│  2. Backend devolve config + JWT                                  │
│  3. <DocumentEditor> renderiza (busca doc do DS)                 │
│  4. Utilizador edita/comenta                                      │
│  5. ONLYOFFICE DS chama callback → Backend guarda nova versão    │
│                                                                   │
└──────────────────────────┬────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│  Laravel Backend :8000                                           │
│                                                                   │
│  GET  /api/onlyoffice/config/{protocol}  → gera config + JWT     │
│  POST /api/protocolo/onlyoffice/callback → recebe doc editado    │
│                                                                   │
│  - Busca documento activo do protocolo                            │
│  - Gera key = protocol_{id}_v{version}                           │
│  - Define modo (edit/review/comment/view) conforme role          │
│  - Callback: baixa .docx, marca anterior inactive, cria nova     │
│    versão na tabela documents                                     │
└──────────────────────────┬────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│  ONLYOFFICE Document Server :8088                                │
│                                                                   │
│  - Valida JWT                                                     │
│  - Busca ficheiro da URL no config                                │
│  - Renderiza editor                                                │
│  - Track changes, comentários, edição                             │
│  - Dispara callback para o Laravel quando salva                  │
└───────────────────────────────────────────────────────────────────┘
```

## Rotas

### Públicas (ONLYOFFICE DS chama, sem auth Laravel)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/protocolo/onlyoffice/callback` | ONLYOFFICE DS envia documento editado |

### Autenticadas (auth:sanctum)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/onlyoffice/config/{protocol}` | Configuração do editor para um protocolo |

## Modos por Role

| Role | Modo | Track Changes | Permissões |
|------|------|---------------|------------|
| Estudante (dono) | `edit` | Sim | Edita, aceita/rejeita alterações |
| Supervisor | `review` | Sim | Vê alterações, aceita/rejeita |
| Revisor | `comment` | Não | Só comentários |
| Secretário | `view` | Não | Só visualizar |
| Admin | `edit` | Sim | Edita, aceita/rejeita |

## Callback

Quando o utilizador salva no ONLYOFFICE, o DS envia `POST /api/protocolo/onlyoffice/callback` com:

```json
{
  "status": 1,
  "url": "http://onlyoffice/temp/doc.docx",
  "key": "protocol_42_v3",
  "users": [...],
  "changeshistory": [...]
}
```

O backend:
1. Verifica se `status` é 1 (pronto para guardar) ou 6 (forçar salvar)
2. Extrai `protocol_id` da `key` (ex: `protocol_42_v3` → protocol_id=42)
3. Baixa o .docx da `url` fornecida pelo DS
4. **Sobrescreve** o ficheiro actual no storage (mesmo `file_path`)
5. Faz `touch()` no registo `Document` para actualizar `updated_at`
6. Devolve `{ error: 0 }`

**Nota:** O ONLYOFFICE não cria novas versões na BD. A versão (S1, S2, S3) só muda quando o estudante re-submete o protocolo após rejeição. O track changes é visual no editor — o backend não guarda histórico.

## Estrutura de Storage

```
storage/app/public/
├── protocols/
│   ├── 42/
│   │   └── protocol-42-S1.docx   ← Sempre o mesmo ficheiro, sobrescrito
│   └── 43/
│       └── protocol-43-S1.docx
└── documents/
    └── teste.docx                 ← Ficheiro de teste
```

## Frontend — Componentes (PENDENTE — implementação futura)

### `OOEditor.tsx` (não criado)
Componente React que recebe `protocolId` e `onClose`. Usa `onlyOfficeService.getConfig(protocolId)` para obter config do backend e renderiza `<DocumentEditor>` do `@onlyoffice/document-editor-react`.

### `onlyOfficeService.ts` (não alterado)
Serviço com método `getConfig(protocolId?)` — se receber protocolId, chama `/api/onlyoffice/config/{protocolId}`; senão, chama `/api/onlyoffice/config` (para teste).

### Onde será usado

| Página | Role | Localização |
|--------|------|-------------|
| EvaluationPage | Revisor | Substitui Google Docs iframe (split-view) |
| ProtocolPage (student) | Estudante | Modal ao clicar "Editar Online" |
| SupervisorProtocolDetailPage | Supervisor | Modal ao clicar "Editar Online" |

## Variáveis de Ambiente

### Backend (.env)

```
ONLYOFFICE_JWT_SECRET=iscisa_secret_2026453456534563563463546545635463456345643564356
ONLYOFFICE_DOCUMENT_URL=http://host.docker.internal:8000
FILESYSTEM_DISK=public
```

### Frontend (.env)

```
VITE_DOCUMENT_SERVER_URL=http://localhost:8088
```

## Docker Compose

```yaml
version: '3'
services:
  onlyoffice-document-server:
    image: onlyoffice/documentserver:latest
    container_name: onlyoffice-ds
    ports:
      - "8088:80"
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=iscisa_secret_2026453456534563563463546545635463456345643564356
      - WOPI_ENABLED=false
    volumes:
      - onlyoffice_data:/var/www/onlyoffice/Data
      - onlyoffice_log:/var/log/onlyoffice
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"

volumes:
  onlyoffice_data:
  onlyoffice_log:
```

## Estado da Implementação

### Concluído (Backend)

- [x] OnlyOfficeController com configForProtocol, resolveMode, callback
- [x] Rotas actualizadas (api.php)

### Pendente (Frontend)

- [ ] OOEditor.tsx — componente React que consome GET /api/onlyoffice/config/{protocol}
- [ ] onlyOfficeService.ts — adicionar método getConfig(protocolId)
- [ ] EvaluationPage — substituir Google Docs iframe pelo OOEditor
- [ ] ProtocolPage — botão "Editar Online" com modal do OOEditor
- [ ] SupervisorProtocolDetailPage — botão "Editar Online" com modal do OOEditor
- [ ] Adicionar VITE_DOCUMENT_SERVER_URL ao .env do frontend

### Ambiente

- [ ] Docker compose para ONLYOFFICE Document Server
- [ ] .env do backend já configurado
