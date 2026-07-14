// pages/dashboard/widgets/PendingTriageWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Triage {
  id: string;
  protocol_code: string;
  protocol_title: string;
  student_name: string;
  submission_date: string;
  waiting_time: string;
  documents_count: number;
  documents_validated: number;
}

export function PendingTriageWidget({ data, isLoading }: WidgetProps) {
  const triages: Triage[] = data?.triages || [];
  const stats = data?.stats || {};

  return (
    <div className="pending-triage-widget">
      <div className="triage-stats">
        <div className="stat-item urgent">
          <span className="stat-value">{stats.urgent || 0}</span>
          <span className="stat-label">Urgentes</span>
        </div>
        <div className="stat-item normal">
          <span className="stat-value">{triages.length}</span>
          <span className="stat-label">Pendentes</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-value">{stats.completed_today || 0}</span>
          <span className="stat-label">Hoje</span>
        </div>
      </div>

      {triages.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">task_alt</span>
          <p>Todas as triagens em dia!</p>
        </div>
      ) : (
        <div className="triage-list">
          {triages.slice(0, 5).map((triage) => (
            <div key={triage.id} className="triage-item">
              <div>
                <span className="triage-code">#{triage.protocol_code}</span>
                <span className="triage-title">{triage.protocol_title}</span>
              </div>
              <div className="triage-meta">
                <span className="triage-time">{triage.waiting_time}</span>
                <span className="triage-docs">
                  {triage.documents_validated}/{triage.documents_count} docs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}