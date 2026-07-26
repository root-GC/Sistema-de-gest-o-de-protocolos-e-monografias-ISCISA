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
ONLYOFFICE_DOCUMENT_URL=http://host.docker.internal:8000
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

## 5. Gestão de Utilizadores e Hierarquia Administrativa

### Status: Implementado (base)

Foi implementado o modelo inicial de autenticação e controlo de acesso.

### 5.1 Hierarquia administrativa

A lógica de hierarquia adotada:

```
Administrador Técnico (Super Admin)
        |
        | cria
        ↓
Administrador Administrativo (ex: Dr. Dulnério)
        |
        | cria
        ↓
Executivos dos Órgãos
(Núcleo, Comité Científico, Bioética...)
        |
        | criam
        ↓
Secretários
        |
        ↓
Docentes / Estudantes
(registo público)
```

### 5.2 Super Admin (Administrador Técnico)

O sistema possui um utilizador inicial de infraestrutura, criado via Seeder:

- Criado através de `SuperAdminSeeder`
- Credenciais carregadas através de variáveis de ambiente:
  - `SUPER_ADMIN_EMAIL`
  - `SUPER_ADMIN_PASSWORD`
- Não participa no fluxo académico
- Não é criado via interface
- Possui acesso global ao sistema

Responsabilidades:
- Gestão técnica da plataforma
- Gestão de utilizadores e permissões
- Configuração inicial do sistema

**Recomendação de robustez para o Seeder:** remover o fallback de senha hardcoded (`'MudeEstaPassword!123'`) e falhar explicitamente se a variável não estiver definida, para evitar subir produção com senha padrão:

```php
if (! $password) {
    throw new \RuntimeException(
        'SUPER_ADMIN_PASSWORD não definida no .env'
    );
}
```

**Recomendação de roles:** não misturar `admin` com `superadmin` na mesma role. Manter roles separadas:

```
super_admin
admin
coordinator
secretary
...
```

O Super Admin não é apenas um admin com mais permissões — é uma entidade de bootstrap da infraestrutura. Isto evita que alguém no sistema consiga criar outro "super admin" por engano.

### 5.3 Autenticação

Implementado:

- [x] Login
- [x] Registo público
- [x] Verificação por OTP via email
- [x] Recuperação de senha
- [x] Gestão de roles e permissions

Pendências:

- [ ] Interface para criação de administradores administrativos
- [ ] Gestão de executivos dos órgãos
- [ ] Gestão de secretários pelos executivos
- [ ] Auditoria de alterações administrativas

### 5.4 Boas práticas de `.env` / `.env.example`

- Variáveis sensíveis (`SUPER_ADMIN_PASSWORD`, chaves de API como `BREVO_API_KEY`) devem existir no `.env.example` **apenas com o nome**, sem valor real:

```env
# Super Admin credentials
# Usadas apenas no bootstrap inicial do sistema
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=

BREVO_API_KEY=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="SGPMC ISCISA"
```

- O `.env` real (com valores verdadeiros) fica só na máquina/servidor e nunca vai para o repositório.

> ⚠️ **Nota de segurança:** uma chave `BREVO_API_KEY` real foi partilhada nesta conversa/documentação. Recomenda-se **revogar essa chave no painel do Brevo e gerar uma nova**, já que qualquer chave exposta em chat, documentação ou repositório deve ser considerada comprometida.

---

## 4. Resumo de Pendências (TODO geral)

- [ ] Justificação no fluxo de protocolos (controller + frontend)
- [ ] Corrigir perda de documento na transição entre núcleos
- [ ] Concluir integração ONLYOFFICE (versionamento em `protocoldocumentos`, webhooks de save)
- [x] Implementar/validar `DashboardController` e `config/dashboard.php` no backend
- [ ] Expor `/api/auth/me` com dados completos do utilizador (roles, permissões, órgão, curso)
- [ ] Interface para criação de administradores administrativos
- [ ] Gestão de executivos dos órgãos e secretários
- [ ] Auditoria de alterações administrativas
- [ ] Separar roles `super_admin` / `admin` / `coordinator` / `secretary`
- [ ] Remover fallback de senha hardcoded no `SuperAdminSeeder`
- [ ] Revogar e substituir a `BREVO_API_KEY` exposta