// pages/dashboard/widgets/DefenseScheduleWidget.tsx
// import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Defense {
  id: string;
  student_name: string;
  protocol_title: string;
  date: string;
  time: string;
  room: string;
  jury_members: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  is_jury_member?: boolean;
}

export function DefenseScheduleWidget({ data }: WidgetProps) {
  const defenses: Defense[] = data?.defenses || [];
  const isJuryView = data?.is_jury_view || false;

  return (
    <div className="pending-reviews-widget">
      {isJuryView && (
        <div className="triage-stats" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="stat-item normal">
            <span className="stat-value">{data?.upcoming_count || 0}</span>
            <span className="stat-label">Próximas</span>
          </div>
          <div className="stat-item completed">
            <span className="stat-value">{data?.completed_count || 0}</span>
            <span className="stat-label">Realizadas</span>
          </div>
          <div className="stat-item urgent">
            <span className="stat-value">{data?.today_count || 0}</span>
            <span className="stat-label">Hoje</span>
          </div>
        </div>
      )}

      {defenses.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">event_busy</span>
          <p>{isJuryView ? 'Nenhuma participação em júri' : 'Nenhuma defesa agendada'}</p>
        </div>
      ) : (
        <div className="reviews-table">
          <table>
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Título</th>
                <th>Data/Hora</th>
                <th>Sala</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {defenses.map((defense) => (
                <tr key={defense.id}>
                  <td>
                    <span className="protocol-code">{defense.student_name}</span>
                  </td>
                  <td>
                    <span className="protocol-title">{defense.protocol_title}</span>
                  </td>
                  <td>
                    <div>{defense.date}</div>
                    <span className="text-small text-muted">{defense.time}</span>
                  </td>
                  <td>{defense.room}</td>
                  <td>
                    <span className={`badge badge-${defense.status === 'scheduled' ? 'warning' : defense.status === 'completed' ? 'success' : 'error'}`}>
                      {defense.status === 'scheduled' ? 'Agendada' : defense.status === 'completed' ? 'Realizada' : 'Cancelada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}