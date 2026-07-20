# Dashboard — Backend

> Implementação do backend para o dashboard do SGPMC.
> Feature: `POST /api/dashboard` — agrega dados de widgets autorizados por permissão do utilizador.

---

## Endpoints

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| `POST` | `/api/dashboard` | Recebe lista de widgets, filtra por permissões, devolve dados | `auth:sanctum` |

### Request

```json
{
  "widgets": ["myProtocols", "notifications", "adminPanel"]
}
```

### Response (200)

```json
{
  "widgets": {
    "myProtocols": { "total": 5 },
    "notifications": {}
  },
  "user": {
    "id": 1,
    "name": "João",
    "email": "joao@example.com",
    "status": "active",
    "roles": ["teacher"],
    "permissions": ["protocol.view", "reports.view"],
    "profiles": { "teacher": { ... } }
  },
  "meta": {
    "timestamp": "2026-07-18T12:00:00+00:00",
    "widgets_requested": 3,
    "widgets_authorized": 2
  }
}
```

---

## Ficheiros criados

### `config/dashboard.php`
Mapa de permissões por widget. Define quais as permissões necessárias e a regra (UMA ou TODAS).

| Widget | Permissões | Regra |
|--------|------------|-------|
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
| `quickActions` | — | público |

### `Modules/Auth/app/Http/Controllers/DashboardController.php`

| Método | Descrição |
|--------|-----------|
| `index(Request)` | Handler do `POST /api/dashboard`. Lê `widgets[]`, filtra autorizados, devolve resposta |
| `filterAuthorizedWidgets(array, User)` | Privado. Aplica lógica: widget não configurado → negado; `permissions: []` → público; `any_permission` → `hasAnyPermission()`; senão → `hasAllPermissions()` |
| `fetchWidgetData(string, User)` | Privado. Prepara dados mock/placeholder para cada widget |

### `Modules/Auth/routes/api.php`
Rota adicionada:
```php
Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::post('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard.index');
});
```

### `tests/Feature/DashboardControllerTest.php`
6 testes de feature:

| Teste | O que verifica |
|-------|----------------|
| `test_guest_gets_401` | Sem token → 401 |
| `test_authenticated_user_sees_only_public_widgets` | User sem permissões só vê widgets públicos |
| `test_user_with_permission_sees_protected_widget` | User com `protocol.view` vê `myProtocols` |
| `test_user_without_permission_does_not_see_protected_widget` | User sem permissão não vê widget protegido |
| `test_unknown_widget_is_denied` | Widget inexistente no config é negado |
| `test_empty_widgets_list_returns_empty_response` | Lista vazia → widgets vazios |

---

## Ficheiros modificados

### `Modules/User/app/Models/User.php`
Adicionados dois métodos auxiliares de autorização:

```php
public function hasAnyPermission(array $codes): bool
public function hasAllPermissions(array $codes): bool
```

---

## Lógica de autorização (backend)

```
Widget solicitado
    │
    ├─ Não existe em config/dashboard.php  → ❌ NEGADO
    │
    ├─ 'permissions' não definido          → ❌ NEGADO
    │
    ├─ 'permissions' é []                  → ✅ PÚBLICO
    │
    ├─ any_permission = true               → hasAnyPermission()  → ✅ se user tiver ≥1
    │
    └─ any_permission = false (padrão)     → hasAllPermissions() → ✅ se user tiver todas
```

Isto garante **defense in depth**: o frontend filtra widgets para UX rápida, o backend revalida por segurança.

---

## Frontend (não modificado)

O frontend **já estava preparado** para consumir este endpoint:

| Ficheiro | O que faz |
|----------|-----------|
| `src/hooks/useDashboardData.ts` | Chama `POST /api/dashboard` com `{ widgets: [...] }`, espera `data.widgets[widgetId]` |
| `src/pages/dashboard/widgets.ts` | Define os 15 widgets com `id`, `permissions`, `anyPermission` |
| `src/pages/dashboard/DashboardPage.tsx` | Filtra widgets pelo `canAccessWidget()` do AuthContext e renderiza |

O backend foi implementado para **espelhar exactamente** o que o frontend já consumia.

## Dependências

- Utilizador autenticado via `auth:sanctum`
- `AuthPayloadBuilder` para montar payload do user (roles, permissions, profiles)
- `PermissionMiddleware` registado como alias `permission`
