// pages/dashboard/widgets/QuickActionsWidget.tsx
// import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import type { WidgetProps } from '../../../types/dashboard';

interface Action {
  id: string;
  label: string;
  icon: string;
  permission?: string;
  onClick: () => void;
  href?: string;
}

export function QuickActionsWidget(_props: WidgetProps) {
  const { hasPermission } = useAuth();

  const actions: Action[] = [
    {
      id: 'new-protocol',
      label: 'Novo Protocolo',
      icon: 'note_add',
      permission: 'protocol.create',
      onClick: () => console.log('Novo protocolo'),
      href: '/protocols/new'
    },
    {
      id: 'new-topic',
      label: 'Propor Tema',
      icon: 'lightbulb',
      permission: 'topic.create',
      onClick: () => console.log('Novo tema'),
      href: '/topics/new'
    },
    {
      id: 'upload-document',
      label: 'Upload Documento',
      icon: 'upload_file',
      permission: 'document.upload',
      onClick: () => console.log('Upload'),
      href: '/documents/upload'
    },
    {
      id: 'my-reviews',
      label: 'Minhas Revisões',
      icon: 'rate_review',
      permission: 'protocol.evaluate',
      onClick: () => console.log('Revisões'),
      href: '/reviews'
    },
    {
      id: 'pending-triage',
      label: 'Triagens',
      icon: 'fact_check',
      permission: 'protocol.triage',
      onClick: () => console.log('Triagem'),
      href: '/triage'
    },
    {
      id: 'assign-reviewers',
      label: 'Atribuir Revisores',
      icon: 'person_add',
      permission: 'reviewer.assign',
      onClick: () => console.log('Atribuir'),
      href: '/assignments'
    },
    {
      id: 'schedule-defense',
      label: 'Agendar Defesa',
      icon: 'event',
      permission: 'defense.schedule',
      onClick: () => console.log('Agendar'),
      href: '/defenses/schedule'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: 'bar_chart',
      permission: 'reports.view',
      onClick: () => console.log('Relatórios'),
      href: '/reports'
    }
  ];

  const authorizedActions = actions.filter(
    action => !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="quick-actions-widget">
      <div className="actions-grid">
        {authorizedActions.slice(0, 6).map((action) => (
          <button
            key={action.id}
            className="action-btn"
            onClick={action.onClick}
          >
            <span className="material-symbols-outlined">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
