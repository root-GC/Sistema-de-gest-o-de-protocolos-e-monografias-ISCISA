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
    endpoint: '/api/dashboard/my-protocols'
  },
  {
    id: 'pendingTriage',
    title: 'Triagens Pendentes',
    description: 'Documentos aguardando validação administrativa',
    category: 'workflow',
    order: 2,
    size: 'medium',
    component: PendingTriageWidget,
    permissions: ['protocol.triage'],
    endpoint: '/api/dashboard/pending-triage'
  },
  {
    id: 'documentValidation',
    title: 'Validação Documental',
    description: 'Documentos para validar ou rejeitar',
    category: 'workflow',
    order: 3,
    size: 'medium',
    component: DocumentValidationWidget,
    permissions: ['document.validate'],
    endpoint: '/api/dashboard/document-validation'
  },
  {
    id: 'quickActions',
    title: 'Ações Rápidas',
    description: 'Atalhos para operações frequentes',
    category: 'workflow',
    order: 4,
    size: 'small',
    component: QuickActionsWidget,
    permissions: [], // Widget público baseado em permissões internas
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
    permissions: ['protocol.review'],
    endpoint: '/api/dashboard/pending-reviews'
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
    endpoint: '/api/dashboard/reviewer-assignment'
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
    endpoint: '/api/dashboard/workload'
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
    endpoint: '/api/dashboard/pending-evaluations'
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
    endpoint: '/api/dashboard/evaluation-results'
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
    endpoint: '/api/dashboard/defense-schedule'
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
    endpoint: '/api/dashboard/jury-participation'
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
    endpoint: '/api/dashboard/supervision-students'
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
    endpoint: '/api/dashboard/reports'
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
    endpoint: '/api/dashboard/admin-summary'
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
    permissions: [], // Widget público
    endpoint: '/api/dashboard/notifications'
  },
  {
    id: 'deadlines',
    title: 'Próximos Prazos',
    description: 'Prazos importantes e calendário académico',
    category: 'general',
    order: 2,
    size: 'small',
    component: DeadlineWidget,
    permissions: [], // Widget público
    endpoint: '/api/dashboard/deadlines'
  }
];