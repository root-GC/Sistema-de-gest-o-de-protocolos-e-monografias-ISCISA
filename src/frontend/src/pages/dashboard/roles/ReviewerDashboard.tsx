import { Link } from 'react-router-dom'
import { TeacherEmptyState, TeacherPageHeader, TeacherSummaryCard } from '../../../components/teacher/TeacherWorkspace'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { useRoleDashboard } from '../../../hooks/useRoleDashboard'
import type { ReviewerDashboardPayload } from '../../../types/dashboard'
import { NotificationsPanel } from '../components/NotificationsPanel'

const ORGAN_LABELS: Record<string, string> = {
  nucleo: 'Núcleo Científico',
  comite_cientifico: 'Comité Científico',
  comite_bioetica: 'Comité de Bioética',
};

export function ReviewerDashboard() {
  const { data, isLoading, error } = useRoleDashboard<ReviewerDashboardPayload>()

  if (isLoading) return <div className="teacher-workspace"><LoadingSpinner variant="page" text="A carregar as tuas avaliações..." /></div>
  if (error) return <main className="teacher-workspace"><div className="reviewer-alert" role="alert">{error}</div></main>
  if (!data) return null

  return (
    <main className="teacher-workspace" aria-labelledby="reviewer-dashboard-title">
      <TeacherPageHeader
        eyebrow="Área do Revisor"
        title={`Olá, ${data.profile.name}`}
        titleId="reviewer-dashboard-title"
        description="Acompanha as avaliações que aguardam o teu parecer."
        actions={<Link className="btn btn-primary" to="/reviews"><span className="material-symbols-outlined" aria-hidden="true">rate_review</span>Ver revisões</Link>}
      />

      <section className="teacher-summary-grid" aria-label="Resumo do revisor">
        <TeacherSummaryCard icon="pending_actions" label="Avaliações pendentes" value={data.pending_evaluations.length} />
        <TeacherSummaryCard icon="notifications" label="Notificações" value={data.notifications.length} />
      </section>

      <section className="teacher-panel" aria-labelledby="reviewer-pending-title" style={{ padding: 'var(--space-2) var(--space-3)' }}>
        <h2 id="reviewer-pending-title" style={{ margin: 0, color: 'var(--on-surface)', fontSize: 'var(--title-md)' }}>Avaliações pendentes</h2>
        {data.pending_evaluations.length === 0 ? (
          <TeacherEmptyState icon="task_alt" title="Sem avaliações pendentes" description="Novas revisões serão apresentadas nesta área." />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            {data.pending_evaluations.map(item => (
              <div key={item.evaluation_form_id} className="teacher-list-card">
                <div style={{ minWidth: 0 }}>
                  <strong style={{ color: 'var(--on-surface)', overflowWrap: 'anywhere' }}>{item.title ?? `Ficha #${item.evaluation_form_id}`}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>{ORGAN_LABELS[item.organ] ?? item.organ}</p>
                </div>
                <span className={`teacher-status teacher-status--${item.status === 'in_progress' ? 'pending' : 'neutral'}`}>{item.status === 'in_progress' ? 'Em progresso' : 'Por iniciar'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="teacher-panel" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)' }}>
        <NotificationsPanel items={data.notifications} />
      </section>
    </main>
  )
}
