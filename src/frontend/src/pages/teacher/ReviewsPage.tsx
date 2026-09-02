import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ReviewerProtocolAttachmentsDialog } from '../../components/protocol/ReviewerProtocolAttachmentsDialog'
import { evaluationService, type EvaluationForm } from '../../services/evaluationService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { topicService, type Topic } from '../../services/topicService'
import './reviewerWorkspace.css'

type ReviewType = 'topics' | 'protocols'

type ReviewItem = {
  id: number
  type: ReviewType
  title: string
  code: string
  statusLabel: string
  context?: string | null
  assignedAt?: string | null
  completedAt?: string | null
  complete: boolean
  daysRemaining?: number | null
  overdue?: boolean
  href: string
  protocol?: Protocol
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem data registada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem data registada'
  return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function durationInDays(start?: string | null, end?: string | null) {
  if (!start) return null
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null
  return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000))
}

function durationLabel(start?: string | null, end?: string | null) {
  const days = durationInDays(start, end)
  if (days === null) return 'Duração indisponível'
  return `${days} dia${days === 1 ? '' : 's'}`
}

function protocolFormOrgan(protocol: Protocol): 'comite_cientifico' | 'comite_bioetica' | null {
  switch (protocol.my_assignment?.organ?.type) {
    case 'scientific_committee': return 'comite_cientifico'
    case 'bioethics_committee': return 'comite_bioetica'
    default: return null
  }
}

function getProtocolForm(protocol: Protocol, forms: EvaluationForm[]) {
  const organ = protocolFormOrgan(protocol)
  if (!organ) return null
  return forms.find(form => form.protocol_id === protocol.id && form.organ === organ && form.form_type === 'evaluation') ?? null
}

function protocolItem(protocol: Protocol, forms: EvaluationForm[]): ReviewItem {
  const form = getProtocolForm(protocol, forms)
  const evaluation = form?.reviewer_evaluations?.[0]
  const complete = evaluation?.status === 'submitted' || Boolean(evaluation?.submitted_at)

  return {
    id: protocol.id,
    type: 'protocols',
    title: protocol.topic?.title || 'Protocolo sem tema associado',
    code: protocol.code || `Protocolo #${protocol.id}`,
    statusLabel: complete ? 'Revisão concluída' : protocol.status_label || 'Em revisão',
    context: protocol.my_assignment?.organ?.name || protocol.topic?.scientific_area?.name || null,
    assignedAt: protocol.my_assignment?.assigned_at,
    completedAt: evaluation?.submitted_at,
    complete,
    daysRemaining: evaluation?.days_remaining,
    overdue: evaluation?.overdue,
    href: `/reviews/protocols/${protocol.id}`,
    protocol,
  }
}

function topicItem(topic: Topic): ReviewItem {
  const evaluation = topic.my_assignment?.evaluation
  const complete = Boolean(evaluation?.decision || evaluation?.evaluated_at)

  return {
    id: topic.id,
    type: 'topics',
    title: topic.title,
    code: topic.course?.code || `Tema #${topic.id}`,
    statusLabel: complete
      ? evaluation?.decision === 'approved' ? 'Aprovado' : 'Não aprovado'
      : topic.status_label || 'Em revisão',
    context: topic.scientific_area?.name || topic.course?.name || null,
    assignedAt: topic.my_assignment?.assigned_at,
    completedAt: evaluation?.evaluated_at,
    complete,
    href: `/reviews/topics/${topic.id}`,
  }
}

export default function ReviewsPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [forms, setForms] = useState<EvaluationForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attachmentProtocol, setAttachmentProtocol] = useState<Protocol | null>(null)

  const activeType: ReviewType = searchParams.get('type') === 'protocols' ? 'protocols' : 'topics'
  const showingHistory = location.pathname === '/reviews/history'

  const updateType = useCallback((type: ReviewType) => {
    const next = new URLSearchParams(searchParams)
    if (type === 'topics') next.delete('type')
    else next.set('type', type)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [topicResponse, protocolResponse, formResponse] = await Promise.all([
        topicService.listForReviewer(),
        protocolService.listForReviewer(),
        evaluationService.listForReviewerAcrossCommittees(),
      ])
      setTopics(topicResponse.topics || [])
      setProtocols(protocolResponse.protocols || [])
      setForms(formResponse.evaluation_forms || [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar as revisões. Atualize a página para tentar novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  const topicItems = useMemo(() => topics.map(topicItem), [topics])
  const protocolItems = useMemo(
    () => protocols.filter(protocol => protocolFormOrgan(protocol) !== null).map(protocol => protocolItem(protocol, forms)),
    [forms, protocols]
  )
  const activeItems = activeType === 'topics' ? topicItems : protocolItems
  const visibleItems = activeItems.filter(item => showingHistory ? item.complete : !item.complete)
  const pendingCount = topicItems.filter(item => !item.complete).length + protocolItems.filter(item => !item.complete).length
  const completedItems = [...topicItems, ...protocolItems].filter(item => item.complete)
  const completedCount = completedItems.length
  const averageDuration = completedItems.length
    ? Math.round(completedItems.reduce((total, item) => total + (durationInDays(item.assignedAt, item.completedAt) ?? 0), 0) / completedItems.length)
    : null

  return (
    <main className="teacher-workspace reviewer-workspace" aria-labelledby="reviewer-workspace-title">
      <header className="reviewer-workspace__header">
        <div>
          <p className="reviewer-workspace__eyebrow">Área do Revisor</p>
          <h1 id="reviewer-workspace-title">{showingHistory ? 'Histórico de Revisões' : 'Minhas Revisões'}</h1>
          <p>{showingHistory ? 'Consulta as revisões que já submeteste.' : 'Organiza o trabalho pendente e abre cada avaliação.'}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar
        </button>
      </header>

      <section className="reviewer-summary-grid" aria-label="Resumo das revisões">
        <div className="reviewer-summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">pending_actions</span>
          <span className="reviewer-summary-card__value">{pendingCount}</span>
          <span className="reviewer-summary-card__label">Pendentes</span>
        </div>
        <div className="reviewer-summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">task_alt</span>
          <span className="reviewer-summary-card__value">{completedCount}</span>
          <span className="reviewer-summary-card__label">Concluídas</span>
        </div>
        <div className="reviewer-summary-card">
          <span className="material-symbols-outlined" aria-hidden="true">timelapse</span>
          <span className="reviewer-summary-card__value">{averageDuration === null ? '—' : `${averageDuration} d`}</span>
          <span className="reviewer-summary-card__label">Duração média</span>
        </div>
      </section>

      {error && <div className="reviewer-alert" role="alert" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">error</span>{error}</div>}

      <div className="reviewer-tabs" role="tablist" aria-label="Tipo de revisão">
        <button type="button" role="tab" aria-selected={activeType === 'topics'} className="reviewer-tab" onClick={() => updateType('topics')}>
          <span className="material-symbols-outlined" aria-hidden="true">lightbulb</span>Temas <span>{topicItems.filter(item => showingHistory ? item.complete : !item.complete).length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeType === 'protocols'} className="reviewer-tab" onClick={() => updateType('protocols')}>
          <span className="material-symbols-outlined" aria-hidden="true">description</span>Protocolos <span>{protocolItems.filter(item => showingHistory ? item.complete : !item.complete).length}</span>
        </button>
      </div>

      {loading ? (
        <div className="reviewer-loading" role="status" aria-live="polite"><span className="reviewer-spinner" aria-hidden="true" />A carregar revisões…</div>
      ) : visibleItems.length === 0 ? (
        <div className="reviewer-empty-state">
          <span className="material-symbols-outlined" aria-hidden="true">{showingHistory ? 'history_toggle_off' : 'assignment_turned_in'}</span>
          <strong>{showingHistory ? 'Ainda não há revisões concluídas' : `Sem ${activeType === 'topics' ? 'temas' : 'protocolos'} pendentes`}</strong>
          <span>{showingHistory ? 'As avaliações submetidas aparecerão aqui.' : 'Novas atribuições aparecerão nesta fila.'}</span>
        </div>
      ) : (
        <section className="reviewer-review-list" aria-label={showingHistory ? 'Revisões concluídas' : 'Revisões pendentes'}>
          {visibleItems.map(item => {
            const protocol = item.protocol

            return (
            <article key={`${item.type}-${item.id}`} className="reviewer-review-card">
              <div className="reviewer-review-card__main">
                <div className="reviewer-review-card__heading">
                  <span className="reviewer-review-card__code">{item.code}</span>
                  <span className={`reviewer-status reviewer-status--${item.complete ? 'approved' : 'pending'}`}>{item.statusLabel}</span>
                </div>
                <h2>{item.title}</h2>
                <div className="reviewer-review-card__meta">
                  {item.context && <span><span className="material-symbols-outlined" aria-hidden="true">account_balance</span>{item.context}</span>}
                  <span><span className="material-symbols-outlined" aria-hidden="true">event</span>Atribuída: {formatDate(item.assignedAt)}</span>
                  <span><span className="material-symbols-outlined" aria-hidden="true">schedule</span>{durationLabel(item.assignedAt, item.complete ? item.completedAt : null)}</span>
                  {!item.complete && item.type === 'protocols' && item.daysRemaining !== undefined && (
                    <span className={item.overdue ? 'is-overdue' : ''}><span className="material-symbols-outlined" aria-hidden="true">timer</span>{item.daysRemaining === null ? 'Prazo começa após o encerramento da reunião' : item.overdue ? `Atrasado há ${Math.abs(item.daysRemaining)} dia(s)` : item.daysRemaining === 0 ? 'Prazo termina hoje' : `${item.daysRemaining} dia(s) restante(s)`}</span>
                  )}
                </div>
              </div>

              <div className="reviewer-review-card__actions">
                {protocol && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setAttachmentProtocol(protocol)}>
                    <span className="material-symbols-outlined" aria-hidden="true">attach_file</span>Anexos ({protocol.reviewer_attachments?.length || 0})
                  </button>
                )}
                <Link to={item.href} className="btn btn-primary btn-sm">
                  <span className="material-symbols-outlined" aria-hidden="true">{item.complete ? 'visibility' : 'rate_review'}</span>{item.complete ? 'Consultar' : 'Avaliar'}
                </Link>
              </div>

              {showingHistory && protocol?.review_history && protocol.review_history.length > 0 && (
                <section className="reviewer-history" aria-label={`Histórico do ${item.code}`}>
                  <p className="reviewer-history__title"><span className="material-symbols-outlined" aria-hidden="true">history</span>Eventos deste órgão</p>
                  <ol>
                    {protocol.review_history.map(entry => (
                      <li key={entry.id}>
                        <strong>{entry.description || entry.action.replaceAll('_', ' ')}</strong>
                        <span>{formatDate(entry.occurred_at)}{entry.actor?.name ? ` · ${entry.actor.name}` : ''}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </article>
            )
          })}
        </section>
      )}

      <ReviewerProtocolAttachmentsDialog protocol={attachmentProtocol} open={Boolean(attachmentProtocol)} onClose={() => setAttachmentProtocol(null)} />
    </main>
  )
}
