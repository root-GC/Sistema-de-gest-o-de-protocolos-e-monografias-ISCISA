// src/pages/secretary/MeetingPage.tsx
import { useEffect, useState } from 'react'
import { deliberationService, type DeliberationMeeting } from '../../../services/deliberationService'
import type { EvaluationForm } from '../../../services/evaluationService'
import '../../../styles/global.css'

export default function MeetingPage() {
  const [pendingForms, setPendingForms] = useState<EvaluationForm[]>([])
  const [meetings, setMeetings] = useState<DeliberationMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showNewMeeting, setShowNewMeeting] = useState(false)
  const [selectedFormIds, setSelectedFormIds] = useState<number[]>([])
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('10:00')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const ORGAN = 'nucleo' // fixo por agora — só Núcleo implementado

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [forms, storedMeetings] = await Promise.all([
        deliberationService.listPendingForMeeting(),
        Promise.resolve(deliberationService.listScheduledMeetings()),
      ])
      setPendingForms(forms)
      setMeetings(storedMeetings)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function toggleFormSelection(formId: number) {
    setSelectedFormIds(prev => prev.includes(formId) ? prev.filter(id => id !== formId) : [...prev, formId])
  }

  function selectAll() {
    setSelectedFormIds(prev => prev.length === pendingForms.length ? [] : pendingForms.map(f => f.id))
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault()
    if (!meetingDate || selectedFormIds.length === 0) {
      setError('Selecione a data e pelo menos um protocolo.')
      setTimeout(() => setError(null), 3000)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const meeting = await deliberationService.scheduleMeeting({
        date: meetingDate,
        time: meetingTime,
        organ: ORGAN,
        notes: meetingNotes || undefined,
        formIds: selectedFormIds,
      })

      setMeetings(prev => [meeting, ...prev])
      setSuccess(`Reunião agendada para ${new Date(meetingDate).toLocaleDateString('pt-PT')} às ${meetingTime}. ${selectedFormIds.length} protocolo(s) incluído(s).`)

      // Limpar formulário
      setMeetingDate('')
      setMeetingTime('10:00')
      setMeetingNotes('')
      setSelectedFormIds([])
      setShowNewMeeting(false)

      // Recarregar para remover da lista de pendentes
      await loadData()
      setTimeout(() => setSuccess(null), 5000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)', padding: 'var(--space-4)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)', color: 'var(--primary)', fontSize: '28px' }}>calendar_add_on</span>
            Marcar Reunião de Deliberação
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Protocolos que precisam de deliberação entre os dois revisores do Núcleo Científico
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewMeeting(!showNewMeeting)}>
          <span className="material-symbols-outlined">{showNewMeeting ? 'close' : 'add'}</span>
          {showNewMeeting ? 'Cancelar' : 'Nova Reunião'}
        </button>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Lista de protocolos pendentes (sempre visível) */}
      {!showNewMeeting && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>pending_actions</span>
              Protocolos Pendentes de Deliberação
            </h2>
            {pendingForms.length > 0 && (
              <span style={{ 
                fontSize: 'var(--body-sm)', 
                padding: '4px 12px', 
                borderRadius: 'var(--radius-full)', 
                background: 'var(--tertiary-container)', 
                color: 'var(--on-tertiary-container)',
                fontWeight: 'var(--font-bold)'
              }}>
                {pendingForms.length} protocolo(s)
              </span>
            )}
          </div>

          {pendingForms.length === 0 ? (
            <EmptyState message="Nenhum protocolo pendente de deliberação." icon="inbox" />
          ) : (
            <div style={{ 
              border: '1px solid var(--outline-variant)', 
              borderRadius: 'var(--radius-lg)', 
              background: 'var(--surface-container-lowest)',
              overflow: 'hidden'
            }}>
              {pendingForms.map(form => (
                <div key={form.id} style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-3)', 
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--outline-variant)',
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: 'var(--radius-lg)', 
                    background: 'var(--tertiary-container)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-tertiary-container)', fontSize: '20px' }}>
                      description
                    </span>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--font-bold)', fontSize: '13px', fontFamily: 'monospace', marginBottom: '2px' }}>
                      {form.protocol?.code || `Protocolo #${form.protocol_id}`}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.protocol?.topic?.title || 'Sem título'}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--error-container)',
                    color: 'var(--on-error-container)',
                    fontWeight: 'var(--font-bold)',
                    flexShrink: 0
                  }}>
                    Aguarda Reunião
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulário de nova reunião */}
      {showNewMeeting && (
        <form onSubmit={handleCreateMeeting} className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>event</span>
            Detalhes da Reunião
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              <label style={labelStyle}>Data *</label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hora</label>
              <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={labelStyle}>Local</label>
            <input 
              type="text" 
              value={ORGAN} 
              readOnly 
              style={{ ...inputStyle, background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }} 
            />
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={labelStyle}>Notas / Observações</label>
            <textarea 
              value={meetingNotes} 
              onChange={e => setMeetingNotes(e.target.value)} 
              rows={2} 
              placeholder="Notas sobre a reunião..." 
              style={{ ...inputStyle, resize: 'vertical' }} 
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)' }}>
                Protocolos para esta reunião ({selectedFormIds.length} selecionados)
              </label>
              <button type="button" onClick={selectAll} className="btn btn-sm btn-outline">
                {selectedFormIds.length === pendingForms.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '1px solid var(--outline-variant)', 
              borderRadius: 'var(--radius-lg)', 
              background: 'var(--surface-container-lowest)' 
            }}>
              {pendingForms.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: 'var(--space-1)' }}>inbox</span>
                  Nenhum protocolo em deliberação pendente.
                </div>
              ) : (
                pendingForms.map(form => {
                  const isSelected = selectedFormIds.includes(form.id)

                  return (
                    <label key={form.id} style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-2)', 
                      padding: '12px 14px',
                      borderBottom: '1px solid var(--outline-variant)', 
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-container)' : 'transparent',
                      transition: 'background 0.2s',
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleFormSelection(form.id)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} 
                      />
                      <span style={{ fontWeight: 'var(--font-bold)', fontSize: '13px', minWidth: '85px', flexShrink: 0, fontFamily: 'monospace' }}>
                        {form.protocol?.code || `#${form.protocol_id}`}
                      </span>
                      <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {form.protocol?.topic?.title || '—'}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg btn-block" 
            disabled={submitting || !meetingDate || selectedFormIds.length === 0}
          >
            {submitting ? (
              'A agendar reunião...'
            ) : (
              <><span className="material-symbols-outlined">event_available</span> Agendar Reunião com {selectedFormIds.length} Protocolo(s)</>
            )}
          </button>
        </form>
      )}

      {/* Reuniões agendadas */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="material-symbols-outlined">list_alt</span>
        Reuniões Agendadas ({meetings.length})
      </h2>

      {meetings.length === 0 ? (
        <EmptyState message="Nenhuma reunião agendada." icon="event_busy" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {meetings.map(meeting => {
            const isExpanded = expandedId === meeting.id
            return (
              <div key={meeting.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : meeting.id)} 
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                      {new Date(meeting.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
                      {meeting.time} • {meeting.deliberationForms.length} protocolo(s)
                    </span>
                  </div>
                  <span className="material-symbols-outlined">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                </div>
                {isExpanded && (
                  <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--outline-variant)' }}>
                    {meeting.deliberationForms.map(df => (
                      <div key={df.id} style={{ fontSize: '13px', padding: '6px 0', color: 'var(--on-surface-variant)' }}>
                        <span style={{ fontWeight: 'var(--font-bold)', fontFamily: 'monospace' }}>
                          {df.protocol?.code || `#${df.protocol_id}`}
                        </span>
                        {' — '}
                        {df.protocol?.topic?.title || 'Sem título'}
                      </div>
                    ))}
                    {meeting.notes && (
                      <p style={{ fontStyle: 'italic', marginTop: 'var(--space-2)', color: 'var(--on-surface-variant)' }}>
                        "{meeting.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { 
  display: 'block', 
  fontSize: 'var(--body-md)', 
  fontWeight: 'var(--font-medium)', 
  marginBottom: 'var(--space-1)' 
}

const inputStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '10px 12px', 
  border: '1px solid var(--outline-variant)', 
  borderRadius: 'var(--radius-lg)', 
  fontSize: 'var(--body-md)', 
  fontFamily: 'var(--font-family)', 
  background: 'var(--surface-container-lowest)', 
  color: 'var(--on-surface)' 
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ 
      padding: 'var(--space-2) var(--space-3)', 
      marginBottom: 'var(--space-4)', 
      borderRadius: 'var(--radius-lg)', 
      background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', 
      color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', 
      fontSize: 'var(--body-md)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: 'var(--space-2)' 
    }}>
      <span className="material-symbols-outlined">{type === 'error' ? 'error' : 'check_circle'}</span>
      {children}
    </div>
  )
}

function EmptyState({ message, icon }: { message: string; icon?: string }) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: 'var(--space-5)', 
      color: 'var(--on-surface-variant)', 
      background: 'var(--surface-container-low)', 
      borderRadius: 'var(--radius-xl)', 
      border: '1px dashed var(--outline-variant)' 
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
        {icon || 'inbox'}
      </span>
      <p>{message}</p>
    </div>
  )
}