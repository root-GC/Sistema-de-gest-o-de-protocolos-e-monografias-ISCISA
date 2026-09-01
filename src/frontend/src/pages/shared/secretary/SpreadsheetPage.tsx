import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, type SecretaryProfile } from '../../../context/AuthContext'
import { protocolService, type Protocol } from '../../../services/protocolService'
import { topicService, type Topic } from '../../../services/topicService'
import { deliberationService, type DeliberationMeeting } from '../../../services/deliberationService'
import './secretaryWorkspace.css'

type StatusFilter = 'all' | 'pending' | 'reviewing' | 'approved' | 'rejected'
type TrackingItemType = 'topic' | 'protocol'

interface TrackingRow {
  id: number
  itemType: TrackingItemType
  code: string
  title: string
  student: string
  contact: string
  course: string
  version: string
  meetingAt: string | null
  status: string
  category: Exclude<StatusFilter, 'all'>
  submittedAt: string | null
  approvedAt: string | null
  elapsedDays: number | null
  reviewers: string
}

function classifyStatus(status: string): TrackingRow['category'] {
  if (status.includes('approved')) return 'approved'
  if (status.includes('rejected') || status.includes('not_approved')) return 'rejected'
  if (status.includes('review') || status.includes('assigned')) return 'reviewing'
  return 'pending'
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '-'
}

function approvedAtFromHistory(histories: Array<{ new_status?: string | null; occurred_at: string }> | undefined) {
  const approvals = histories?.filter(history => history.new_status?.includes('approved')) ?? []
  return approvals[approvals.length - 1]?.occurred_at ?? null
}

function protocolReviewers(protocol: Protocol) {
  const names = (protocol.review_assignments ?? []).flatMap(assignment => [
    assignment.reviewer_one?.name,
    assignment.reviewer_two?.name,
  ]).filter((name): name is string => Boolean(name))

  return [...new Set(names)].join(', ') || '-'
}

function topicReviewers(topic: Topic) {
  const names = (topic.review_assignments ?? [])
    .map(assignment => assignment.reviewer?.name)
    .filter((name): name is string => Boolean(name))

  return [...new Set(names)].join(', ') || '-'
}

function getProtocolList(organType?: string) {
  if (organType === 'scientific_committee') return protocolService.listForSecretaryCC
  if (organType === 'bioethics_committee') return protocolService.listForSecretaryBioetica
  return null
}

export default function SpreadsheetPage() {
  const { activeProfile } = useAuth()
  const secretary = activeProfile as SecretaryProfile | null
  const organType = secretary?.organ?.type
  const isNucleus = organType === 'nucleus'
  const itemPlural = isNucleus ? 'temas' : 'protocolos'
  const itemPluralTitle = isNucleus ? 'Temas' : 'Protocolos'
  const [searchParams, setSearchParams] = useSearchParams()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [meetings, setMeetings] = useState<DeliberationMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const query = searchParams.get('q') ?? ''
  const requestedStatus = searchParams.get('status') as StatusFilter | null
  const status = requestedStatus && ['all', 'pending', 'reviewing', 'approved', 'rejected'].includes(requestedStatus) ? requestedStatus : 'all'
  const course = searchParams.get('course') ?? 'all'
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
        setMeetings([])
        return
      }

      const listProtocols = getProtocolList(organType)
      if (!listProtocols) throw new Error('O órgão activo não trata protocolos.')

      const [response, meetingsResponse] = await Promise.all([
        listProtocols(),
        deliberationService.listMeetings(),
      ])
      setProtocols(response.protocols)
      setTopics([])
      setMeetings(meetingsResponse.meetings)
    } catch (requestError) {
      setProtocols([])
      setTopics([])
      setMeetings([])
      setError(requestError instanceof Error ? requestError.message : `Não foi possível carregar os ${itemPlural}. Tenta novamente.`)
    } finally {
      setLoading(false)
    }
  }, [isNucleus, itemPlural, organType])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  const topicRows = useMemo<TrackingRow[]>(() => topics.map(topic => {
    const latestHistory = topic.histories?.[topic.histories.length - 1]
    const submitted = topic.submitted_at ? new Date(topic.submitted_at) : null
    const latest = latestHistory?.occurred_at ? new Date(latestHistory.occurred_at) : new Date()

    return {
      id: topic.id,
      itemType: 'topic',
      code: topic.course?.code ? `${topic.course.code}-${topic.id}` : `Tema #${topic.id}`,
      title: topic.title,
      student: 'Revisão cega',
      contact: '-',
      course: topic.course?.name || topic.scientific_area?.name || 'Sem curso',
      version: '-',
      meetingAt: null,
      status: topic.status_label || topic.status,
      category: classifyStatus(topic.status),
      submittedAt: topic.submitted_at,
      approvedAt: approvedAtFromHistory(topic.histories),
      elapsedDays: submitted ? Math.max(0, Math.floor((latest.getTime() - submitted.getTime()) / 86400000)) : null,
      reviewers: topicReviewers(topic),
    }
  }), [topics])

  const meetingDatesByProtocol = useMemo(() => {
    const dates = new Map<number, string>()
    const orderedMeetings = [...meetings]
      .filter(meeting => meeting.status !== 'cancelled')
      .sort((left, right) => new Date(right.scheduled_at).getTime() - new Date(left.scheduled_at).getTime())

    orderedMeetings.forEach(meeting => {
      meeting.items.forEach(item => {
        if (!dates.has(item.protocol.id)) dates.set(item.protocol.id, meeting.scheduled_at)
      })
    })

    return dates
  }, [meetings])

  const protocolRows = useMemo<TrackingRow[]>(() => protocols.map(protocol => {
    const effectiveStatus = protocol.organ_tracking?.status_label || protocol.status_label || protocol.status
    const rawStatus = protocol.organ_tracking?.latest_action || protocol.status
    const submitted = protocol.submitted_at ? new Date(protocol.submitted_at) : null
    const latest = protocol.organ_tracking?.latest_action_at ? new Date(protocol.organ_tracking.latest_action_at) : new Date()

    return {
      id: protocol.id,
      itemType: 'protocol',
      code: protocol.code || `Protocolo #${protocol.id}`,
      title: protocol.topic?.title || 'Protocolo sem tema associado',
      student: protocol.student?.name || '-',
      contact: protocol.student?.email || '-',
      course: (protocol.topic as { course?: { name?: string } } | undefined)?.course?.name || 'Sem curso',
      version: protocol.version || '-',
      meetingAt: meetingDatesByProtocol.get(protocol.id) ?? null,
      status: effectiveStatus,
      category: classifyStatus(rawStatus),
      submittedAt: protocol.submitted_at,
      approvedAt: protocol.organ_tracking?.approved_at || approvedAtFromHistory(protocol.histories),
      elapsedDays: submitted ? Math.max(0, Math.floor((latest.getTime() - submitted.getTime()) / 86400000)) : null,
      reviewers: protocolReviewers(protocol),
    }
  }), [meetingDatesByProtocol, protocols])

  const rows = isNucleus ? topicRows : protocolRows
  const courses = useMemo(() => [...new Set(rows.map(row => row.course))].sort((a, b) => a.localeCompare(b, 'pt-PT')), [rows])
  const filtered = useMemo(() => rows.filter(row => {
    const text = query.trim().toLocaleLowerCase('pt-PT')
    const matchesQuery = !text || [row.code, row.title, row.student].some(value => value.toLocaleLowerCase('pt-PT').includes(text))
    return matchesQuery && (status === 'all' || row.category === status) && (course === 'all' || row.course === course)
  }), [course, query, rows, status])
  const totals = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(row => row.category === 'pending').length,
    reviewing: rows.filter(row => row.category === 'reviewing').length,
  }), [rows])

  function exportCsv() {
    const headers = ['ID', 'Data da submissão', 'Código', 'Nome do estudante', 'Contacto/e-mail', 'Título do trabalho', 'Número da versão', 'Data da reunião', 'Ponto de situação', 'Data da aprovação', 'Tempo gasto', 'Avaliadores']
    const csv = [headers, ...filtered.map(row => [row.id, formatDate(row.submittedAt), row.code, row.student, row.contact, row.title, row.version, formatDate(row.meetingAt), row.status, formatDate(row.approvedAt), row.elapsedDays === null ? '' : `${row.elapsedDays} dias`, row.reviewers])]
      .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = isNucleus ? 'planilha-temas.csv' : 'planilha-protocolos.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="secretary-workspace" aria-labelledby="spreadsheet-title">
      <header className="secretary-page-header">
        <div>
          <h1 id="spreadsheet-title" className="secretary-page-header__title">Acompanhamento de {itemPluralTitle}</h1>
          <p className="secretary-page-header__description">Consulta o estado e o tempo de permanência dos {itemPlural} no teu órgão.</p>
        </div>
        <div className="secretary-panel__actions">
          <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}><span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar</button>
          <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={filtered.length === 0}><span className="material-symbols-outlined" aria-hidden="true">download</span>Exportar</button>
        </div>
      </header>

      {error && <div className="secretary-alert secretary-alert--error" role="alert" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span></div>}

      <section className="secretary-summary-grid" aria-label={`Resumo de ${itemPlural}`}>
        <div className="secretary-stat"><span className="secretary-stat__label">Total</span><strong className="secretary-stat__value">{totals.total}</strong></div>
        <div className="secretary-stat"><span className="secretary-stat__label">Para tratar</span><strong className="secretary-stat__value">{totals.pending}</strong></div>
        <div className="secretary-stat"><span className="secretary-stat__label">Em revisão</span><strong className="secretary-stat__value">{totals.reviewing}</strong></div>
      </section>

      <div className="secretary-toolbar">
        <div className="secretary-control-group"><label className="secretary-field-label" htmlFor="submission-search">Pesquisar</label><input id="submission-search" name="submission-search" className="secretary-control" type="search" autoComplete="off" value={query} placeholder="Código, título ou estudante…" onChange={event => updateSearch({ q: event.target.value || null })} /></div>
        <div className="secretary-control-group"><label className="secretary-field-label" htmlFor="course-filter">Curso</label><select id="course-filter" name="course-filter" className="secretary-control" value={course} onChange={event => updateSearch({ course: event.target.value === 'all' ? null : event.target.value })}><option value="all">Todos os cursos</option>{courses.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="secretary-filter-group" aria-label="Estado da submissão">{(['all', 'pending', 'reviewing', 'approved', 'rejected'] as StatusFilter[]).map(item => <button key={item} type="button" className="secretary-filter" aria-pressed={status === item} onClick={() => updateSearch({ status: item === 'all' ? null : item })}>{item === 'all' ? 'Todos' : item === 'pending' ? 'Para tratar' : item === 'reviewing' ? 'Em revisão' : item === 'approved' ? 'Aprovados' : 'Não aprovados'}</button>)}</div>
      </div>

      {loading ? (
        <div className="secretary-loading"><span className="secretary-spinner" aria-hidden="true" />A carregar {itemPlural}…</div>
      ) : filtered.length === 0 ? (
        <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">search_off</span><strong>Não foram encontradas submissões</strong><span>Ajusta os filtros ou atualiza a lista.</span></div>
      ) : (
        <>
          <div className="secretary-table-wrap">
            <table className="secretary-table secretary-tracking-table">
              <thead><tr><th>ID</th><th>Data da submissão</th><th>Código</th><th>Nome do estudante</th><th>Contacto/e-mail</th><th>Título do trabalho</th><th>Número da versão</th><th>Data da reunião</th><th>Ponto de situação</th><th>Data da aprovação</th><th>Tempo gasto</th><th>Avaliadores</th></tr></thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={`${row.itemType}-${row.id}`}>
                    <td>{row.id}</td>
                    <td>{formatDate(row.submittedAt)}</td>
                    <td><Link to={`/secretary/protocols?type=${row.itemType === 'topic' ? 'topics' : 'protocols'}&status=all&item=${row.id}`}>{row.code}</Link></td>
                    <td>{row.student}</td>
                    <td>{row.contact}</td>
                    <td><span className="secretary-table__title" title={row.title}>{row.title}</span></td>
                    <td>{row.version}</td>
                    <td>{formatDate(row.meetingAt)}</td>
                    <td><span className={`secretary-status-badge secretary-status-badge--${row.category}`}>{row.status}</span></td>
                    <td>{formatDate(row.approvedAt)}</td>
                    <td>{row.elapsedDays === null ? '-' : `${row.elapsedDays} dias`}</td>
                    <td>{row.reviewers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="secretary-mobile-list">
            {filtered.map(row => (
              <article key={`${row.itemType}-${row.id}`} className="secretary-mobile-row">
                <div><p className="secretary-row__eyebrow">{row.code} · Registo #{row.id}</p><h2 className="secretary-row__title">{row.title}</h2></div>
                <span>{row.student}{row.contact !== '-' ? ` · ${row.contact}` : ''}</span>
                <span className={`secretary-status-badge secretary-status-badge--${row.category}`}>{row.status}</span>
                <dl className="secretary-tracking-fields"><div><dt>Submissão</dt><dd>{formatDate(row.submittedAt)}</dd></div><div><dt>Versão</dt><dd>{row.version}</dd></div><div><dt>Reunião</dt><dd>{formatDate(row.meetingAt)}</dd></div><div><dt>Aprovação</dt><dd>{formatDate(row.approvedAt)}</dd></div><div><dt>Tempo gasto</dt><dd>{row.elapsedDays === null ? '-' : `${row.elapsedDays} dias`}</dd></div><div><dt>Avaliadores</dt><dd>{row.reviewers}</dd></div></dl>
                <Link className="btn btn-outline" to={`/secretary/protocols?type=${row.itemType === 'topic' ? 'topics' : 'protocols'}&status=all&item=${row.id}`}>Ver detalhes</Link>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
