// pages/dashboard/widgets/WorkloadWidget.tsx
import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface WorkloadData {
  id: string;
  name: string;
  reviews_count: number;
  supervisions_count: number;
  total_load: number;
  max_load: number;
  load_percentage: number;
}

export function WorkloadWidget({ data, isLoading }: WidgetProps) {
  const workloads: WorkloadData[] = data?.workloads || [];
  const isOverloaded = data?.is_overloaded || false;

  return (
    <div className="pending-triage-widget">
      {/* Se for o próprio usuário vendo sua carga */}
      {data?.personal && (
        <div className="triage-stats">
          <div className="stat-item normal">
            <span className="stat-value">{data.personal.reviews || 0}</span>
            <span className="stat-label">Revisões</span>
          </div>
          <div className="stat-item completed">
            <span className="stat-value">{data.personal.supervisions || 0}</span>
            <span className="stat-label">Supervisões</span>
          </div>
          <div className={`stat-item ${isOverloaded ? 'urgent' : 'normal'}`}>
            <span className="stat-value">{data.personal.total || 0}</span>
            <span className="stat-label">Carga Total</span>
          </div>
        </div>
      )}

      {/* Lista de docentes (para coordenadores) */}
      {workloads.length > 0 && (
        <div className="triage-list">
          {workloads.slice(0, 5).map((wl) => (
            <div key={wl.id} className="triage-item">
              <div>
                <span className="triage-code">{wl.name}</span>
                <span className="triage-title">
                  {wl.reviews_count} revisões • {wl.supervisions_count} supervisões
                </span>
              </div>
              <div className="triage-meta">
                <div style={{ 
                  width: '100px', 
                  height: '4px', 
                  background: 'var(--surface-container)', 
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${wl.load_percentage}%`,
                    height: '100%',
                    background: wl.load_percentage > 80 ? 'var(--error)' : 'var(--primary)',
                    borderRadius: 'var(--radius-full)'
                  }} />
                </div>
                <span className={`text-small ${wl.load_percentage > 80 ? 'text-error' : ''}`}>
                  {wl.load_percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}