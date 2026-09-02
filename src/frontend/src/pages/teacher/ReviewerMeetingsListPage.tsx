import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deliberationService, type DeliberationMeeting, type MeetingStatus } from '../../services/deliberationService'
import './teacherWorkspace.css'

type Filter = 'all' | MeetingStatus

const STATUS: Record<MeetingStatus, { label: string; icon: string; className: string }> = {
  scheduled: { label: 'Agendada', icon: 'event', className: 'is-scheduled' },
  in_progress: { label: 'Em andamento', icon: 'play_circle', className: 'is-in-progress' },
  completed: { label: 'Concluída', icon: 'task_alt', className: 'is-completed' },
  cancelled: { label: 'Cancelada', icon: 'event_busy', className: 'is-cancelled' },
}

const formatDate = (value: string) => new Intl.DateTimeFormat('pt-MZ', {
  dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Maputo',
}).format(new Date(value))

function deadline(days: number | null, overdue: boolean, reviewed: boolean) {
  if (reviewed) return 'Revisão submetida'
  if (days === null) return 'Prazo começa após o encerramento'
  if (overdue) return `Atrasado há ${Math.abs(days)} dia(s)`
  if (days === 0) return 'Prazo termina hoje'
  return `${days} dia(s) restante(s)`
}

export default function ReviewerMeetingsListPage() {
  const [params, setParams] = useSearchParams()
  const filter = (params.get('status') || 'all') as Filter
  const [meetings, setMeetings] = useState<DeliberationMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await deliberationService.listMeetings()
      setMeetings(response.meetings)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as reuniões.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  const filtered = useMemo(
    () => filter === 'all' ? meetings : meetings.filter(meeting => meeting.status === filter),
    [filter, meetings],
  )

  const counts = useMemo(() => ({
    scheduled: meetings.filter(item => item.status === 'scheduled').length,
    in_progress: meetings.filter(item => item.status === 'in_progress').length,
    completed: meetings.filter(item => item.status === 'completed').length,
  }), [meetings])

  function setFilter(next: Filter) {
    const nextParams = new URLSearchParams(params)
    if (next === 'all') nextParams.delete('status')
    else nextParams.set('status', next)
    setParams(nextParams)
  }

  return (
    <main className="teacher-workspace" aria-labelledby="reviewer-meetings-title">
      <header className="teacher-page-header">
        <div>
          <span className="teacher-eyebrow">Área do docente · Revisor</span>
          <h1 id="reviewer-meetings-title">Reuniões de deliberação</h1>
          <p>Consulta as reuniões reais e os protocolos da pauta que te foram atribuídos.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar
        </button>
      </header>

      <div className="teacher-summary-grid">
        <Summary label="Agendadas" value={counts.scheduled} icon="event" active={filter === 'scheduled'} onClick={() => setFilter('scheduled')} />
        <Summary label="Em andamento" value={counts.in_progress} icon="play_circle" active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} />
        <Summary label="Concluídas" value={counts.completed} icon="task_alt" active={filter === 'completed'} onClick={() => setFilter('completed')} />
      </div>

      <div className="teacher-filter-row">
        <label htmlFor="meeting-status">Estado</label>
        <select id="meeting-status" value={filter} onChange={event => setFilter(event.target.value as Filter)}>
          <option value="all">Todos</option>
          <option value="scheduled">Agendadas</option>
          <option value="in_progress">Em andamento</option>
          <option value="completed">Concluídas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {error && <div className="teacher-alert teacher-alert--error" role="alert">{error}<button type="button" onClick={() => void load()}>Tentar novamente</button></div>}
      {loading ? <div className="page-loader" role="status"><div className="page-loader__spinner" />A carregar reuniões...</div> : (
        <section className="reviewer-real-meetings" aria-live="polite">
          {filtered.length === 0 ? <div className="teacher-empty-state"><span className="material-symbols-outlined" aria-hidden="true">event_available</span><h2>Sem reuniões neste estado</h2><p>Quando a Secretaria marcar uma deliberação, ela aparecerá aqui.</p></div> : filtered.map(meeting => (
            <article key={meeting.id} className="reviewer-meeting-card">
              <header>
                <div className="reviewer-meeting-card__icon"><span className="material-symbols-outlined" aria-hidden="true">{STATUS[meeting.status].icon}</span></div>
                <div><span className="teacher-eyebrow">{meeting.organ?.name}</span><h2>{formatDate(meeting.scheduled_at)}</h2><p><span className="material-symbols-outlined" aria-hidden="true">location_on</span>{meeting.location}</p></div>
                <span className={`teacher-status ${STATUS[meeting.status].className}`}>{STATUS[meeting.status].label}</span>
              </header>
              {meeting.notes && <p className="reviewer-meeting-card__notes">{meeting.notes}</p>}
              <div className="reviewer-meeting-items">
                {meeting.items.map((item, index) => {
                  const mine = item.reviewers.find(reviewer => reviewer.is_me) || item.reviewers[0]
                  return <Link key={item.id} to={`/reviewer/meetings/${item.protocol.id}?meeting=${meeting.id}&item=${item.id}`}><span className="reviewer-meeting-position">{index + 1}</span><div><strong>{item.protocol.code}</strong><span>{item.protocol.title || 'Sem tema registado'}</span>{mine && <small className={mine.overdue ? 'is-overdue' : ''}>{mine.review_status === 'reviewed' ? 'Revisto' : 'Não revisto'} · {deadline(mine.days_remaining, mine.overdue, mine.review_status === 'reviewed')}</small>}</div><span className="material-symbols-outlined" aria-hidden="true">chevron_right</span></Link>
                })}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

function Summary({ label, value, icon, active, onClick }: { label: string; value: number; icon: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={`teacher-summary-card${active ? ' is-active' : ''}`} onClick={onClick}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span><span><small>{label}</small><strong>{value}</strong></span></button>
}
