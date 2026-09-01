// src/config/menuRegistry.ts

export const menuRegistry = [

  // ── Dashboard ─────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Início',
    icon: 'ti-home',
    route: '/dashboard',
    permission: null,
    roles: null,
  },

  // ── Student ───────────────────────────────────────────────────────
  {
    id: 'my_topic',
    label: 'O meu tema',
    icon: 'ti-bookmark',
    route: '/topic',
    permission: 'topic.create',
    roles: ['student'],
  },
  {
    id: 'my_protocol',
    label: 'O meu protocolo',
    icon: 'ti-file-description',
    route: '/protocol/mine',
    permission: 'protocol.create',
    roles: ['student'],
    children: [
      { label: 'Submeter',    route: '/protocol/submit',    permission: 'protocol.submit'  },
      { label: 'Documentos',  route: '/protocol/documents', permission: 'protocol.view'    },
    ],
  },
  {
    id: 'my_monograph',
    label: 'Monografia',
    icon: 'ti-book',
    route: '/monograph',
    permission: 'monograph.submit',
    roles: ['student'],
  },

  // ── Supervisor ────────────────────────────────────────────────────
  {
    id: 'supervision',
    label: 'Os meus supervisionandos',
    icon: 'ti-users',
    route: '/supervision',
    permission: 'supervision.view',
    roles: ['teacher', 'supervisor', 'reviewer'],
  },
  {
    id: 'supervision_pending',
    label: 'Aprovar submissões',
    icon: 'ti-check-double',
    route: '/supervision/pending',
    permission: 'supervision.approve',
    roles: ['teacher', 'supervisor', 'reviewer'],
  },

  // ── Teacher / Reviewer ────────────────────────────────────────────
  {
    id: 'workload',
    label: 'A minha carga',
    icon: 'ti-chart-bar',
    route: '/workload',
    permission: 'workload.view',
    roles: ['teacher', 'supervisor', 'reviewer'],
  },
  {
    id: 'reviews',
    label: 'Revisões',
    icon: 'ti-eye',
    route: '/reviews',
    permission: 'protocol.evaluate',
    roles: ['teacher', 'supervisor', 'reviewer'],
  },
  {
    id: 'review_history',
    label: 'Histórico',
    icon: 'ti-history',
    route: '/reviews/history',
    permission: 'protocol.evaluate',
    roles: ['teacher', 'supervisor', 'reviewer'],
  },
// 🆕 Reuniões de Deliberação (Núcleo)
{
  id: 'reviewer_meetings',
  label: 'Reuniões',
  icon: 'ti-calendar-event',
  route: '/reviewer/meetings',
  permission: 'protocol.evaluate',
  roles: ['teacher', 'supervisor', 'reviewer'],
},
// No menu do revisor
{
  id: 'reviewer_final_decisions',
  label: 'Decisões Pendentes',
  icon: 'ti-gavel',
  route: '/reviewer/final-decisions',
  permission: 'protocol.evaluate',
  roles: ['teacher', 'supervisor', 'reviewer'],
},

  // ── Coordinator ───────────────────────────────────────────────────
  {
    id: 'protocols_assign',
    label: 'Atribuição de revisores',
    icon: 'ti-user-check',
    route: '/protocols/assign',
    permission: 'protocol.assign',
    roles: ['coordinator'],
  },
  {
    id: 'protocols_overview',
    label: 'Todos os protocolos',
    icon: 'ti-files',
    route: '/protocols',
    permission: 'protocol.assign',
    roles: ['coordinator'],
    children: [
      { label: 'Em revisão',   route: '/protocols?status=reviewing',   permission: 'protocol.assign'  },
      { label: 'Aprovados',    route: '/protocols?status=approved',    permission: 'protocol.assign'  },
      { label: 'Correcções',   route: '/protocols?status=corrections', permission: 'protocol.assign'  },
    ],
  },
  {
    id: 'defense',
    label: 'Defesas',
    icon: 'ti-calendar-event',
    route: '/defense',
    permission: 'defense.schedule',
    roles: ['coordinator', 'secretary'],
    children: [
      { label: 'Agendar',    route: '/defense/schedule', permission: 'defense.schedule' },
      { label: 'Calendário', route: '/defense/calendar', permission: 'defense.view'     },
    ],
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: 'ti-chart-pie',
    route: '/reports',
    permission: 'reports.view',
    roles: ['coordinator'],
  },

  // ── Agenda ────────────────────────────────────────────
  {
    id: 'agenda',
    label: 'Agenda',
    icon: 'ti-calendar-event',
    route: '/agenda',
    permission: null,
    roles: ['teacher', 'supervisor', 'reviewer', 'secretary', 'coordinator', 'admin'],
  },

  // ── Secretary ─────────────────────────────────────────────────────
  {
    id: 'secretary_protocols',
    label: 'Submissões',
    icon: 'ti-clipboard-list',
    route: '/secretary/protocols',
    permission: 'protocol.triage',
    roles: ['secretary'],
  },
  {
    id: 'secretary_history',
    label: 'Histórico',
    icon: 'ti-history',
    route: '/secretary/history',
    permission: 'protocol.triage',
    roles: ['secretary'],
    organTypes: ['nucleus', 'scientific_committee', 'bioethics_committee'],
  },
  {
    id: 'secretary_deliberations',
    label: 'Deliberações',
    icon: 'ti-gavel',
    route: '/secretary/meeting',
    permission: 'protocol.assign',
    roles: ['secretary'],
    organTypes: ['scientific_committee', 'bioethics_committee'],
  },
  {
    id: 'secretary_signatures',
    label: 'Assinar',
    icon: 'ti-signature',
    route: '/secretary/signatures',
    permission: 'protocol.assign',
    roles: ['secretary'],
    organTypes: ['scientific_committee', 'bioethics_committee'],
  },
  {
    id: 'secretary_spreadsheet',
    label: 'Planilha',
    icon: 'ti-table',
    route: '/secretary/spreadsheet',
    permission: 'protocol.triage',
    roles: ['secretary'],
    organTypes: ['nucleus', 'scientific_committee', 'bioethics_committee'],
  },

  // ── Organ President ───────────────────────────────────────────────
  
 // ── Organ President ───────────────────────────────────────────────
  {
    id: 'organ_president',
    label: 'O meu Órgão',
    icon: 'ti-building',
    route: '/organ-president',
    permission: null,
    roles: ['admin'],
    adminScope: 'organ',
    organTypes: ['nucleus', 'scientific_committee', 'bioethics_committee'],
    children: [
      { id: 'organ_president_dashboard', label: 'Painel', route: '/organ-president', permission: null },
      { id: 'organ_president_members',   label: 'Membros', route: '/organ-president/members', permission: null },
      { id: 'organ_president_reviewers', label: 'Adicionar Revisores', route: '/organ-president/reviewers', permission: null },
      { id: 'organ_president_teachers',  label: 'Registar Docentes', route: '/organ-president/teachers', permission: null }, // 🆕 NOVA ROTA
    ],
  },

  // ── General Admin / Direção Científica ────────────────────────────
  {
    id: 'general_admin',
    label: 'Direção Científica',
    icon: 'ti-building',
    route: '/general-admin',
    permission: 'admin.organs',
    roles: ['admin'],
    adminScope: 'organ',
    organTypes: ['scientific_direction'],
    children: [
      { id: 'general_admin_dashboard',  label: 'Painel',            route: '/general-admin',               permission: 'admin.organs' },
      { id: 'general_admin_personnel',  label: 'Gestão de Pessoal', route: '/general-admin/personnel',     permission: 'admin.organs' },
      { id: 'general_admin_courses',    label: 'Cursos e Áreas',    route: '/general-admin/courses',       permission: 'admin.organs' },
    ],
  },

  // ── Admin (Sistema) ───────────────────────────────────────────────
  {
    id: 'admin',
    label: 'Administração',
    icon: 'ti-settings',
    permission: 'admin.users',
    roles: ['admin'],
    adminScope: 'global',
    children: [
      { id: 'admin_users',         label: 'Utilizadores',      icon: 'ti-users-group', route: '/admin/users',         permission: 'admin.users',    roles: ['admin'] },
      { id: 'admin_organs',        label: 'Órgãos e áreas',    icon: 'ti-building',    route: '/admin/organs',        permission: 'admin.organs',   roles: ['admin'] },
      { id: 'admin_system_status', label: 'Estado do Sistema', icon: 'ti-trending-up', route: '/admin/system-status', permission: 'admin.settings', roles: ['admin'] },
    ],
  },
]
