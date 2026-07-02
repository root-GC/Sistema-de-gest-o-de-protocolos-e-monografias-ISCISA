O que acontece após aprovação do protocolo
1. O Módulo Protocol não "chama" o Módulo Monograph directamente
Num sistema modular, os módulos não se conhecem entre si directamente. A comunicação é feita via Eventos (Observer Pattern).
Módulo Protocol                    Módulo Monograph
     │                                    │
     │  dispara evento                    │
     ├──► ProtocolApproved ──────────────►│ Listener: OnProtocolApproved
     │                                    │   → cria registo em monographs
     │                                    │     (status: 'aguarda_submissao')
     │                                    │   → notifica estudante

2. O que o Módulo Protocol retorna / fornece
O evento ProtocolApproved carrega apenas o que o Monograph precisa:
php// Modules/Protocol/Events/ProtocolApproved.php

class ProtocolApproved
{
    public function __construct(
        public readonly string $submissionId,   // UUID da submissão
        public readonly string $studentId,      // para notificar
        public readonly string $supervisorId,   // associar à monografia
        public readonly string $title,          // título aprovado
        public readonly int    $courseId,       // curso
        public readonly int    $scientificAreaId
    ) {}
}

3. O ProtocolBridge — a cola entre módulos
php// Modules/Monograph/Integration/ProtocolBridge.php

class ProtocolBridge
{
    /**
     * Chamado pelo Listener quando ProtocolApproved é disparado.
     * Verifica se o protocolo está aprovado antes de aceitar
     * qualquer submissão de monografia.
     */
    public function isProtocolApproved(string $submissionId): bool
    {
        // Consulta directa à tabela de estados — sem importar
        // classes do módulo Protocol
        return DB::table('workflow_transitions')
            ->where('submission_id', $submissionId)
            ->where('to_state', 'aprovado_para_campo')
            ->exists();
    }

    public function getApprovedProtocolData(string $submissionId): array
    {
        return DB::table('submissions')
            ->join('workflow_states', 'submissions.current_state_id', '=', 'workflow_states.id')
            ->where('submissions.id', $submissionId)
            ->where('workflow_states.name', 'aprovado_para_campo')
            ->select('submissions.student_id', 'submissions.supervisor_id',
                     'submissions.title', 'submissions.course_id')
            ->firstOrFail()
            ->toArray();
    }
}

4. O Listener no Módulo Monograph
php// Modules/Monograph/Listeners/OnProtocolApproved.php

class OnProtocolApproved
{
    public function __construct(
        private MonographRepository $repo,
        private NotificationService $notifications
    ) {}

    public function handle(ProtocolApproved $event): void
    {
        // Cria o registo da monografia automaticamente
        $this->repo->create([
            'submission_id' => $event->submissionId,
            'student_id'    => $event->studentId,
            'supervisor_id' => $event->supervisorId,
            'title'         => $event->title,
            'status'        => 'aguarda_submissao',
        ]);

        // Notifica o estudante
        $this->notifications->send(
            userId  : $event->studentId,
            type    : 'protocolo_aprovado',
            title   : 'Protocolo aprovado — pode submeter a monografia',
            body    : 'O seu protocolo foi aprovado pela Bioética. Pode agora submeter a monografia final.',
        );
    }
}

5. Registo do Listener no EventServiceProvider
php// Providers/EventServiceProvider.php (ou no módulo)

protected $listen = [
    \Modules\Protocol\Events\ProtocolApproved::class => [
        \Modules\Monograph\Listeners\OnProtocolApproved::class,
        \Modules\Shared\Listeners\LogWorkflowTransition::class,
    ],
];

6. O que o estudante vê depois
Dashboard do estudante após protocolo aprovado:

┌─────────────────────────────────────────────┐
│ ✅ Protocolo aprovado pelo Comité de Bioética│
│                                             │
│ Próximo passo:                              │
│ → Realize o trabalho de campo               │
│ → Após concluir, submeta a monografia final │
│                                             │
│          [ Submeter Monografia ]            │
└─────────────────────────────────────────────┘
O botão "Submeter Monografia" só aparece quando monographs.status = 'aguarda_submissao' — criado pelo Listener.

7. Quando o estudante clica "Submeter Monografia"
php// Modules/Monograph/Controllers/MonographController.php

public function submit(Request $request, string $monographId)
{
    // 1. ProtocolBridge confirma que o protocolo está aprovado
    $submissionId = Monograph::findOrFail($monographId)->submission_id;

    if (!$this->protocolBridge->isProtocolApproved($submissionId)) {
        abort(403, 'Protocolo ainda não aprovado para campo.');
    }

    // 2. Delega ao MonographService
    $this->monographService->submit($monographId, $request->validated());
}

Resumo do fluxo completo entre módulos
MÓDULO PROTOCOL
  Bioética aprova
      │
      ▼
  WorkflowService.advance('bioetica_aprova')
      │
      ▼
  dispara: ProtocolApproved (evento)
      │
      └──────────────────────────────────────────┐
                                                 ▼
                                        MÓDULO MONOGRAPH
                                        OnProtocolApproved (listener)
                                            │
                                            ▼
                                        MonographRepository.create()
                                        status = 'aguarda_submissao'
                                            │
                                            ▼
                                        NotificationService.send()
                                        → estudante notificado

                                        [estudante submete monografia]
                                            │
                                            ▼
                                        ProtocolBridge.isProtocolApproved()
                                        → confirma antes de aceitar
                                            │
                                            ▼
                                        MonographService.submit()
                                            │
                                            ▼
                                        estado: 'monografia_submetida'
                                            │
                                            ▼
                                MÓDULO MONOGRAPH continua
                                (verificação administrativa)

A regra fundamental é: os módulos comunicam por eventos, não por imports directos. O ProtocolBridge existe para o Monograph poder consultar dados do Protocol sem criar uma dependência circular — acede directamente às tabelas partilhadas da BD, sem importar classes do módulo Protocol.