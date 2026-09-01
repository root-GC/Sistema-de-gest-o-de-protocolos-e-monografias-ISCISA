# SGPMC — Features Feitas / Melhoradas

> Sistema de Gestão de Monografias e Protocolos (Laravel + React/TypeScript)

---

## 1. Fluxo de Protocolos e temas

### 1.1 Status: Funcional (com pendência)
O fluxo de temas já está a funcionar, mas falta:

- [ ] Adicionar campo/lógica de **justificação**
  - No **Controller** (backend)
  - No **frontend**

### 1.2 Bug conhecido: perda de documento entre núcleos
Ao passar o protocolo de um núcleo para outro, o documento associado está a **perder-se** (não é transferido/preservado corretamente). Precisa de investigação no fluxo de transição entre núcleos.

---

## 2. Edição de Documentos no Sistema (ONLYOFFICE)

Objetivo: permitir **abertura e edição** de documentos `.docx` diretamente no sistema, usando o **ONLYOFFICE** (open source).

### 2.1 Arquitetura
```
Laravel → Docker (ONLYOFFICE) → Laravel
```
- Criado um espaço Docker para o ambiente ONLYOFFICE
- Instalado o ambiente e conectado ao serviço Laravel
- Testado no módulo **Protocol**

### 2.2 Rotas
```php
Route::prefix('api')->middleware(['api'])->group(function () {

    Route::get('/onlyoffice/config',
        [OnlyOfficeController::class, 'config']
    );

    Route::post('/protocolo/onlyoffice/callback',
        [OnlyOfficeController::class, 'callback']
    );
});
```

### 2.3 Controller
- `OnlyOfficeController`

### 2.4 Variáveis de ambiente (Docker)
```env
ONLYOFFICE_DOCUMENT_URL=http://127.0.0.1:8000
ONLYOFFICE_URL=http://127.0.0.1:8088
ONLYOFFICE_BACKEND_PORT=8000
ONLYOFFICE_URL=http://localhost
ONLYOFFICE_JWT_SECRET=iscisa_secret_2026453456534563563463546545635463456345643564356
FILESYSTEM_DISK=public
```

### 2.5 Pendências
- Persistência de versões do documento numa tabela `protocoldocumentos`
- Fluxo completo OAuth2 / JWT embedding / webhooks para eventos de "save"
- Resolver a perda de documento entre núcleos (ver item 1.2), que afeta diretamente esta integração

---

## 3. Backend — Informação de Utilizadores / Dashboard

> Necessário trazer informação dos utilizadores a partir do backend. Especificação completa do que se espera do backend:

### 3.1 Rotas do Dashboard
```php
/*
|--------------------------------------------------------------------------
| Dashboard API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // POST /api/dashboard
    // Recebe lista de widgets solicitados e retorna apenas os dados autorizados
    Route::post('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard.index');

    // Dados do usuário autenticado (permissões, roles, etc.)
    Route::get('/auth/me', [DashboardController::class, 'me'])
        ->name('auth.me');

    // Endpoints individuais para widgets específicos (opcional, tempo real)
    Route::get('/dashboard/my-protocols', [DashboardController::class, 'myProtocols'])
        ->name('dashboard.my-protocols')
        ->middleware('permission:protocol.view');

    Route::get('/dashboard/pending-reviews', [DashboardController::class, 'pendingReviews'])
        ->name('dashboard.pending-reviews')
        ->middleware('permission:protocol.review');

    Route::get('/dashboard/pending-triage', [DashboardController::class, 'pendingTriage'])
        ->name('dashboard.pending-triage')
        ->middleware('permission:protocol.triage');

    Route::get('/dashboard/workload', [DashboardController::class, 'workload'])
        ->name('dashboard.workload')
        ->middleware('permission:workload.view,workload.view.all');

    // ... outros endpoints específicos
});
```

### 3.2 Controller — `DashboardController`
Local: `Modules/Auth/Http/Controllers/DashboardController.php`

**Responsabilidades:**

| Método | Rota | Descrição |
|---|---|---|
| `index()` | `POST /api/dashboard` | Recebe `widgets[]`, carrega roles/permissões do user, filtra widgets autorizados e devolve os dados de cada um |
| `me()` | `GET /api/auth/me` | Devolve dados do utilizador autenticado: id, nome, email, avatar, permissões, roles, órgão, curso |
| `filterAuthorizedWidgets()` | — | Filtra a lista de widgets pedidos com base nas permissões definidas em `config/dashboard.php` |

**Lógica de autorização de widgets (`filterAuthorizedWidgets`):**
- Widget sem permissões configuradas → **negado**
- Widget com `permissions: []` → **público**
- `any_permission = true` → basta o user ter **uma** das permissões (`hasAnyPermission`)
- `any_permission = false` → user precisa de **todas** as permissões (`hasAllPermissions`)

**Resposta de `index()`:**
```json
{
  "widgets": { "...": "dados por widget autorizado" },
  "user": {
    "id": 1,
    "name": "...",
    "permissions": ["..."],
    "roles": ["..."]
  },
  "meta": {
    "timestamp": "...",
    "widgets_requested": 0,
    "widgets_authorized": 0
  }
}
```

### 3.3 Configuração — `config/dashboard.php`
Mapa de permissões por widget:

| Widget | Permissões | Regra |
|---|---|---|
| `myProtocols` | `protocol.view` | todas |
| `pendingTriage` | `protocol.triage` | todas |
| `documentValidation` | `document.validate` | todas |
| `pendingReviews` | `protocol.review` | todas |
| `reviewerAssignment` | `protocol.assign`, `reviewer.assign` | todas |
| `workloadView` | `workload.view`, `workload.view.all` | qualquer uma |
| `pendingEvaluations` | `evaluation.create` | todas |
| `evaluationResults` | `evaluation.view`, `evaluation.view.own`, `evaluation.view.all` | qualquer uma |
| `defenseSchedule` | `defense.view` | todas |
| `juryParticipation` | `defense.jury.participate` | todas |
| `supervisionStudents` | `supervision.view` | todas |
| `protocolStats` | `reports.view`, `reports.view.all` | qualquer uma |
| `reportsPanel` | `reports.view`, `reports.view.all` | qualquer uma |
| `adminPanel` | `admin.users`, `admin.organs`, `admin.settings`, `admin.reports` | qualquer uma |
| `notifications` | — | público |
| `deadlines` | — | público |

---

## 4. Resumo de Pendências (TODO geral)

- [ ] Justificação no fluxo de protocolos (controller + frontend)
- [ ] Corrigir perda de documento na transição entre núcleos
- [ ] Concluir integração ONLYOFFICE (versionamento em `protocoldocumentos`, webhooks de save)
- [x] Implementar/validar `DashboardController` e `config/dashboard.php` no backend
- [ ] Expor `/api/auth/me` com dados completos do utilizador (roles, permissões, órgão, curso)
