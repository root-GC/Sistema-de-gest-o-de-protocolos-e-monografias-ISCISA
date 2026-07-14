// pages/dashboard/widgets/SupervisionWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Student {
  id: string;
  name: string;
  protocol_title?: string;
  protocol_status?: string;
  last_activity: string;
  phase: 'topic' | 'protocol' | 'review' | 'defense' | 'completed';
}

export function SupervisionWidget({ data, isLoading }: WidgetProps) {
  const students: Student[] = data?.students || [];
  const stats = data?.stats || {};

  const phaseLabels: Record<string, string> = {
    topic: 'Proposta de Tema',
    protocol: 'Protocolo',
    review: 'Em Revisão',
    defense: 'Defesa',
    completed: 'Concluído'
  };

  return (
    <div className="pending-triage-widget">
      <div className="triage-stats">
        <div className="stat-item normal">
          <span className="stat-value">{stats.total || students.length}</span>
          <span className="stat-label">Tutorandos</span>
        </div>
        <div className="stat-item urgent">
          <span className="stat-value">{stats.active || 0}</span>
          <span className="stat-label">Ativos</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-value">{stats.completed || 0}</span>
          <span className="stat-label">Concluídos</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">person_off</span>
          <p>Nenhum tutorando ativo</p>
        </div>
      ) : (
        <div className="triage-list">
          {students.slice(0, 5).map((student) => (
            <div key={student.id} className="triage-item">
              <div>
                <span className="triage-code">{student.name}</span>
                {student.protocol_title && (
                  <span className="triage-title">{student.protocol_title}</span>
                )}
              </div>
              <div className="triage-meta">
                <span className={`badge badge-${
                  student.phase === 'completed' ? 'success' : 
                  student.phase === 'defense' ? 'warning' : 'normal'
                }`}>
                  {phaseLabels[student.phase]}
                </span>
                <span className="text-small text-muted">{student.last_activity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}