// pages/dashboard/widgets/MyProtocolsWidget.tsx
// import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Protocol {
  id: string;
  code: string;
  title: string;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'corrections';
  status_label: string;
  organ: string;
  updated_at: string;
  deadline?: string;
}

export function MyProtocolsWidget({ data }: WidgetProps) {
  const protocols: Protocol[] = data?.protocols || [];
  const stats = data?.stats || {};

  if (protocols.length === 0) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined">description</span>
        <p>Nenhum protocolo encontrado</p>
        <button className="btn btn-primary">Novo Protocolo</button>
      </div>
    );
  }

  return (
    <div className="my-protocols-widget">
      {/* Stats rápidas */}
      <div className="triage-stats" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="stat-item normal">
          <span className="stat-value">{stats.total || protocols.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item urgent">
          <span className="stat-value">{stats.in_review || 0}</span>
          <span className="stat-label">Em Revisão</span>
        </div>
        <div className="stat-item completed">
          <span className="stat-value">{stats.approved || 0}</span>
          <span className="stat-label">Aprovados</span>
        </div>
      </div>

      {/* Lista de protocolos */}
      <div className="protocols-list">
        {protocols.slice(0, 5).map((protocol) => (
          <div key={protocol.id} className="protocol-item">
            <div className="protocol-info">
              <span className={`protocol-status status-${protocol.status}`}>
                {protocol.status_label}
              </span>
              <h4>{protocol.title}</h4>
              <p>#{protocol.code} • {protocol.organ}</p>
            </div>
            <div className="protocol-meta">
              <span>Atualizado: {protocol.updated_at}</span>
              {protocol.deadline && (
                <span className="text-error">Prazo: {protocol.deadline}</span>
              )}
              <button className="btn-text">Ver detalhes</button>
            </div>
          </div>
        ))}
      </div>

      {protocols.length > 5 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
          <button className="btn-text">Ver todos ({protocols.length})</button>
        </div>
      )}
    </div>
  );
}