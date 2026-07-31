# Módulo Monograph — SGPMC-ISCISA

Módulo responsável pela **Fase 4 — Direcção Científica** do sistema: submissão,
aval do supervisor e verificação documental da monografia final, desde a
aprovação do protocolo até à monografia ficar `verificada` e pronta para a
fase de júri/defesa (módulo `Defense`).

Comunicação com outros módulos é feita **exclusivamente por eventos**
(Observer Pattern) — o Monograph nunca importa classes internas do Protocol
ou vice-versa.

---

## 1. Workflow

```
[Protocolo aprovado no módulo Protocol]
            │
            ▼ evento ProtocolApproved
   listener OnProtocolApproved cria Monograph
            │
            ▼
      aguarda_submissao
            │
            ▼ POST /monographs/{id}/submit          (estudante)
        submetida
            │
            ▼ POST /monographs/{id}/endorse          (supervisor)
   ┌────────┴────────┐
aprovado          devolvido
   │                  │
   ▼                  ▼
verificacao_      devolvida ──► estudante corrige e volta a /submit
documental             (cria nova versão, exige novo aval do supervisor)
   │
   ▼ POST /monographs/{id}/verify                    (secretário/coordenador)
┌──┴───┐
aprovado   devolvido
   │          │
   ▼          ▼
verificada   devolvida (mesmo ciclo acima)
   │
   ▼
[evento MonographVerified — módulo Defense assume a partir daqui]
```

Cada tentativa de submissão gera uma **versão** própria (`monograph_submissions`),
nunca substitui a anterior. Cada versão pode receber uma ou duas decisões
(`monograph_reviews`): uma do supervisor, e se aprovado, outra do órgão
(secretaria/coordenação). Comentários livres (`monograph_comments`), de
qualquer uma das partes, ficam presos à versão comentada, independentemente
de haver ou não uma decisão formal.

---

## 2. Modelo de dados

| Tabela                                          | Descrição                                                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `monographs`                                    | Entidade central. Estado actual, ligação ao protocolo, estudante e supervisor.                                          |
| `monograph_documents` _(geral, fora do módulo)_ | Ficheiros físicos submetidos — cada versão tem o seu próprio registo, nunca sobrescrito.                                |
| `monograph_submissions`                         | Liga uma monografia a uma versão de documento. Uma linha por tentativa de submissão.                                    |
| `monograph_reviews`                             | Uma decisão (aprovado/devolvido) sobre uma submissão — guarda `stage` (`supervisor` \| `orgao`), quem decidiu e porquê. |
| `monograph_comments`                            | Comentários livres de supervisor/secretaria/coordenação sobre uma submissão, sem implicar decisão formal.               |

`monograph_documents` vive nas migrations **gerais** da aplicação (não dentro
do módulo) porque é uma tabela de infra-estrutura partilhável — outros
módulos podem vir a referenciá-la sem depender do ciclo de vida do Monograph.

### Estados (`monographs.status`)

```php
enum MonographStatus: string
{
    case AguardaSubmissao = 'aguarda_submissao';
    case Submetida = 'submetida';
    case Devolvida = 'devolvida';
    case VerificacaoDocumental = 'verificacao_documental';
    case Verificada = 'verificada';
}
```

---

## 3. Estrutura de ficheiros

```
Modules/Monograph/
├── app/
│   ├── Enums/MonographStatus.php
│   ├── Models/
│   │   ├── Monograph.php
│   │   ├── MonographSubmission.php
│   │   └── MonographReview.php
│   ├── Events/
│   │   ├── MonographForwardedToOrgan.php   # supervisor aprovou → órgão notificado
│   │   ├── MonographReturned.php           # devolvido (supervisor ou órgão)
│   │   └── MonographVerified.php           # aprovado pelo órgão — gancho para o módulo Defense
│   ├── Listeners/
│   │   ├── NotifyOrganOnForward.php
│   │   └── NotifyStudentOnReturn.php
│   ├── Services/
│   │   └── MonographService.php            # toda a lógica de negócio e transições de estado
│   ├── Policies/
│   │   └── MonographPolicy.php
│   ├── Http/
│   │   ├── Requests/
│   │   ├── Controllers/MonographController.php
│   │   └── ...
│   ├── Transformers/MonographResource.php
│   └── Providers/
│       ├── MonographServiceProvider.php
│       ├── RouteServiceProvider.php
│       ├── EventServiceProvider.php
│       └── AuthServiceProvider.php
├── database/
│   ├── migrations/          # monographs, monograph_submissions, monograph_reviews, monograph_comments
│   └── seeders/
│       ├── MonographDatabaseSeeder.php
│       └── MonographTestSeeder.php   # simula protocolo aprovado, sem depender do módulo Protocol
└── routes/api.php
```

---

## 4. Endpoints

| Método | Rota                        | Quem                                           | Permissão                                |
| ------ | --------------------------- | ---------------------------------------------- | ---------------------------------------- |
| GET    | `/monographs/{id}`          | estudante, supervisor, secretaria, coordenação | `monograph.view` \| `monograph.view.all` |
| GET    | `/monographs/{id}/history`  | idem                                           | idem                                     |
| POST   | `/monographs/{id}/submit`   | estudante (dono)                               | `monograph.submit`                       |
| POST   | `/monographs/{id}/endorse`  | supervisor (dono)                              | `monograph.endorse`                      |
| POST   | `/monographs/{id}/verify`   | secretaria \| coordenação                      | `monograph.validate`                     |
| POST   | `/monographs/{id}/comments` | supervisor \| secretaria \| coordenação        | `monograph.comment`                      |

### `submit`

```
Content-Type: multipart/form-data
file: <PDF>
```

### `endorse`

```json
{ "approved": true, "reason": "opcional se approved=false" }
```

### `verify`

```json
{
  "approved": true,
  "role": "secretary",
  "reason": "opcional se approved=false"
}
```

### `comments`

```json
{ "role": "supervisor", "comment": "Falta rever a bibliografia." }
```

---

## 5. Permissões (RBAC)

O sistema usa uma tabela `permissions` própria (`code`, `description`) e
`roles`/`user_roles`/`role_permissions` — **não** o pacote Spatie Permission,
apesar de estar instalado no `composer.json`.

| Permissão            | Role(s)                                  |
| -------------------- | ---------------------------------------- |
| `monograph.submit`   | `student`                                |
| `monograph.endorse`  | `supervisor`                             |
| `monograph.validate` | `secretary`, `coordinator`               |
| `monograph.comment`  | `supervisor`, `secretary`, `coordinator` |
| `monograph.view.all` | `secretary`, `coordinator`               |

`monograph.endorse` e `monograph.comment` são específicas deste módulo e
associadas via `MonographTestSeeder::grantPermission()` — as restantes já
vêm definidas no `RoleSeeder` geral do módulo `Auth`.

---

## 6. Eventos — pontos de integração

| Evento                      | Disparado quando                   | Quem escuta                            |
| --------------------------- | ---------------------------------- | -------------------------------------- |
| `MonographForwardedToOrgan` | Supervisor aprova (`endorse`)      | Notifica secretárias do órgão          |
| `MonographReturned`         | Devolvido, por supervisor ou órgão | Notifica o estudante                   |
| `MonographVerified`         | Órgão aprova (`verify`)            | **Ponto de entrada do módulo Defense** |

O módulo Monograph, por sua vez, escuta:

| Evento (de outro módulo)           | Listener             | Efeito                                            |
| ---------------------------------- | -------------------- | ------------------------------------------------- |
| `Protocol\Events\ProtocolApproved` | `OnProtocolApproved` | Cria a `Monograph` inicial em `aguarda_submissao` |

> `OnProtocolApproved` só é registado quando o módulo `Protocol` expõe de
> facto o evento `ProtocolApproved` — até lá, usa-se o `MonographTestSeeder`
> para simular esse ponto de entrada em ambiente de desenvolvimento.

---

## 7. Correr localmente

```bash
php artisan module:migrate Monograph
php artisan module:seed Monograph
```

ou, para reconstruir tudo do zero (recomendado durante o desenvolvimento):

```bash
php artisan migrate:fresh --seed
```

O `MonographTestSeeder` cria um protocolo e monografia de teste, ligados aos
utilizadores do `TestUserSeeder` (módulo Auth):

| Papel      | Email                     | Password      |
| ---------- | ------------------------- | ------------- |
| Estudante  | `estudante@iscisa.ac.mz`  | `password123` |
| Supervisor | `docente@iscisa.ac.mz`    | `password123` |
| Secretário | `secretario@iscisa.ac.mz` | `password123` |

---

## 8. Versionamento e histórico

Nada é sobrescrito. Cada `submit` cria sempre uma nova versão, mesmo depois
de devoluções sucessivas — o endpoint `GET /monographs/{id}/history` devolve
o histórico completo por versão, incluindo ficheiro, decisões (`stage`,
`decision`, `reason`, quem decidiu) e comentários associados a cada uma.

```
GET /monographs/1/history

[
  {
    "version": 1,
    "file": "monografia_v1.pdf",
    "reviews": [
      { "stage": "supervisor", "decision": "devolvido", "reason": "Falta bibliografia" }
    ],
    "comments": []
  },
  {
    "version": 2,
    "file": "monografia_v2.pdf",
    "reviews": [
      { "stage": "supervisor", "decision": "aprovado" },
      { "stage": "orgao", "role": "secretary", "decision": "aprovado" }
    ],
    "comments": [
      { "role": "secretary", "comment": "Falta declaração de originalidade — corrigido pelo estudante." }
    ]
  }
]
```

---

## 9. O que fica fora deste módulo

- **Júri e defesa** — módulo `Defense`, activado pelo evento `MonographVerified`.
- **Avaliação científica por revisores da Bioética** — ainda não implementado;
  quando for, deve seguir o mesmo padrão de `protocol_review_assignments`
  (módulo Protocol), como `monograph_review_assignments`.
