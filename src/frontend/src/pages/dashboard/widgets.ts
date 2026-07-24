// pages/dashboard/widgets.ts
import type { DashboardWidget } from '../../types/dashboard';

// Importações DIRETAS dos arquivos dos widgets (não do barril)
import { MyProtocolsWidget } from './widgets/MyProtocolsWidget';
import { PendingTriageWidget } from './widgets/PendingTriageWidget';
import { DocumentValidationWidget } from './widgets/DocumentValidationWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { PendingReviewsWidget } from './widgets/PendingReviewsWidget';
import { ReviewerAssignmentWidget } from './widgets/ReviewerAssignmentWidget';
import { WorkloadWidget } from './widgets/WorkloadWidget';
import { EvaluationWidget } from './widgets/EvaluationWidget';
import { DefenseScheduleWidget } from './widgets/DefenseScheduleWidget';
import { SupervisionWidget } from './widgets/SupervisionWidget';
import { ProtocolStatsWidget } from './widgets/ProtocolStatsWidget';
import { ReportsWidget } from './widgets/ReportsWidget';
import { AdminPanelWidget } from './widgets/AdminPanelWidget';
import { NotificationWidget } from './widgets/NotificationWidget';
import { DeadlineWidget } from './widgets/DeadlineWidget';
import { ProtocolWorkflowWidget } from './widgets/ProtocolWorkflowWidget';
import { 
  JointReturnWidget,
  DebtPayoffWidget,
  JointAllocationWidget,
  StockWidget,
  LoanWidget,
  TransactionsWidget,
  TaxReturnWidget,
  ExcellentScoreWidget,
  ProfileWidget,
  PasswordWidget
} from './widgets/SuaveWidgets';

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  // ========================
  // FLUXO DE TRABALHO
  // ========================
  {
    id: 'myProtocols',
    title: 'Meus Protocolos',
    description: 'Protocolos submetidos e seu estado atual',
    category: 'workflow',
    order: 1,
    size: 'large',
    component: MyProtocolsWidget,
    permissions: ['protocol.view'],
    endpoint: '/api/my-protocols'
  },
  {
    id: 'protocolWorkflow',
    title: 'Fluxo do Protocolo',
    description: 'Acompanhamento visual das etapas e evolução do protocolo',
    category: 'workflow',
    order: 2,
    size: 'full',
    component: ProtocolWorkflowWidget,
    permissions: ['protocol.view'],
    endpoint: '/api/protocol-workflow'
  },
  {
    id: 'pendingTriage',
    title: 'Triagens Pendentes',
    description: 'Documentos aguardando validação administrativa',
    category: 'workflow',
    order: 3,
    size: 'medium',
    component: PendingTriageWidget,
    permissions: ['protocol.triage'],
    endpoint: '/api/pending-triage'
  },
  {
    id: 'documentValidation',
    title: 'Validação Documental',
    description: 'Documentos para validar ou rejeitar',
    category: 'workflow',
    order: 4,
    size: 'medium',
    component: DocumentValidationWidget,
    permissions: ['document.validate'],
    endpoint: '/api/document-validation'
  },
  {
    id: 'quickActions',
    title: 'Ações Rápidas',
    description: 'Atalhos para operações frequentes',
    category: 'workflow',
    order: 5,
    size: 'small',
    component: QuickActionsWidget,
    permissions: [],
    anyPermission: true
  },

  // ========================
  // REVISÕES
  // ========================
  {
    id: 'pendingReviews',
    title: 'Revisões Pendentes',
    description: 'Protocolos aguardando sua revisão',
    category: 'review',
    order: 1,
    size: 'large',
    component: PendingReviewsWidget,
    permissions: ['protocol.evaluate'],
    endpoint: '/api/pending-reviews'
  },
  {
    id: 'reviewerAssignment',
    title: 'Atribuição de Revisores',
    description: 'Distribuir protocolos para revisores',
    category: 'review',
    order: 2,
    size: 'large',
    component: ReviewerAssignmentWidget,
    permissions: ['protocol.assign', 'reviewer.assign'],
    endpoint: '/api/reviewer-assignment'
  },
  {
    id: 'workloadView',
    title: 'Carga de Trabalho',
    description: 'Distribuição de revisões entre docentes',
    category: 'review',
    order: 3,
    size: 'medium',
    component: WorkloadWidget,
    permissions: ['workload.view', 'workload.view.all'],
    anyPermission: true,
    endpoint: '/api/workload'
  },

  // ========================
  // AVALIAÇÕES
  // ========================
  {
    id: 'pendingEvaluations',
    title: 'Avaliações Pendentes',
    description: 'Fichas de avaliação para preencher',
    category: 'evaluation',
    order: 1,
    size: 'medium',
    component: EvaluationWidget,
    permissions: ['evaluation.create'],
    endpoint: '/api/pending-evaluations'
  },
  {
    id: 'evaluationResults',
    title: 'Resultados de Avaliações',
    description: 'Ver pareceres e avaliações',
    category: 'evaluation',
    order: 2,
    size: 'medium',
    component: EvaluationWidget,
    permissions: ['evaluation.view', 'evaluation.view.own', 'evaluation.view.all'],
    anyPermission: true,
    endpoint: '/api/evaluation-results'
  },

  // ========================
  // DEFESAS
  // ========================
  {
    id: 'defenseSchedule',
    title: 'Agenda de Defesas',
    description: 'Calendário de defesas agendadas',
    category: 'defense',
    order: 1,
    size: 'large',
    component: DefenseScheduleWidget,
    permissions: ['defense.view'],
    endpoint: '/api/defense-schedule'
  },
  {
    id: 'juryParticipation',
    title: 'Participação em Júris',
    description: 'Defesas onde você é membro do júri',
    category: 'defense',
    order: 2,
    size: 'medium',
    component: DefenseScheduleWidget,
    permissions: ['defense.jury.participate'],
    endpoint: '/api/jury-participation'
  },

  // ========================
  // SUPERVISÃO
  // ========================
  {
    id: 'supervisionStudents',
    title: 'Meus Tutorandos',
    description: 'Estado dos processos dos seus tutorandos',
    category: 'supervision',
    order: 1,
    size: 'large',
    component: SupervisionWidget,
    permissions: ['supervision.view'],
    endpoint: '/api/supervision-students'
  },

  // ========================
  // RELATÓRIOS & BI
  // ========================
  {
    id: 'protocolStats',
    title: 'Estatísticas de Protocolos',
    description: 'Métricas e indicadores de produção científica',
    category: 'reports',
    order: 1,
    size: 'large',
    component: ProtocolStatsWidget,
    permissions: ['reports.view', 'reports.view.all'],
    anyPermission: true,
    endpoint: '/api/dashboard/protocol-stats'
  },
  {
    id: 'reportsPanel',
    title: 'Painel de Relatórios',
    description: 'Relatórios detalhados e exportáveis',
    category: 'reports',
    order: 2,
    size: 'full',
    component: ReportsWidget,
    permissions: ['reports.view', 'reports.view.all'],
    anyPermission: true,
    endpoint: '/api/reports'
  },

  // ========================
  // ADMINISTRAÇÃO
  // ========================
  {
    id: 'adminPanel',
    title: 'Painel de Administração',
    description: 'Gestão de utilizadores, órgãos e configurações',
    category: 'administration',
    order: 1,
    size: 'full',
    component: AdminPanelWidget,
    permissions: ['admin.users', 'admin.organs', 'admin.settings', 'admin.reports'],
    anyPermission: true,
    endpoint: '/api/admin-summary'
  },

  // ========================
  // GERAL
  // ========================
  {
    id: 'notifications',
    title: 'Notificações',
    description: 'Últimas atualizações e alertas',
    category: 'general',
    order: 1,
    size: 'small',
    component: NotificationWidget,
    permissions: [],
    endpoint: '/api/notifications'
  },
  {
    id: 'deadlines',
    title: 'Próximos Prazos',
    description: 'Prazos importantes e calendário académico',
    category: 'general',
    order: 2,
    size: 'small',
    component: DeadlineWidget,
    permissions: [],
    endpoint: '/api/deadlines'
  },
   // Widgets Suave/Financeiros
  {
    id: 'jointReturn',
    title: 'Joint Return',
    description: 'Returns overview',
    category: 'general',
    order: 10,
    size: 'large',
    component: JointReturnWidget,
    permissions: [],
    endpoint: '/api/joint-return'
  },
  {
    id: 'debtPayoff',
    title: 'Debt Payoff',
    description: 'Financial planning',
    category: 'general',
    order: 11,
    size: 'medium',
    component: DebtPayoffWidget,
    permissions: [],
    endpoint: '/api/debt-payoff'
  },
  {
    id: 'jointAllocation',
    title: 'Joint Allocation',
    description: 'Expense breakdown',
    category: 'general',
    order: 12,
    size: 'medium',
    component: JointAllocationWidget,
    permissions: [],
    endpoint: '/api/joint-allocation'
  },
  {
    id: 'stocks',
    title: 'Stocks',
    description: 'Market overview',
    category: 'general',
    order: 13,
    size: 'small',
    component: StockWidget,
    permissions: [],
    endpoint: '/api/stocks'
  },
  {
    id: 'loan',
    title: 'Loan',
    description: 'Loan details',
    category: 'general',
    order: 14,
    size: 'small',
    component: LoanWidget,
    permissions: [],
    endpoint: '/api/loan'
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'Recent activity',
    category: 'general',
    order: 15,
    size: 'small',
    component: TransactionsWidget,
    permissions: [],
    endpoint: '/api/transactions'
  },
  {
    id: 'taxReturn',
    title: 'Tax Return',
    description: '2023 tax summary',
    category: 'general',
    order: 16,
    size: 'small',
    component: TaxReturnWidget,
    permissions: [],
    endpoint: '/api/tax-return'
  },
  {
    id: 'excellentScore',
    title: 'Credit Score',
    description: 'Your credit health',
    category: 'general',
    order: 17,
    size: 'small',
    component: ExcellentScoreWidget,
    permissions: [],
    endpoint: '/api/credit-score'
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'User information',
    category: 'general',
    order: 18,
    size: 'small',
    component: ProfileWidget,
    permissions: [],
    endpoint: '/api/profile'
  },
  {
    id: 'password',
    title: 'Security',
    description: 'Password management',
    category: 'general',
    order: 19,
    size: 'small',
    component: PasswordWidget,
    permissions: [],
    endpoint: '/api/password'
  }
];