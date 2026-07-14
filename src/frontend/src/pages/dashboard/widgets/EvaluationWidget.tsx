// pages/dashboard/widgets/EvaluationWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Evaluation {
  id: string;
  protocol_code: string;
  protocol_title: string;
  type: string;
  deadline?: string;
  status: 'pending' | 'completed' | 'accepted';
  score?: number;
}

export function EvaluationWidget({ data, isLoading }: WidgetProps) {
  const evaluations: Evaluation[] = data?.evaluations || [];
  const stats = data?.stats || {};

  return (
    <div className="pending-triage-widget">
      <div className="triage-stats">
        <div className="stat-item normal">
          <span className="stat-value">{stats.pending || evaluations.filter(e => e.status === 'pending').length}</span>
          <span className="stat-label">Pendentes</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-value">{stats.completed || evaluations.filter(e => e.status === 'completed').length}</span>
          <span className="stat-label">Concluídas</span>
        </div>
        <div className="stat-item urgent">
          <span className="stat-value">{stats.overdue || 0}</span>
          <span className="stat-label">Atrasadas</span>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">grading</span>
          <p>Nenhuma avaliação pendente</p>
        </div>
      ) : (
        <div className="triage-list">
          {evaluations.slice(0, 5).map((evaluation) => (
            <div key={evaluation.id} className="triage-item">
              <div>
                <span className="triage-code">#{evaluation.protocol_code}</span>
                <span className="triage-title">{evaluation.protocol_title}</span>
              </div>
              <div className="triage-meta">
                <span className={`badge badge-${evaluation.status === 'completed' ? 'success' : evaluation.status === 'pending' ? 'warning' : 'error'}`}>
                  {evaluation.status === 'completed' ? 'Concluída' : evaluation.status === 'pending' ? 'Pendente' : 'Aceite'}
                </span>
                {evaluation.score && (
                  <span className="text-small">Nota: {evaluation.score}</span>
                )}
                {evaluation.status === 'pending' && (
                  <button className="btn btn-small btn-primary">Avaliar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}