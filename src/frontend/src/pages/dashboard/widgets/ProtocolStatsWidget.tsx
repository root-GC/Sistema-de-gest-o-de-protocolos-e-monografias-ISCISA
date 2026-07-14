// pages/dashboard/widgets/ProtocolStatsWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

export function ProtocolStatsWidget({ data, isLoading }: WidgetProps) {
  const stats = data?.stats || {};

  return (
    <div className="admin-panel-widget">
      <div className="admin-grid">
        <div className="admin-card">
          <span className="material-symbols-outlined">description</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.total_protocols || 0}</span>
            <span className="admin-card-label">Total Protocolos</span>
          </div>
        </div>

        <div className="admin-card">
          <span className="material-symbols-outlined">hourglass_top</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.in_review || 0}</span>
            <span className="admin-card-label">Em Revisão</span>
          </div>
        </div>

        <div className="admin-card">
          <span className="material-symbols-outlined">check_circle</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.approved || 0}</span>
            <span className="admin-card-label">Aprovados</span>
          </div>
        </div>

        <div className="admin-card">
          <span className="material-symbols-outlined">trending_up</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.approval_rate || 0}%</span>
            <span className="admin-card-label">Taxa Aprovação</span>
          </div>
        </div>

        <div className="admin-card">
          <span className="material-symbols-outlined">schedule</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.avg_review_time || 0}d</span>
            <span className="admin-card-label">Tempo Médio Revisão</span>
          </div>
        </div>

        <div className="admin-card">
          <span className="material-symbols-outlined">group</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.active_reviewers || 0}</span>
            <span className="admin-card-label">Revisores Ativos</span>
          </div>
        </div>
      </div>
    </div>
  );
}