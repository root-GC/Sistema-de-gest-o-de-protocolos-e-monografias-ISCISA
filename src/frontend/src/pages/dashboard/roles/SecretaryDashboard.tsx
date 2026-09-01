import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useRoleDashboard } from '../../../hooks/useRoleDashboard'
import type { SecretaryDashboardPayload } from '../../../types/dashboard'
import { useAuth } from '../../../context/AuthContext'
import { NotificationsPanel } from '../components/NotificationsPanel'
import '../../shared/secretary/secretaryWorkspace.css'

type QueueCountKey = 'pending_topics' | 'pending_comite_cientifico' | 'pending_comite_bioetica'

function organDetails(type?: string): { label: string; description: string; queueKey: QueueCountKey; type: 'topics' | 'protocols'; itemLabel: string } {
  if (type === 'scientific_committee') return { label: 'Comité Científico', description: 'Órgão superior responsável pela avaliação científica.', queueKey: 'pending_comite_cientifico', type: 'protocols', itemLabel: 'Protocolos' }
  if (type === 'bioethics_committee') return { label: 'Comité de Bioética', description: 'Órgão superior responsável pela avaliação ética.', queueKey: 'pending_comite_bioetica', type: 'protocols', itemLabel: 'Protocolos' }
  return { label: 'Núcleo Científico', description: 'Órgão responsável pela avaliação dos temas da sua área científica.', queueKey: 'pending_topics', type: 'topics', itemLabel: 'Temas' }
}

export function SecretaryDashboard() {
  const { user, profiles } = useAuth()
  const { data, isLoading, error } = useRoleDashboard<SecretaryDashboardPayload>()
  const organType = profiles.secretary?.organ?.type
  const organ = useMemo(() => organDetails(organType), [organType])
  const pending = data?.queue?.[organ.queueKey] ?? 0
  const queueItems = data?.queue?.items ?? []
  const queueUrl = `/secretary/protocols?type=${organ.type}&status=pending`
  const historyUrl = '/secretary/history'
  const organName = data?.organ?.name ?? profiles.secretary?.organ?.name ?? organ.label
  const organDescription = data?.organ?.description || organ.description

  if (isLoading) return <div className="secretary-loading"><span className="secretary-spinner" aria-hidden="true" />A carregar a fila…</div>
  if (error) return <div className="secretary-alert secretary-alert--error" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>

  return (
    <main className="secretary-workspace" aria-labelledby="secretary-dashboard-title">
      <header className="secretary-organ-card">
        <div className="secretary-organ-card__icon">
          <span className="material-symbols-outlined" aria-hidden="true">account_balance</span>
        </div>
        <div className="secretary-organ-card__content">
          <span className="secretary-organ-card__badge">{organ.label}</span>
          <h1 id="secretary-dashboard-title" className="secretary-organ-card__title">{organName}</h1>
          <p className="secretary-organ-card__description">{organDescription}</p>
        </div>
        <div className="secretary-organ-card__side">
          <div className="secretary-organ-card__user">
            <span>Secretário/a</span>
            <strong>{user?.name || 'Utilizador'}</strong>
            {user?.email && <a href={`mailto:${user.email}`}>{user.email}</a>}
          </div>
          <Link className="btn btn-primary" to={queueUrl}><span className="material-symbols-outlined" aria-hidden="true">assignment</span>Ver Submissões</Link>
        </div>
      </header>

      <section className="secretary-summary-grid" aria-label="Resumo da fila">
        <Link className="secretary-stat" to={queueUrl}><span className="secretary-stat__label">{organ.itemLabel} para atribuir</span><strong className="secretary-stat__value">{pending}</strong></Link>
        <Link className="secretary-stat" to={`/secretary/protocols?type=${organ.type}&status=all`}><span className="secretary-stat__label">Submissões na fila</span><strong className="secretary-stat__value">{queueItems.length}</strong></Link>
        <Link className="secretary-stat" to={historyUrl}><span className="secretary-stat__label">Histórico</span><strong className="secretary-stat__value">Abrir</strong></Link>
        <Link className="secretary-stat" to="/secretary/spreadsheet"><span className="secretary-stat__label">Planilha</span><strong className="secretary-stat__value">Abrir</strong></Link>
      </section>

      <section className="secretary-workbench" aria-label="Prioridades e notificações">
        <div className="secretary-queue">
          <div className="secretary-panel">
            <div className="secretary-panel__header"><div><p className="secretary-panel__eyebrow">Prioridade</p><h2 className="secretary-panel__title">Submissões mais antigas</h2></div><Link className="btn btn-outline btn-sm" to={queueUrl}>Abrir Submissões</Link></div>
            <div className="secretary-panel__body">
              {queueItems.length === 0 ? <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">task_alt</span><strong>Sem pendências de atribuição</strong><span>As novas submissões aparecerão aqui.</span></div> : queueItems.slice(0, 5).map(item => { const id = item.item_type === 'topic' ? item.topic_id : item.protocol_id; return <Link key={`${item.item_type}-${id}`} className="secretary-row" to={`/secretary/protocols?type=${organ.type}&status=pending&item=${id}`}><span className="secretary-row__content"><span className="secretary-row__eyebrow">{organ.itemLabel.slice(0, -1)} #{id}</span><span className="secretary-row__title">{item.title || `${organ.itemLabel.slice(0, -1)} sem título`}</span><span className="secretary-row__meta">{item.waiting_since ? `Em espera desde ${new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' }).format(new Date(item.waiting_since))}` : 'Aguardando ação'}</span></span><span className="secretary-status-badge secretary-status-badge--pending">Atribuir</span></Link> })}
            </div>
          </div>
        </div>
        <NotificationsPanel items={data?.notifications ?? []} />
      </section>
    </main>
  )
}
