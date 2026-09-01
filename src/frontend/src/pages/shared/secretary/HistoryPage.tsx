import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, type SecretaryProfile } from '../../../context/AuthContext'
import { protocolService, type Protocol, type ProtocolHistory } from '../../../services/protocolService'
import { topicService, type Topic, type TopicHistory } from '../../../services/topicService'
import './secretaryWorkspace.css'

type HistorySource = 'topic' | 'protocol'
type HistoryEntry = TopicHistory | ProtocolHistory

interface HistoryRow {
  id: string
  source: HistorySource
  itemId: number
  code: string
  title: string
  context: string
  action: string
  actionLabel: string
  description: string
  oldStatus?: string | null
  newStatus?: string | null
  actor?: string | null
  occurredAt: string
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function organLabel(organType?: string) {
  switch (organType) {
    case 'scientific_committee': return 'Comité Científico'
    case 'bioethics_committee': return 'Comité de Bioética'
    case 'nucleus': return 'Núcleo Científico'
    default: return 'Órgão da Secretaria'
  }
}

function getProtocolList(organType?: string) {
  if (organType === 'scientific_committee') return protocolService.listForSecretaryCC
  if (organType === 'bioethics_committee') return protocolService.listForSecretaryBioetica
  return null
}

function mapHistoryEntry(entry: HistoryEntry, fallbackStatus: string): Pick<HistoryRow, 'action' | 'actionLabel' | 'description' | 'oldStatus' | 'newStatus' | 'actor' | 'occurredAt'> {
  return {
    action: entry.action,
    actionLabel: entry.action_label || entry.action,
    description: entry.description || entry.new_status_label || fallbackStatus,
    oldStatus: entry.old_status_label || entry.old_status,
    newStatus: entry.new_status_label || entry.new_status,
    actor: entry.actor?.name ?? null,
    occurredAt: entry.occurred_at,
  }
}

export default function HistoryPage() {
  const { activeProfile } = useAuth()
  const secretary = activeProfile as SecretaryProfile | null
  const organType = secretary?.organ?.type
  const isNucleus = organType === 'nucleus'
  const sourceLabel = isNucleus ? 'temas' : 'protocolos'
  const [searchParams, setSearchParams] = useSearchParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = searchParams.get('q') ?? ''
  const action = searchParams.get('action') ?? 'all'

  const updateSearch = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isNucleus) {
        const response = await topicService.listForSecretary()
        setTopics(response.topics)
        setProtocols([])
        return
      }

      const listProtocols = getProtocolList(organType)
      if (!listProtocols) throw new Error('O órgão activo não trata protocolos.')
      const response = await listProtocols()
      setProtocols(response.protocols)
      setTopics([])
    } catch (requestError) {
      setTopics([])
      setProtocols([])
      setError(requestError instanceof Error ? requestError.message : `Não foi possível carregar o histórico de ${sourceLabel}.`)
    } finally {
      setLoading(false)
    }
  }, [isNucleus, organType, sourceLabel])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  const rows = useMemo<HistoryRow[]>(() => {
    const topicRows = topics.flatMap(topic => (topic.histories ?? []).map(entry => ({
      id: `topic-${topic.id}-${entry.id}`,
      source: 'topic' as const,
      itemId: topic.id,
      code: topic.course?.code ? `${topic.course.code}-${topic.id}` : `Tema #${topic.id}`,
      title: topic.title,
      context: topic.scientific_area?.name || topic.course?.name || 'Núcleo Científico',
      ...mapHistoryEntry(entry, topic.status_label || topic.status),
    })))

    const protocolRows = protocols.flatMap(protocol => {
      const entries = protocol.organ_tracking?.history ?? protocol.histories ?? []

      return entries.map(entry => ({
        id: `protocol-${protocol.id}-${entry.id}`,
        source: 'protocol' as const,
        itemId: protocol.id,
        code: protocol.code || `Protocolo #${protocol.id}`,
        title: protocol.topic?.title || 'Protocolo sem tema associado',
        context: protocol.student?.name || protocol.organ_tracking?.organ_name || organLabel(organType),
        ...mapHistoryEntry(entry, protocol.organ_tracking?.status_label || protocol.status_label || protocol.status),
      }))
    })

    return [...topicRows, ...protocolRows]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  }, [organType, protocols, topics])

  const actions = useMemo(() => [...new Set(rows.map(row => row.actionLabel))].sort((a, b) => a.localeCompare(b, 'pt-PT')), [rows])
  const filtered = useMemo(() => rows.filter(row => {
    const text = query.trim().toLocaleLowerCase('pt-PT')
    const matchesText = !text || [row.code, row.title, row.context, row.actionLabel, row.description, row.actor ?? '']
      .some(value => value.toLocaleLowerCase('pt-PT').includes(text))

    return matchesText && (action === 'all' || row.actionLabel === action)
  }), [action, query, rows])

  return (
    <main className="secretary-workspace" aria-labelledby="secretary-history-title">
      <header className="secretary-page-header">
        <div>
          <h1 id="secretary-history-title" className="secretary-page-header__title">Histórico</h1>
          <p className="secretary-page-header__description">Consulta as ações registadas neste órgão.</p>
          <span className="secretary-organ-badge"><span className="material-symbols-outlined" aria-hidden="true">history</span>{organLabel(organType)}</span>
        </div>
        <div className="secretary-panel__actions">
          <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}><span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar</button>
          <Link className="btn btn-primary" to="/secretary/protocols"><span className="material-symbols-outlined" aria-hidden="true">assignment</span>Submissões</Link>
        </div>
      </header>

      {error && <div className="secretary-alert secretary-alert--error" role="alert" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span></div>}

      <section className="secretary-summary-grid" aria-label="Resumo do histórico">
        <div className="secretary-stat"><span className="secretary-stat__label">Registos</span><strong className="secretary-stat__value">{rows.length}</strong></div>
        <div className="secretary-stat"><span className="secretary-stat__label">{isNucleus ? 'Temas' : 'Protocolos'}</span><strong className="secretary-stat__value">{isNucleus ? topics.length : protocols.length}</strong></div>
        <div className="secretary-stat"><span className="secretary-stat__label">Eventos filtrados</span><strong className="secretary-stat__value">{filtered.length}</strong></div>
      </section>

      <div className="secretary-toolbar secretary-toolbar--history">
        <div className="secretary-control-group">
          <label className="secretary-field-label" htmlFor="history-search">Pesquisar</label>
          <input id="history-search" name="history-search" className="secretary-control" type="search" autoComplete="off" value={query} placeholder="Código, título, ação ou utilizador…" onChange={event => updateSearch({ q: event.target.value || null })} />
        </div>
        <div className="secretary-control-group">
          <label className="secretary-field-label" htmlFor="history-action">Ação</label>
          <select id="history-action" name="history-action" className="secretary-control" value={action} onChange={event => updateSearch({ action: event.target.value === 'all' ? null : event.target.value })}>
            <option value="all">Todas as ações</option>
            {actions.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="secretary-loading"><span className="secretary-spinner" aria-hidden="true" />A carregar histórico…</div>
      ) : filtered.length === 0 ? (
        <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">history_off</span><strong>Sem histórico encontrado</strong><span>Ajusta os filtros ou atualiza a lista.</span></div>
      ) : (
        <section className="secretary-history-page-list" aria-label="Registos de histórico">
          {filtered.map(row => (
            <article key={row.id} className="secretary-history-card">
              <div className="secretary-history-card__main">
                <p className="secretary-row__eyebrow">{row.code} · {row.context}</p>
                <h2 className="secretary-row__title">{row.title}</h2>
                <p className="secretary-helper-text">{row.description}</p>
                {(row.oldStatus || row.newStatus) && <p className="secretary-helper-text">{row.oldStatus || 'Sem estado anterior'} → {row.newStatus || 'Estado mantido'}</p>}
              </div>
              <div className="secretary-history-card__meta">
                <span className="secretary-status-badge secretary-status-badge--complete">{row.actionLabel}</span>
                <time dateTime={row.occurredAt}>{formatDateTime(row.occurredAt)}</time>
                <small>{row.actor || 'Sistema'}</small>
                <Link className="btn btn-outline btn-sm" to={`/secretary/protocols?type=${row.source === 'topic' ? 'topics' : 'protocols'}&status=all&item=${row.itemId}`}>Ver submissão</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
