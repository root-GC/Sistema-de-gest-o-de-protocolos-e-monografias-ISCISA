import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth, type SecretaryProfile } from '../../../context/AuthContext'
import {
  deliberationService,
  type DeliberationMeeting,
  type DeliberationQueueEntry,
} from '../../../services/deliberationService'
import './secretaryWorkspace.css'

type Tab = 'queue' | 'scheduled' | 'in_progress' | 'completed'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'queue', label: 'Lista de protocolos', icon: 'format_list_numbered' },
  { id: 'scheduled', label: 'Agendadas', icon: 'event' },
  { id: 'in_progress', label: 'Em andamento', icon: 'play_circle' },
  { id: 'completed', label: 'Concluídas', icon: 'task_alt' },
]

const formatDateTime = (value: string) => new Intl.DateTimeFormat('pt-MZ', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Maputo',
}).format(new Date(value))

function toMaputoInput(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Maputo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value || ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

function maputoInputToUtc(value: string) {
  return new Date(`${value}:00+02:00`).toISOString()
}

export default function MeetingPage() {
  const { activeProfile } = useAuth()
  const secretary = activeProfile as SecretaryProfile | null
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab') as Tab | null
  const tab: Tab = TABS.some(item => item.id === rawTab) ? rawTab! : 'queue'
  const selectedProtocolId = Number(params.get('protocol'))
  const [queue, setQueue] = useState<DeliberationQueueEntry[]>([])
  const [meetings, setMeetings] = useState<DeliberationMeeting[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState<DeliberationMeeting | null>(null)
  const [cancelling, setCancelling] = useState<DeliberationMeeting | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [startingMeetingId, setStartingMeetingId] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isCommittee = ['scientific_committee', 'bioethics_committee'].includes(secretary?.organ?.type || '')

  const loadData = useCallback(async () => {
    if (!isCommittee) return
    setLoading(true)
    setError(null)
    try {
      const [queueResponse, meetingsResponse] = await Promise.all([
        deliberationService.listQueue(),
        deliberationService.listMeetings(),
      ])
      setQueue(queueResponse.queue)
      setMeetings(meetingsResponse.meetings)
      if (selectedProtocolId) {
        setSelected(queueResponse.queue.filter(item => item.protocol.id === selectedProtocolId).map(item => item.evaluation_form_id))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as deliberações.')
    } finally {
      setLoading(false)
    }
  }, [isCommittee, selectedProtocolId])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void loadData() }, 0)
    return () => window.clearTimeout(requestId)
  }, [loadData])

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now())
    updateTime()
    const intervalId = window.setInterval(updateTime, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  const visibleMeetings = useMemo(
    () => meetings.filter(meeting => meeting.status === tab),
    [meetings, tab],
  )
  const selectedQueue = queue.filter(item => selected.includes(item.evaluation_form_id))

  function changeTab(next: Tab) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', next)
    nextParams.delete('meeting')
    setParams(nextParams)
  }

  function toggleItem(id: number) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  async function createMeeting(event: React.FormEvent) {
    event.preventDefault()
    if (!scheduledAt || !location.trim() || selected.length === 0) {
      setError('Seleciona protocolos, data, hora e local.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const response = await deliberationService.createMeeting({
        scheduled_at: maputoInputToUtc(scheduledAt),
        location: location.trim(),
        notes: notes.trim() || null,
        evaluation_form_ids: selectedQueue.map(item => item.evaluation_form_id),
      })
      setMessage(response.message)
      setSelected([])
      setScheduledAt('')
      setLocation('')
      setNotes('')
      changeTab('scheduled')
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível marcar a reunião.')
    } finally {
      setSubmitting(false)
    }
  }

  function openReschedule(meeting: DeliberationMeeting) {
    setEditing(meeting)
    setScheduledAt(toMaputoInput(meeting.scheduled_at))
    setLocation(meeting.location)
    setNotes(meeting.notes || '')
  }

  async function reschedule(event: React.FormEvent) {
    event.preventDefault()
    if (!editing || !scheduledAt || !location.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await deliberationService.rescheduleMeeting(editing.id, {
        scheduled_at: maputoInputToUtc(scheduledAt),
        location: location.trim(),
        notes: notes.trim() || null,
      })
      setMessage(response.message)
      setEditing(null)
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível reagendar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelMeeting() {
    if (!cancelling) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await deliberationService.cancelMeeting(cancelling.id, cancelReason.trim() || null)
      setMessage(response.message)
      setCancelling(null)
      setCancelReason('')
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível cancelar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function startMeeting(meeting: DeliberationMeeting) {
    setStartingMeetingId(meeting.id)
    setError(null)
    try {
      const response = await deliberationService.startMeeting(meeting.id)
      setMessage(response.message)
      changeTab('in_progress')
      await loadData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível iniciar a reunião.')
    } finally {
      setStartingMeetingId(null)
    }
  }

  if (!isCommittee) {
    return <main className="secretary-workspace"><EmptyState title="Deliberações indisponíveis" text="Os Núcleos tratam apenas de temas. As reuniões de protocolos pertencem aos comités." /></main>
  }

  return (
    <main className="secretary-workspace" aria-labelledby="deliberation-title">
      <header className="secretary-page-header">
        <div>
          <h1 id="deliberation-title" className="secretary-page-header__title">Deliberações</h1>
          <p>Agenda real do {secretary?.organ?.name}. A fila respeita a ordem de atribuição dos revisores.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => void loadData()} disabled={loading}>
          <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
          Atualizar
        </button>
      </header>

      <div className="secretary-tabs" role="tablist" aria-label="Estados das deliberações">
        {TABS.map(item => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'is-active' : ''} onClick={() => changeTab(item.id)}>
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            {item.label}
            <span className="secretary-tab-count">{item.id === 'queue' ? queue.length : meetings.filter(meeting => meeting.status === item.id).length}</span>
          </button>
        ))}
      </div>

      <div className="secretary-feedback" aria-live="polite">
        {message && <div className="secretary-alert secretary-alert--success">{message}</div>}
        {error && <div className="secretary-alert secretary-alert--error" role="alert">{error}</div>}
      </div>

      {loading ? <Loader /> : tab === 'queue' ? (
        <div className="deliberation-layout">
          <section aria-labelledby="protocol-list-title">
            <div className="secretary-section-heading">
              <div><h2 id="protocol-list-title">Lista de protocolos</h2><p>Os protocolos são apresentados pela data em que entraram na lista.</p></div>
              {queue.length > 0 && <button type="button" className="btn btn-sm btn-outline" onClick={() => setSelected(selected.length === queue.length ? [] : queue.map(item => item.evaluation_form_id))}>{selected.length === queue.length ? 'Desmarcar todos' : 'Selecionar todos'}</button>}
            </div>
            <div className="deliberation-queue">
              {queue.length === 0 ? <EmptyState title="Fila em dia" text="Nenhum protocolo aguarda agendamento neste órgão." /> : queue.map((item, index) => (
                <QueueRow key={item.evaluation_form_id} item={item} position={index + 1} checked={selected.includes(item.evaluation_form_id)} onToggle={() => toggleItem(item.evaluation_form_id)} />
              ))}
            </div>
            <aside className="secretary-alert" style={{ marginTop: 'var(--space-3)' }}>
              <strong>Prazo de acompanhamento</strong>
              <p style={{ margin: '4px 0 0' }}>A contagem começa no dia em que o protocolo entra nesta lista. Após sete dias completos sem deliberação, o protocolo é assinalado como atrasado. Este aviso orienta a priorização da pauta e não bloqueia o agendamento ou a decisão.</p>
            </aside>
          </section>

          <form className="deliberation-schedule-panel" onSubmit={createMeeting}>
            <div><span className="secretary-eyebrow">Nova reunião</span><h2>Preparar pauta</h2><p>{selected.length} protocolo(s) selecionado(s) pela ordem da lista.</p></div>
            <Field label="Data e hora" id="meeting-at"><input id="meeting-at" type="datetime-local" min={toMaputoInput(new Date().toISOString())} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} required /></Field>
            <Field label="Local" id="meeting-location"><input id="meeting-location" value={location} onChange={event => setLocation(event.target.value)} maxLength={500} required /></Field>
            <Field label="Notas" id="meeting-notes"><textarea id="meeting-notes" value={notes} onChange={event => setNotes(event.target.value)} rows={3} maxLength={5000} /></Field>
            {selectedQueue.length > 0 && <ol className="deliberation-agenda-summary">{selectedQueue.map(item => <li key={item.evaluation_form_id}><strong>{item.protocol.code}</strong><span>{item.protocol.title}</span></li>)}</ol>}
            <button className="btn btn-primary" type="submit" disabled={submitting || selected.length === 0}>{submitting ? 'A marcar...' : 'Marcar reunião'}</button>
          </form>
        </div>
      ) : (
        <section className="deliberation-meeting-list" aria-live="polite">
          {visibleMeetings.length === 0 ? <EmptyState title="Sem reuniões neste estado" text="Os registos aparecerão aqui quando o fluxo avançar." /> : visibleMeetings.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} currentTime={currentTime} onStart={() => void startMeeting(meeting)} starting={startingMeetingId === meeting.id} onEdit={() => openReschedule(meeting)} onCancel={() => setCancelling(meeting)} />
          ))}
        </section>
      )}

      {editing && <Modal title="Reagendar reunião" onClose={() => setEditing(null)}><form onSubmit={reschedule} className="deliberation-modal-form"><Field label="Data e hora" id="reschedule-at"><input id="reschedule-at" type="datetime-local" min={toMaputoInput(new Date().toISOString())} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} required autoFocus /></Field><Field label="Local" id="reschedule-location"><input id="reschedule-location" value={location} onChange={event => setLocation(event.target.value)} required /></Field><Field label="Notas" id="reschedule-notes"><textarea id="reschedule-notes" value={notes} onChange={event => setNotes(event.target.value)} rows={3} /></Field><div className="secretary-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Voltar</button><button className="btn btn-primary" disabled={submitting}>{submitting ? 'A guardar...' : 'Guardar'}</button></div></form></Modal>}
      {cancelling && <Modal title="Cancelar reunião" onClose={() => setCancelling(null)}><p>Os {cancelling.items.length} protocolos regressarão imediatamente à fila na posição original.</p><Field label="Motivo opcional" id="cancel-reason"><textarea id="cancel-reason" value={cancelReason} onChange={event => setCancelReason(event.target.value)} rows={3} autoFocus /></Field><div className="secretary-modal-actions"><button type="button" className="btn btn-outline" onClick={() => setCancelling(null)}>Manter reunião</button><button type="button" className="btn btn-danger" onClick={() => void cancelMeeting()} disabled={submitting}>{submitting ? 'A cancelar...' : 'Confirmar cancelamento'}</button></div></Modal>}
    </main>
  )
}

function QueueRow({ item, position, checked, onToggle }: { item: DeliberationQueueEntry; position: number; checked: boolean; onToggle: () => void }) {
  const overdueDays = Math.max(0, item.waiting_days - 7)
  const isOverdue = overdueDays > 0

  return <article className={`deliberation-queue-row${checked ? ' is-selected' : ''}`}><label className="deliberation-select"><input type="checkbox" checked={checked} onChange={onToggle} /><span className="deliberation-position" aria-label={`Posição ${position}`}>{position}</span></label><div className="deliberation-protocol"><strong>{item.protocol.code}</strong><span>{item.protocol.title || 'Sem tema registado'}</span><small>Na lista desde {formatDateTime(item.queue_entered_at)} · {item.waiting_days} dia(s) em espera</small>{isOverdue && <small className="is-overdue">Atrasado há {overdueDays} dia(s)</small>}</div><div className="deliberation-reviewers">{item.reviewers.map(reviewer => <div key={reviewer.id} className="deliberation-reviewer"><span><strong>{reviewer.name}</strong>{reviewer.is_primary && <small>Principal</small>}</span><span className={reviewer.review_status === 'reviewed' ? 'is-reviewed' : 'is-pending'}>{reviewer.review_status === 'reviewed' ? 'Revisto' : 'Não revisto'}</span></div>)}</div></article>
}

function MeetingCard({ meeting, currentTime, starting, onStart, onEdit, onCancel }: { meeting: DeliberationMeeting; currentTime: number; starting: boolean; onStart: () => void; onEdit: () => void; onCancel: () => void }) {
  const canStart = new Date(meeting.scheduled_at).getTime() <= currentTime

  return <article className="deliberation-meeting-card"><div className="deliberation-meeting-card__header"><div><span className="secretary-eyebrow">Reunião #{meeting.id}</span><h2>{formatDateTime(meeting.scheduled_at)}</h2><p><span className="material-symbols-outlined" aria-hidden="true">location_on</span>{meeting.location}</p></div><span className={`secretary-status-badge is-${meeting.status}`}>{meeting.status === 'scheduled' ? 'Agendada' : meeting.status === 'in_progress' ? 'Em andamento' : 'Concluída'}</span></div>{meeting.notes && <p className="deliberation-notes">{meeting.notes}</p>}<div className="deliberation-agenda-list">{meeting.items.map((item, index) => <div key={item.id}><span>{index + 1}</span><div><strong>{item.protocol.code}</strong><small>{item.protocol.title}</small></div><span className={`secretary-status-badge is-${item.status}`}>{item.status === 'scheduled' ? 'Agendado' : item.status === 'in_progress' ? 'Em deliberação' : item.status === 'deliberated' ? 'Deliberado' : 'Sem consenso'}</span></div>)}</div>{meeting.status === 'scheduled' && meeting.can_manage && <div className="deliberation-card-actions"><button className="btn btn-sm btn-primary" type="button" onClick={onStart} disabled={starting || !canStart}><span className="material-symbols-outlined" aria-hidden="true">play_circle</span>{starting ? 'A iniciar...' : canStart ? 'Iniciar reunião' : 'Aguardar horário'}</button><button className="btn btn-sm btn-outline" type="button" onClick={onEdit}><span className="material-symbols-outlined" aria-hidden="true">edit_calendar</span>Reagendar</button><button className="btn btn-sm btn-danger" type="button" onClick={onCancel}><span className="material-symbols-outlined" aria-hidden="true">event_busy</span>Cancelar</button></div>}</article>
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div className="secretary-field"><label htmlFor={id}>{label}</label>{children}</div> }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">event_available</span><h2>{title}</h2><p>{text}</p></div> }
function Loader() { return <div className="secretary-loading" role="status"><span className="secretary-spinner" />A carregar deliberações...</div> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="secretary-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="secretary-modal" role="dialog" aria-modal="true" aria-labelledby="deliberation-modal-title"><header><h2 id="deliberation-modal-title">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar"><span className="material-symbols-outlined" aria-hidden="true">close</span></button></header>{children}</section></div> }
