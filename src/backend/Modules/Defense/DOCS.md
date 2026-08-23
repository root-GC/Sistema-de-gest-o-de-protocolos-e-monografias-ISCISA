# Defense — Documentação

Resumo rápido

- A `Defense` é criada automaticamente quando a monografia é verificada; também existe um fluxo para gerir júri e datas.
- Respeita identificação cega: todas as referências públicas enviadas aos jurados usam o `monograph.code`.

Principais rotas (API)

- GET /api/defenses/{defense}
    - Mostra a defesa; o binding `{defense}` agora aceita o `monograph.code` (ex.: `ISCISA-M001-2026`).
- POST /api/defenses/{defense}/jury
    - Atribuir júri — agora exige exatamente 2 membros:
        - `presidente` e `arguente` (fields: `members[]: {teacher_id, jury_role}`)
        - Permission: `defense.jury.assign`
- POST /api/defenses/{defense}/schedule/set-by-secretary
    - Secretaria grava a data negociada externamente e marca a defesa como agendada.
    - Não é necessário aceite do arguente quando a secretaria define a data.
- POST /api/defenses/{defense}/schedule/respond
    - Argüente responde a uma proposta de data (fluxo alternativo, usado quando coordenador propõe — atualmente desativado).
- POST /api/defenses/{defense}/grade
    - Registar nota final (permission: `defense.grade.record`).

Regras e comportamento

- Júri:
    - Apenas 2 membros são permitidos: `presidente` e `arguente`.
    - O supervisor (orientador) não pode fazer parte do júri.
- Notificações:
    - Ao atribuir júri:
        - Envia e‑mail aos membros do júri com link de download (usando `monograph.code`).
        - Regista notificações internas e envia e‑mail às secretárias do órgão atual do protocolo para que agendem a defesa.
    - Ao agendar a defesa (`schedule/set-by-secretary`):
        - Notifica internamente e envia e‑mail para estudante e supervisor; notifica internamente os membros do júri.
- Permissões:
    - Coordenador não propõe mais datas pelo sistema (a autorização foi desativada); a secretaria é responsável por gravar a data final.
    - O endpoint `schedule/set-by-secretary` está protegido por `DefensePolicy::scheduleBySecretary` (deve ser secretaria da `scientific_direction`).

Modelos importantes

- `Modules\Defense\app\Models\Defense` — relação `monograph()`; `jury()`; `finalDocuments()`.
- `Modules\Defense\app\Models\DefenseJuryAssignment` — regista tasks/assignments aos membros (created when jury assigned).

Seeders e testes

- Existem seeders para criar um cenário de defesa (ver `Modules\Defense\database\seeders`).
- Testes de fluxo estão em `Modules/Defense/tests/Feature/DefenseWorkflowTest.php`.

Como verificar manualmente

1. Atribua júri (somente presidente + arguente) e confirme que:
    - `defense_jury_assignments` contém entradas para presidente e arguente (prazo de 7 dias).
    - Notificações internas `defesa_juri_definido` existem para as secretárias.
    - Jobs/Emails com `SecretaryNotifyMail` e `JuryAssignmentMail` aparecem na fila (`jobs` table) ou foram enviados (driver `sync`).
2. Secretária usa o endpoint para definir a data:
    - `POST /api/defenses/{MONOGRAPH_CODE}/schedule/set-by-secretary` com `scheduled_at` e `location`.
    - Verificar notificações `defesa_agendada` para estudante, supervisor e júri; verificar emails `DefenseScheduledMail` para estudante e supervisor.

Notas de implementação

- Rota e binding: `Modules/Defense/app/Providers/RouteServiceProvider.php` define o binding `{defense}` para procurar a `Defense` cujo `monograph.code` corresponde ao valor recebido na rota.
- Emails e notificações usam filas (Mail::queue) — configure um worker local (`php artisan queue:work`) ou use `QUEUE_CONNECTION=sync` em desenvolvimento.

Fim da documentação do módulo Defense.
