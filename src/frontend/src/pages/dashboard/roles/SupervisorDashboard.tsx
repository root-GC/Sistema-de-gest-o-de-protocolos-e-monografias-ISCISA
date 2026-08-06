import { useRoleDashboard } from '../../../hooks/useRoleDashboard';
import type { PendingApprovalItem, SupervisorDashboardPayload } from '../../../types/dashboard';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

export function SupervisorDashboard() {
  const { data, isLoading, error } = useRoleDashboard<SupervisorDashboardPayload>();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner variant="page" text="A carregar os teus tutorandos..." />
      </div>
    );
  }

  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return null;

  const totalPending = data.pending_topics.length + data.pending_protocols.length;

  return (
    <div className="dashboard-container">
      <h1 className="greeting">Olá, {data.profile.name}</h1>
      <p className="dashboard-supervisees">
        {data.supervisees_count} tutorando{data.supervisees_count !== 1 ? 's' : ''}
      </p>

      {totalPending === 0 ? (
        <section className="dashboard-section">
          <p className="dashboard-empty">Sem aprovações pendentes por agora.</p>
        </section>
      ) : (
        <>
          {data.pending_topics.length > 0 && (
            <ApprovalSection title="Temas para aprovar" items={data.pending_topics} />
          )}
          {data.pending_protocols.length > 0 && (
            <ApprovalSection title="Protocolos para aprovar" items={data.pending_protocols} />
          )}
        </>
      )}

      <NotificationsPanel items={data.notifications} />
    </div>
  );
}

function ApprovalSection({ title, items }: { title: string; items: PendingApprovalItem[] }) {
  return (
    <section className="dashboard-section">
      <h2 className="section-title">{title}</h2>
      <ul className="dashboard-list">
        {items.map(item => (
          <li key={item.id} className="dashboard-list-item">
            <span className="dashboard-item-title">{item.title ?? `#${item.id}`}</span>
            {item.submitted_at && (
              <span className="dashboard-item-meta">
                Desde {new Date(item.submitted_at).toLocaleDateString('pt-MZ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}