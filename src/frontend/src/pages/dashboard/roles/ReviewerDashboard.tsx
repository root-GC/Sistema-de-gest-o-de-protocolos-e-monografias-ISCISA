import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import type { ReviewerDashboardPayload } from '../../../types/dashboard';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

const ORGAN_LABELS: Record<string, string> = {
  nucleo: 'Núcleo Científico',
  comite_cientifico: 'Comité Científico',
  comite_bioetica: 'Comité de Bioética',
};

export function ReviewerDashboard() {
  const { data, isLoading, error } = useRoleDashboard<ReviewerDashboardPayload>();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner variant="page" text="A carregar as tuas avaliações..." />
      </div>
    );
  }

  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return null;

  return (
    <div className="dashboard-container">
      <h1 className="greeting">Olá, {data.profile.name}</h1>

      <section className="dashboard-section">
        <h2 className="section-title">Avaliações pendentes</h2>
        {data.pending_evaluations.length === 0 ? (
          <p className="dashboard-empty">Sem avaliações pendentes por agora.</p>
        ) : (
          <ul className="dashboard-list">
            {data.pending_evaluations.map(item => (
              <li key={item.evaluation_form_id} className="dashboard-list-item">
                <div>
                  <p className="dashboard-item-title">
                    {item.title ?? `Ficha #${item.evaluation_form_id}`}
                  </p>
                  <span className="dashboard-item-meta">
                    {ORGAN_LABELS[item.organ] ?? item.organ}
                  </span>
                </div>
                <span className="widget-count">
                  {item.status === 'in_progress' ? 'Em progresso' : 'Por iniciar'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NotificationsPanel items={data.notifications} />
    </div>
  );
}