# Monograph — Documentação

Resumo rápido

- A monografia é identificada por um código cego no formato `ISCISA-M%03d-YYYY` (ex.: `ISCISA-M001-2026`).
- O modelo `Monograph` usa `code` para route model binding (`getRouteKeyName()`), portanto rotas podem receber o código em vez do id numérico.
- Quando uma monografia é verificada (pelo papel autorizado - secretaria da direcção científica), é criado automaticamente um registro de `Defense` (integração Monograph → Defense).

Principais rotas (API)

- GET /api/monographs/{monograph}
    - Mostra a monografia (binding por `code`).
- GET /api/monographs/{monograph}/download
    - Faz download da última submissão (PDF) — usado para dar acesso cego aos jurados.
- POST /api/monographs/{monograph}/submit
    - Submeter versão (permission: `monograph.submit`).
- POST /api/monographs/{monograph}/endorse
    - Orientador endossa a submissão (permission: `monograph.endorse`).
- POST /api/monographs/{monograph}/verify
    - Secretaria valida/verifica a monografia (permission: `monograph.validate`) — cria a `Defense`.
- POST /api/monographs/{monograph}/comments
    - Adicionar comentário (permission: `monograph.comment`).

Regras importantes

- Identificação cega: Use sempre `code` para disponibilizar e-mails/links aos jurados (não enviar attachments com metadados do autor).
- A verificação final (mudança de status que aciona a criação da `Defense`) só deve ser feita pela secretaria da `scientific_direction` — a política foi atualizada para refletir isso.

Seeders e testes

- `Modules\Monograph\database\seeders\MonographTestSeeder.php` cria dados mínimos para testes:
    - Usuários: estudante, docente (orientador), secretário, coordenador.
    - Topic, Protocol e Monograph com código `ISCISA-M001-YYYY`.
- Executar localmente:

```bash
php artisan migrate:fresh --seed
php artisan db:seed --class=Modules\\Monograph\\database\\seeders\\MonographTestSeeder
```

- Testes unitários/funcionais para fluxo de monografia (submit → endorse → verify) estão em `Modules/Monograph/tests`.

Como verificar manualmente

1. Atribua júri via endpoint de `Defense` (ver doc do módulo `Defense`).
2. Para dar aos jurados acesso, use o link:
   `/api/monographs/{MONOGRAPH_CODE}/download`
3. Todas as ações que tocam monografia (endorse, verify) respeitam as políticas definidas em `Modules/Monograph/app/Policies/MonographPolicy.php`.

Notas de implementação

- A coluna `code` deve existir na tabela `monographs` (migration já presente). Caso seja necessário regenerar códigos, a lógica de geração está centralizada no seeder e criação de monografia.
- Não exponha nomes/autores nos e-mails de convite às bancas — apenas o código e links para download.

Fim da documentação do módulo Monograph.
