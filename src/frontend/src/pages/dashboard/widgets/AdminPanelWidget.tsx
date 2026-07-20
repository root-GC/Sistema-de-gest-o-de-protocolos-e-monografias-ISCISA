// pages/dashboard/widgets/AdminPanelWidget.tsx
// import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';
import { useAuth } from '../../../context/AuthContext';

export function AdminPanelWidget({ data }: WidgetProps) {
  const { hasPermission } = useAuth();
  const stats = data?.stats || {};

  return (
    <div className="admin-panel-widget">
      <div className="admin-grid">
        {hasPermission('admin.users') && (
          <div className="admin-card">
            <span className="material-symbols-outlined">people</span>
            <div className="admin-card-info">
              <span className="admin-card-value">{stats.users_count || 0}</span>
              <span className="admin-card-label">Utilizadores</span>
            </div>
            <button className="btn-text">Gerir</button>
          </div>
        )}

        {hasPermission('admin.organs') && (
          <div className="admin-card">
            <span className="material-symbols-outlined">account_balance</span>
            <div className="admin-card-info">
              <span className="admin-card-value">{stats.organs_count || 0}</span>
              <span className="admin-card-label">Órgãos</span>
            </div>
            <button className="btn-text">Gerir</button>
          </div>
        )}

        {hasPermission('admin.settings') && (
          <div className="admin-card">
            <span className="material-symbols-outlined">settings</span>
            <div className="admin-card-info">
              <span className="admin-card-label">Configurações</span>
              <span className="admin-card-status">Ativo</span>
            </div>
            <button className="btn-text">Configurar</button>
          </div>
        )}

        {hasPermission('admin.reports') && (
          <div className="admin-card">
            <span className="material-symbols-outlined">monitoring</span>
            <div className="admin-card-info">
              <span className="admin-card-value">{stats.reports_count || 0}</span>
              <span className="admin-card-label">Relatórios Admin</span>
            </div>
            <button className="btn-text">Ver todos</button>
          </div>
        )}

        {/* Métricas adicionais */}
        <div className="admin-card">
          <span className="material-symbols-outlined">storage</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.total_documents || 0}</span>
            <span className="admin-card-label">Documentos</span>
          </div>
        </div>

        <div className="admin-card">
          <span className="material-symbols-outlined">calendar_month</span>
          <div className="admin-card-info">
            <span className="admin-card-value">{stats.defenses_month || 0}</span>
            <span className="admin-card-label">Defesas este mês</span>
          </div>
        </div>
      </div>
    </div>
  );
}