import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import type { StatsDashboardPayload } from '../../../types/dashboard';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

const STATUS_LABELS: Record<string, string> = {
  protocol_pending_supervisor: 'Aguardando supervisor',
  protocol_rejected_supervisor: 'Não Aprovado (supervisor)',
  protocol_pending_nucleo: 'Aguardando Núcleo',
  protocol_in_review_nucleo: 'Em avaliação — Núcleo',
  protocol_pending_comite_cientifico: 'Aguardando Comité Científico',
  protocol_in_review_comite_cientifico: 'Em avaliação — CC',
  protocol_pending_comite_bioetica: 'Aguardando Comité de Bioética',
  protocol_in_review_comite_bioetica: 'Em avaliação — Bioética',
  protocol_rejected_nucleo: 'Não Aprovado (Núcleo)',
  protocol_rejected_cc: 'Não Aprovado (CC)',
  protocol_rejected_bioetica: 'Não Aprovado (Bioética)',
  protocol_approved_final: 'Aprovado',
  protocol_rejected_final: 'Não Aprovado (final)',
};

export function StatsDashboard({ title, loadingText }: { title: string; loadingText: string }) {
  const { data, isLoading, error } = useRoleDashboard<StatsDashboardPayload>();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner variant="page" text={loadingText} />
      </div>
    );
  }

  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return null;

  return (
    <div className="dashboard-container">
      <h1 className="greeting">{title}</h1>
      {data.profile.scope && (
        <p className="dashboard-scope">Âmbito: {data.profile.scope}</p>
      )}

      <div className="dashboard-stats-grid">
        <StatCard label="Protocolos" value={data.stats.total_protocols} />
        {typeof data.stats.total_users === 'number' && (
          <StatCard label="Utilizadores" value={data.stats.total_users} />
        )}
        {typeof data.stats.protocols_this_month === 'number' && (
          <StatCard label="Este mês" value={data.stats.protocols_this_month} />
        )}
      </div>

      <section className="dashboard-section">
        <h2 className="section-title">Por estado</h2>
        <ul className="status-breakdown-list">
          {Object.entries(data.stats.by_status).map(([status, count]) => (
            <li key={status} className="status-breakdown-item">
              <span>{STATUS_LABELS[status] ?? status}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
      </section>

      {data.pending_final_decisions && data.pending_final_decisions.length > 0 && (
        <section className="dashboard-section">
          <h2 className="section-title">Decisões finais pendentes</h2>
          <ul className="dashboard-list">
            {data.pending_final_decisions.map(item => (
              <li key={item.evaluation_form_id} className="dashboard-list-item">
                <span>{item.title ?? `Ficha #${item.evaluation_form_id}`}</span>
                <span className="widget-count">{item.organ}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NotificationsPanel items={data.notifications} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__label">{label}</p>
    </div>
  );
}