// pages/dashboard/widgets/ReviewerAssignmentWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface ProtocolForAssignment {
  id: string;
  code: string;
  title: string;
  student_name: string;
  submission_date: string;
  reviewers_count: number;
  required_reviewers: number;
  organ: string;
}

interface Reviewer {
  id: string;
  name: string;
  current_load: number;
  max_load: number;
  specialization: string;
}

export function ReviewerAssignmentWidget({ data, isLoading }: WidgetProps) {
  const protocols: ProtocolForAssignment[] = data?.protocols || [];
  const availableReviewers: Reviewer[] = data?.available_reviewers || [];

  return (
    <div className="pending-reviews-widget">
      {/* Stats */}
      <div className="triage-stats" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="stat-item urgent">
          <span className="stat-value">{data?.unassigned_count || protocols.length}</span>
          <span className="stat-label">Não Atribuídos</span>
        </div>
        <div className="stat-item normal">
          <span className="stat-value">{data?.partial_count || 0}</span>
          <span className="stat-label">Parcial</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-value">{availableReviewers.length}</span>
          <span className="stat-label">Revisores Disponíveis</span>
        </div>
      </div>

      {protocols.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">check_circle</span>
          <p>Todos os protocolos têm revisores atribuídos</p>
        </div>
      ) : (
        <div className="reviews-table">
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Estudante</th>
                <th>Revisores</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {protocols.slice(0, 5).map((protocol) => (
                <tr key={protocol.id}>
                  <td>
                    <span className="protocol-code">#{protocol.code}</span>
                    <span className="protocol-title">{protocol.title}</span>
                  </td>
                  <td>{protocol.student_name}</td>
                  <td>
                    <span className={protocol.reviewers_count < protocol.required_reviewers ? 'text-error' : ''}>
                      {protocol.reviewers_count}/{protocol.required_reviewers}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-small btn-primary">Atribuir</button>
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