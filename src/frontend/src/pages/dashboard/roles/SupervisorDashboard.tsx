import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TeacherEmptyState, TeacherPageHeader, TeacherSummaryCard } from '../../../components/teacher/TeacherWorkspace'
import { LoadingSpinner } from '../../../components/LoadingSpinner'
import { useAuth } from '../../../context/AuthContext'
import { useRoleDashboard } from '../../../hooks/useRoleDashboard'
import type { PendingApprovalItem, ReviewerDashboardPayload, SupervisorDashboardPayload } from '../../../types/dashboard'
import { NotificationsPanel } from '../components/NotificationsPanel'
import { supervisorService, type Supervisee } from '../../../services/supervisorService'

function hasPendingDecision(supervisee: Supervisee) {
  const status = supervisee.current_submission?.status

  return status === 'topic_pending_supervisor'
    || status === 'protocol_pending_supervisor'
    || status === 'protocol_submitted'
    || status === 'monograph_pending_supervisor'
    || status === 'monograph_submitted'
}

function submissionTitle(supervisee: Supervisee) {
  return supervisee.current_submission?.title
    || supervisee.current_topic?.title
    || supervisee.current_submission?.code
    || supervisee.current_protocol?.code
    || 'Sem submissão em curso'
}

function formatSubmittedAt(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function SupervisorDashboard() {
  const { roles, profiles } = useAuth()
  const hasReviewerProfile = roles.includes('reviewer')
  const { data, isLoading, error } = useRoleDashboard<SupervisorDashboardPayload>('supervisor')
  const reviewerDashboard = useRoleDashboard<ReviewerDashboardPayload>('reviewer', hasReviewerProfile)
  const [supervisees, setSupervisees] = useState<Supervisee[]>([])
  const [superviseesLoading, setSuperviseesLoading] = useState(true)
  const [superviseesError, setSuperviseesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const requestId = window.setTimeout(() => {
      void supervisorService.listSupervisees()
        .then(response => {
          if (!cancelled) setSupervisees(response.supervisees || [])
        })
        .catch(requestError => {
          if (!cancelled) {
            setSuperviseesError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os supervisionandos.')
          }
        })
        .finally(() => {
          if (!cancelled) setSuperviseesLoading(false)
        })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(requestId)
    }
  }, [])

  if (isLoading) return <div className="teacher-workspace"><LoadingSpinner variant="page" text="A carregar os teus tutorandos..." /></div>
  if (error) return <main className="teacher-workspace"><div className="reviewer-alert" role="alert">{error}</div></main>
  if (!data) return null

  const pendingTopics = data.pending_topics || []
  const pendingProtocols = data.pending_protocols || []
  const totalPending = pendingTopics.length + pendingProtocols.length
  const reviewerPending = reviewerDashboard.data?.pending_evaluations || []
  const teacherProfile = profiles.teacher ?? profiles.supervisor ?? profiles.reviewer

  return (
    <main className="teacher-workspace" aria-labelledby="supervisor-dashboard-title">
      <TeacherPageHeader
        eyebrow="Área do Docente"
        title={`Olá, ${data.profile.name}`}
        titleId="supervisor-dashboard-title"
        description="Acompanha os teus supervisionandos, aprova submissões e trata das revisões atribuídas no mesmo espaço."
        actions={
          <>
            <Link className="btn btn-outline" to="/supervision"><span className="material-symbols-outlined" aria-hidden="true">groups</span>Supervisionandos</Link>
            <Link className="btn btn-primary" to="/supervision/pending"><span className="material-symbols-outlined" aria-hidden="true">fact_check</span>Aprovar submissões</Link>
            {hasReviewerProfile && <Link className="btn btn-outline" to="/reviews"><span className="material-symbols-outlined" aria-hidden="true">rate_review</span>Revisões</Link>}
          </>
        }
      />

      <section className="teacher-summary-grid" aria-label="Resumo da área docente">
        <TeacherSummaryCard icon="apartment" label="Departamento" value={teacherProfile?.department || 'Não definido'} />
        <TeacherSummaryCard icon="science" label="Área científica" value={teacherProfile?.scientific_area?.name || 'Não definida'} />
        <TeacherSummaryCard icon="groups" label="Supervisionandos" value={data.supervisees_count} detail="Estudantes atribuídos a ti" />
        <TeacherSummaryCard icon="pending_actions" label="Aprovações pendentes" value={totalPending} />
        {hasReviewerProfile && <TeacherSummaryCard icon="rate_review" label="Revisões pendentes" value={reviewerDashboard.isLoading ? '...' : reviewerPending.length} />}
      </section>

      <section className="teacher-panel" aria-labelledby="supervisees-overview-title" style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <div>
            <h2 id="supervisees-overview-title" style={{ margin: 0, color: 'var(--on-surface)', fontSize: 'var(--title-md)' }}>Supervisionandos</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>Estado atual, curso e submissão mais recente de cada estudante.</p>
          </div>
          <Link className="btn btn-outline btn-sm" to="/supervision">Ver todos</Link>
        </header>

        {superviseesLoading ? (
          <p aria-live="polite" style={{ margin: 'var(--space-3) 0 0', color: 'var(--on-surface-variant)' }}>A carregar supervisionandos...</p>
        ) : superviseesError ? (
          <div className="reviewer-alert" role="alert" style={{ marginTop: 'var(--space-3)' }}>{superviseesError}</div>
        ) : supervisees.length === 0 ? (
          <TeacherEmptyState icon="groups" title="Sem supervisionandos atribuídos" description="Os estudantes atribuídos a ti aparecerão aqui." />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {supervisees.slice(0, 6).map(supervisee => {
              const submission = supervisee.current_submission
              const pendingDecision = hasPendingDecision(supervisee)
              const reviewPath = submission && pendingDecision
                ? `/supervision/review/${submission.type}/${submission.id}`
                : '/supervision'

              return (
                <article key={supervisee.student.id ?? supervisee.student.email} className="teacher-list-card">
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ color: 'var(--on-surface)' }}>{supervisee.student.name || 'Estudante sem nome'}</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>
                      {[supervisee.student.student_number, supervisee.student.course?.name].filter(Boolean).join(' · ') || 'Curso não definido'}
                    </p>
                    <p style={{ margin: '4px 0 0', color: 'var(--on-surface)', fontSize: 'var(--body-md)', overflowWrap: 'anywhere' }}>
                      {submissionTitle(supervisee)}
                    </p>
                    {submission?.submitted_at && (
                      <p style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>Submetido em {formatSubmittedAt(submission.submitted_at)}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className={`teacher-status teacher-status--${pendingDecision ? 'pending' : 'neutral'}`}>{submission?.status_label || supervisee.phase_label}</span>
                    <Link className="btn btn-outline btn-sm" to={reviewPath}>{pendingDecision ? 'Decidir' : 'Consultar'}</Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {totalPending === 0 ? (
        <TeacherEmptyState icon="task_alt" title="Sem aprovações pendentes" description="As novas submissões aparecerão aqui quando precisarem da tua validação." />
      ) : (
        <section aria-label="Submissões que aguardam aprovação" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {pendingTopics.length > 0 && <ApprovalSection title="Temas para validar" type="topic" items={pendingTopics} />}
          {pendingProtocols.length > 0 && <ApprovalSection title="Protocolos para validar" type="protocol" items={pendingProtocols} />}
        </section>
      )}

      {hasReviewerProfile && (
        <section className="teacher-panel academic-dashboard-panel" aria-labelledby="reviewer-pending-title">
          <header className="academic-dashboard-panel__header">
            <div>
              <h2 id="reviewer-pending-title">Revisões atribuídas</h2>
              <p>Protocolos e temas que aguardam o teu parecer como revisor.</p>
            </div>
            <div className="academic-dashboard-panel__actions">
              <Link className="btn btn-outline btn-sm" to="/reviews/history">Histórico</Link>
              <Link className="btn btn-primary btn-sm" to="/reviews">Ver revisões</Link>
            </div>
          </header>

          {reviewerDashboard.isLoading ? (
            <p className="academic-dashboard-message" aria-live="polite">A carregar revisões...</p>
          ) : reviewerDashboard.error ? (
            <div className="reviewer-alert" role="alert">{reviewerDashboard.error}</div>
          ) : reviewerPending.length === 0 ? (
            <div className="academic-dashboard-empty">
              <span className="material-symbols-outlined" aria-hidden="true">task_alt</span>
              <div>
                <strong>Sem revisões pendentes</strong>
                <p>As novas atribuições aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <div className="academic-dashboard-list">
              {reviewerPending.slice(0, 6).map(item => (
                <div key={item.evaluation_form_id} className="academic-dashboard-row">
                  <div>
                    <strong>{item.title ?? `Ficha #${item.evaluation_form_id}`}</strong>
                    <p>{ORGAN_LABELS[item.organ] ?? item.organ}</p>
                  </div>
                  <span className={`teacher-status teacher-status--${item.status === 'in_progress' ? 'pending' : 'neutral'}`}>
                    {item.status === 'in_progress' ? 'Em revisão' : 'Por iniciar'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="teacher-panel" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)' }}>
        <NotificationsPanel items={data.notifications} />
      </section>
    </main>
  )
}

const ORGAN_LABELS: Record<string, string> = {
  nucleo: 'Núcleo Científico',
  comite_cientifico: 'Comité Científico',
  comite_bioetica: 'Comité de Bioética',
}

function ApprovalSection({ title, type, items }: { title: string; type: 'topic' | 'protocol'; items: PendingApprovalItem[] }) {
  return (
    <section className="teacher-panel" style={{ padding: 'var(--space-2) var(--space-3)' }}>
      <h2 style={{ margin: 0, color: 'var(--on-surface)', fontSize: 'var(--title-md)' }}>{title}</h2>
      <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        {items.map(item => (
          <div key={item.id} className="teacher-list-card">
            <div>
              <strong style={{ color: 'var(--on-surface)' }}>{item.title ?? `Submissão #${item.id}`}</strong>
              {item.submitted_at && (
                <p style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>Submetido em {new Date(item.submitted_at).toLocaleDateString('pt-MZ')}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="teacher-status teacher-status--pending">Pendente</span>
              <Link className="btn btn-outline btn-sm" to={`/supervision/review/${type}/${item.id}`}>Abrir</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
