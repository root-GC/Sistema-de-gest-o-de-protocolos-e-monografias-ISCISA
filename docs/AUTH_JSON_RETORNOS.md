# Auth API - Retornos JSON

Este documento descreve os retornos JSON dos endpoints de autenticacao do modulo Auth.

## Base

- Prefixo: `/api`
- Endpoints:
  - `POST /api/login`
  - `GET /api/me`
  - `POST /api/logout`

## 1) POST /api/login

### Request

```json
{
  "email": "admin@iscisa.ac.mz",
  "password": "password123"
}
```

### Sucesso (200)

```json
{
  "message": "Login efectuado com sucesso.",
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "name": "Admin Sistema",
    "email": "admin@iscisa.ac.mz",
    "status": "active",
    "roles": ["admin"],
    "permissions": ["admin.users", "admin.organs", "admin.reports", "admin.settings"],
    "profiles": {
      "admin": {
        "id": 1,
        "access_scope": "global",
        "organ": null
      }
    }
  }
}
```

### Erro de validacao (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["O email e obrigatorio."]
  }
}
```

Outras mensagens possiveis de validacao:

- `Formato de email invalido.`
- `A palavra-passe e obrigatoria.`
- `A palavra-passe deve ter pelo menos 6 caracteres.`

### Erro de credenciais (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["Credenciais invalidas ou conta inactiva."]
  }
}
```

## 2) GET /api/me

Requer token Bearer gerado no login.

### Header

```http
Authorization: Bearer <token>
Accept: application/json
```

### Sucesso (200)

```json
{
  "user": {
    "id": 2,
    "name": "Maria Coordenadora",
    "email": "coord@iscisa.ac.mz",
    "status": "active",
    "roles": ["teacher", "supervisor", "coordinator"],
    "permissions": ["protocol.view.all", "reviewer.assign", "reports.export"],
    "profiles": {
      "teacher": {
        "id": 3,
        "department": "Departamento de Enfermagem",
        "academic_degree": "doutoramento",
        "is_internal": true,
        "scientific_area": { "id": 2, "name": "Enfermagem" }
      },
      "supervisor": {
        "id": 3,
        "department": "Departamento de Enfermagem",
        "academic_degree": "doutoramento",
        "is_internal": true,
        "scientific_area": { "id": 2, "name": "Enfermagem" }
      },
      "coordinator": {
        "id": 1,
        "office": "Gabinete de Coordenacao - Edificio B",
        "course": { "id": 3, "name": "Enfermagem" },
        "scientific_area": { "id": 2, "name": "Enfermagem" }
      }
    }
  }
}
```

### Sem token / token invalido (401)

Resposta padrao Sanctum (pode variar conforme configuracao):

```json
{
  "message": "Unauthenticated."
}
```

## 3) POST /api/logout

Requer token Bearer.

### Sucesso (200)

```json
{
  "message": "Sessao encerrada."
}
```

## Utilizadores seed para testes de login

Todos usam a mesma password:

```text
password123
```

Emails disponiveis:

- `admin@iscisa.ac.mz`
- `coord@iscisa.ac.mz`
- `docente@iscisa.ac.mz`
- `revisora@iscisa.ac.mz`
- `secretario@iscisa.ac.mz`
- `estudante@iscisa.ac.mz`

## Exemplo rapido (cURL)

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@iscisa.ac.mz","password":"password123"}'
```
