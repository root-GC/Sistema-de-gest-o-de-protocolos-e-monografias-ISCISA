// pages/dashboard/widgets/DocumentValidationWidget.tsx
// import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface DocumentValidation {
  id: string;
  document_name: string;
  protocol_code: string;
  student_name: string;
  upload_date: string;
  status: 'pending' | 'validated' | 'rejected';
  type: string;
}

export function DocumentValidationWidget({ data }: WidgetProps) {
  const documents: DocumentValidation[] = data?.documents || [];
  const stats = data?.stats || {};

  return (
    <div className="pending-triage-widget">
      <div className="triage-stats">
        <div className="stat-item urgent">
          <span className="stat-value">{stats.pending || documents.length}</span>
          <span className="stat-label">Pendentes</span>
        </div>
        <div className="stat-item normal">
          <span className="stat-value">{stats.validated_today || 0}</span>
          <span className="stat-label">Validados Hoje</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-value">{stats.rejected_today || 0}</span>
          <span className="stat-label">Rejeitados</span>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">check_circle</span>
          <p>Nenhum documento pendente</p>
        </div>
      ) : (
        <div className="triage-list">
          {documents.slice(0, 5).map((doc) => (
            <div key={doc.id} className="triage-item">
              <div>
                <span className="triage-code">{doc.document_name}</span>
                <span className="triage-title">#{doc.protocol_code} - {doc.student_name}</span>
              </div>
              <div className="triage-meta">
                <span className={`badge badge-${doc.status === 'pending' ? 'warning' : doc.status === 'validated' ? 'success' : 'error'}`}>
                  {doc.status === 'pending' ? 'Pendente' : doc.status === 'validated' ? 'Validado' : 'Rejeitado'}
                </span>
                <button className="btn btn-small btn-primary">Validar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}