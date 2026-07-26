// types/dashboard.ts
import React from 'react';

export interface DashboardWidget {
  id: string;
  component: React.ComponentType<WidgetProps>;
  permissions?: string[];
  anyPermission?: boolean;
  category: WidgetCategory;
  order: number;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  endpoint?: string;
}

export type WidgetCategory = 
  | 'workflow'
  | 'review'
  | 'evaluation'
  | 'administration'
  | 'reports'
  | 'defense'
  | 'supervision'
  | 'general';

export interface WidgetProps {
  data?: any;
  isLoading?: boolean;
  error?: string | null;
}

export interface WidgetDataResponse {
  widgetId: string;
  data: any;
  lastUpdated: string;
}

// Configuração visual das seções
export const CATEGORY_CONFIG: Record<WidgetCategory, {
  title: string;
  icon: string;
  order: number;
  color: string;
}> = {
  workflow: {
    title: 'Fluxo de Trabalho',
    icon: 'account_tree',
    order: 1,
    color: 'var(--primary)'
  },
  review: {
    title: 'Revisões Científicas',
    icon: 'rate_review',
    order: 2,
    color: 'var(--secondary)'
  },
  evaluation: {
    title: 'Avaliações',
    icon: 'grading',
    order: 3,
    color: 'var(--tertiary)'
  },
  defense: {
    title: 'Defesas',
    icon: 'school',
    order: 4,
    color: '#7C4DFF'
  },
  supervision: {
    title: 'Supervisão',
    icon: 'supervisor_account',
    order: 5,
    color: '#FF6D00'
  },
  administration: {
    title: 'Administração',
    icon: 'admin_panel_settings',
    order: 6,
    color: '#C62828'
  },
  reports: {
    title: 'Relatórios & BI',
    icon: 'analytics',
    order: 7,
    color: '#00695C'
  },
  general: {
    title: 'Geral',
    icon: 'dashboard',
    order: 99,
    color: 'var(--on-surface-variant)'
  }
};