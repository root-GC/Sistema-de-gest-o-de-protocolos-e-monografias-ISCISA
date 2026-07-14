// pages/dashboard/widgets/ReportsWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Report {
  id: string;
  name: string;
  description: string;
  last_generated: string;
  type: string;
}

export function ReportsWidget({ data, isLoading }: WidgetProps) {
  const reports: Report[] = data?.reports || [];

  return (
    <div className="pending-reviews-widget">
      {reports.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined">analytics</span>
          <p>Nenhum relatório disponível</p>
          <button className="btn btn-primary">Gerar Relatório</button>
        </div>
      ) : (
        <div className="reviews-table">
          <table>
            <thead>
              <tr>
                <th>Relatório</th>
                <th>Tipo</th>
                <th>Última Geração</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <span className="protocol-code">{report.name}</span>
                    <span className="protocol-title">{report.description}</span>
                  </td>
                  <td>
                    <span className="badge badge-warning">{report.type}</span>
                  </td>
                  <td>{report.last_generated}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-small btn-primary">Visualizar</button>
                      <button className="btn btn-small btn-secondary">Exportar</button>
                    </div>
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