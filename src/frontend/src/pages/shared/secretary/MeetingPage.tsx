// src/pages/secretary/MeetingPage.tsx
import { useEffect, useState } from 'react'
import '../../../styles/global.css'

interface ProtocolForMeeting {
  id: number
  code: string
  title: string
  studentName: string
  studentEmail: string
  status: string
  statusLabel: string
  organ: string
  organLabel: string
  reviewerOne?: { id: number; name: string; decision?: string; comment?: string }
  reviewerTwo?: { id: number; name: string; decision?: string; comment?: string }
  submittedAt: string
  daysSinceSubmission: number
}

interface Meeting {
  id: number
  date: string
  time: string
  organ: string
  organLabel: string
  protocolIds: number[]
  protocols?: ProtocolForMeeting[]
  status: 'scheduled' | 'in_progress' | 'completed'
  notes?: string
  decisions?: string
  createdAt: string
}

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [pendingProtocols, setPendingProtocols] = useState<ProtocolForMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [showNewMeeting, setShowNewMeeting] = useState(false)
  const [selectedProtocols, setSelectedProtocols] = useState<number[]>([])
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('10:00')
  const [meetingOrgan, setMeetingOrgan] = useState('nucleo')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Expand state
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const organs = [
    { value: 'nucleo', label: 'Núcleo Científico' },
    { value: 'comite_cientifico', label: 'Comité Científico' },
    { value: 'comite_bioetica', label: 'Comité de Bioética' },
  ]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    // ── Mock: Protocolos pendentes ──
    const mockPending: ProtocolForMeeting[] = [
      {
        id: 1, code: 'PTM0001E', title: 'Protocolo de investigação sobre HIV/SIDA',
        studentName: 'Sofia Estudante', studentEmail: 'sofia@iscisa.ac.mz',
        status: 'protocol_in_review_nucleo', statusLabel: 'Em Revisão (Núcleo)',
        organ: 'nucleo', organLabel: 'Núcleo Científico',
        reviewerOne: { id: 1, name: 'Dr. Armando Macuácua', decision: 'approved', comment: 'Protocolo bem estruturado e metodologia rigorosa.' },
        reviewerTwo: { id: 2, name: 'Dra. Carla Mondlane', decision: 'rejected', comment: 'Necessita de ajustes na secção ética e consentimento informado.' },
        submittedAt: '2025-03-15', daysSinceSubmission: 12,
      },
      {
        id: 2, code: 'PTM0002E', title: 'Estudo sobre desnutrição infantil em zonas rurais',
        studentName: 'Carlos Mavie', studentEmail: 'carlos@iscisa.ac.mz',
        status: 'protocol_in_review_nucleo', statusLabel: 'Em Revisão (Núcleo)',
        organ: 'nucleo', organLabel: 'Núcleo Científico',
        reviewerOne: { id: 3, name: 'Prof. Doutor José Chissano', decision: 'rejected', comment: 'Metodologia precisa de maior fundamentação.' },
        reviewerTwo: { id: 4, name: 'Dra. Ana Tembe', decision: 'approved', comment: 'Tema relevante para a saúde pública.' },
        submittedAt: '2025-03-18', daysSinceSubmission: 9,
      },
      {
        id: 3, code: 'PTM0003E', title: 'Avaliação de políticas de saúde pública em Moçambique',
        studentName: 'Ana Tembe', studentEmail: 'ana@iscisa.ac.mz',
        status: 'protocol_in_review_comite_cientifico', statusLabel: 'Em Revisão (CC)',
        organ: 'comite_cientifico', organLabel: 'Comité Científico',
        reviewerOne: { id: 1, name: 'Dr. Armando Macuácua', decision: 'approved', comment: 'Excelente fundamentação teórica.' },
        reviewerTwo: { id: 5, name: 'Dr. Pedro Nkosi', decision: 'approved', comment: 'Objectivos claros e metodologia adequada.' },
        submittedAt: '2025-03-20', daysSinceSubmission: 7,
      },
      {
        id: 4, code: 'PTM0004E', title: 'Análise de dados epidemiológicos em saúde ocupacional',
        studentName: 'Pedro Nkosi', studentEmail: 'pedro@iscisa.ac.mz',
        status: 'protocol_in_review_comite_bioetica', statusLabel: 'Em Revisão (Bioética)',
        organ: 'comite_bioetica', organLabel: 'Comité de Bioética',
        submittedAt: '2025-03-22', daysSinceSubmission: 5,
      },
      {
        id: 5, code: 'PTM0005E', title: 'Estudo clínico sobre resistência antimicrobiana',
        studentName: 'Marta Chissano', studentEmail: 'marta@iscisa.ac.mz',
        status: 'protocol_in_review_comite_cientifico', statusLabel: 'Em Revisão (CC)',
        organ: 'comite_cientifico', organLabel: 'Comité Científico',
        reviewerOne: { id: 2, name: 'Dra. Carla Mondlane', decision: 'approved', comment: 'Bem fundamentado.' },
        submittedAt: '2025-03-25', daysSinceSubmission: 2,
      },
    ]

    setPendingProtocols(mockPending)

    // ── Mock: Reuniões existentes ──
    const mockMeetings: Meeting[] = [
      {
        id: 1,
        date: '2025-04-15',
        time: '14:00',
        organ: 'nucleo',
        organLabel: 'Núcleo Científico',
        protocolIds: [1, 2],
        status: 'scheduled',
        notes: 'Revisão de protocolos pendentes do Núcleo Científico.',
        createdAt: '2025-04-10',
      },
      {
        id: 2,
        date: '2025-04-10',
        time: '09:00',
        organ: 'comite_cientifico',
        organLabel: 'Comité Científico',
        protocolIds: [3],
        status: 'completed',
        notes: 'Reunião concluída. Protocolo aprovado.',
        decisions: 'Aprovado o protocolo PTM0003E com ajustes menores.',
        createdAt: '2025-04-05',
      },
    ]

    setMeetings(mockMeetings)
    setLoading(false)
  }

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id)
  }

  function toggleProtocolSelection(protocolId: number) {
    setSelectedProtocols(prev =>
      prev.includes(protocolId)
        ? prev.filter(id => id !== protocolId)
        : [...prev, protocolId]
    )
  }

  function selectAllProtocols() {
    const filtered = getFilteredProtocols()
    if (selectedProtocols.length === filtered.length) {
      setSelectedProtocols([])
    } else {
      setSelectedProtocols(filtered.map(p => p.id))
    }
  }

  function getFilteredProtocols(): ProtocolForMeeting[] {
    return pendingProtocols.filter(p => p.organ === meetingOrgan)
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault()
    if (!meetingDate || selectedProtocols.length === 0) {
      setError('Selecione a data e pelo menos um protocolo.')
      setTimeout(() => setError(null), 3000)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // await meetingService.create({ date: meetingDate, time: meetingTime, organ: meetingOrgan, protocolIds: selectedProtocols, notes: meetingNotes })

      const newMeeting: Meeting = {
        id: meetings.length + 1,
        date: meetingDate,
        time: meetingTime,
        organ: meetingOrgan,
        organLabel: organs.find(o => o.value === meetingOrgan)?.label || meetingOrgan,
        protocolIds: selectedProtocols,
        status: 'scheduled',
        notes: meetingNotes || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      }

      setMeetings(prev => [newMeeting, ...prev])
      setSuccess(`Reunião agendada para ${new Date(meetingDate).toLocaleDateString('pt-PT')} às ${meetingTime}`)

      // Limpar formulário
      setMeetingDate('')
      setMeetingTime('10:00')
      setMeetingOrgan('nucleo')
      setSelectedProtocols([])
      setMeetingNotes('')
      setShowNewMeeting(false)

      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'scheduled': return { label: 'Agendada', className: 'status-pending', icon: 'event' }
      case 'in_progress': return { label: 'Em Andamento', className: 'status-reviewing', icon: 'play_circle' }
      case 'completed': return { label: 'Concluída', className: 'status-approved', icon: 'check_circle' }
      default: return { label: status, className: 'status-default', icon: 'circle' }
    }
  }

  if (loading) return <Loader />

  const filteredProtocols = getFilteredProtocols()

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)', padding: 'var(--space-4)' }}>

      {/* ═══════════ CABEÇALHO ═══════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)', color: 'var(--primary)', fontSize: '28px' }}>calendar_add_on</span>
            Marcar Reunião
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Agende reuniões para revisão de protocolos com os órgãos científicos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewMeeting(!showNewMeeting)}>
          <span className="material-symbols-outlined">{showNewMeeting ? 'close' : 'add'}</span>
          {showNewMeeting ? 'Cancelar' : 'Nova Reunião'}
        </button>
      </div>

      {/* Mensagens */}
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* ═══════════ FORMULÁRIO: NOVA REUNIÃO ═══════════ */}
      {showNewMeeting && (
        <form onSubmit={handleCreateMeeting} className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>event</span>
            Detalhes da Reunião
          </h3>

          {/* Data, Hora, Órgão */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Data *</label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Hora</label>
              <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Órgão *</label>
              <select value={meetingOrgan} onChange={e => { setMeetingOrgan(e.target.value); setSelectedProtocols([]) }}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}>
                {organs.map(organ => (
                  <option key={organ.value} value={organ.value}>{organ.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-1)' }}>Notas / Observações</label>
            <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={2} placeholder="Notas sobre a reunião..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface)', resize: 'vertical' }} />
          </div>

          {/* Protocolos para revisão */}
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)' }}>
                Protocolos para a reunião * ({selectedProtocols.length} selecionados)
              </label>
              <button type="button" onClick={selectAllProtocols} className="btn btn-sm btn-outline">
                {selectedProtocols.length === filteredProtocols.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)' }}>
              {filteredProtocols.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', display: 'block', marginBottom: 'var(--space-1)' }}>inbox</span>
                  Nenhum protocolo pendente para este órgão.
                </div>
              ) : (
                filteredProtocols.map(protocol => {
                  const isSelected = selectedProtocols.includes(protocol.id)
                  const hasDivergence = protocol.reviewerOne?.decision && protocol.reviewerTwo?.decision && protocol.reviewerOne.decision !== protocol.reviewerTwo.decision

                  return (
                    <label key={protocol.id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '12px 14px',
                      borderBottom: '1px solid var(--outline-variant)', cursor: 'pointer',
                      background: isSelected ? 'var(--primary-container)' : 'transparent',
                      transition: 'background 0.15s',
                    }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleProtocolSelection(protocol.id)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontWeight: 'var(--font-bold)', fontSize: '13px', minWidth: '85px', flexShrink: 0, fontFamily: 'monospace' }}>{protocol.code}</span>
                      <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{protocol.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>{protocol.studentName}</span>
                      {hasDivergence && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', fontWeight: 'var(--font-bold)', flexShrink: 0 }}>Divergência</span>
                      )}
                      <span style={{ fontSize: '11px', color: protocol.daysSinceSubmission > 7 ? 'var(--error)' : 'var(--on-surface-variant)', flexShrink: 0, fontWeight: protocol.daysSinceSubmission > 7 ? 'var(--font-bold)' : 'var(--font-regular)' }}>
                        {protocol.daysSinceSubmission}d
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting || !meetingDate || selectedProtocols.length === 0}>
            {submitting ? (
              <><span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px' }} /> A agendar...</>
            ) : (
              <><span className="material-symbols-outlined">event_available</span> Agendar Reunião</>
            )}
          </button>
        </form>
      )}

      {/* ═══════════ LISTA DE REUNIÕES ═══════════ */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="material-symbols-outlined">list_alt</span>
        Reuniões ({meetings.length})
      </h2>

      {meetings.length === 0 ? (
        <EmptyState message="Nenhuma reunião agendada." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {meetings.map(meeting => {
            const isExpanded = expandedId === meeting.id
            const statusBadge = getStatusBadge(meeting.status)

            return (
              <div key={meeting.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                {/* Header */}
                <div onClick={() => toggleExpand(meeting.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px', flexShrink: 0 }}>calendar_today</span>
                      <div>
                        <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                          {new Date(meeting.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
                          {meeting.time} • {meeting.organLabel}
                        </span>
                      </div>
                    </div>
                    {meeting.notes && (
                      <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 'var(--space-1) 0 0', fontStyle: 'italic' }}>
                        "{meeting.notes}"
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <span className={`status-badge ${statusBadge.className}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }}>{statusBadge.icon}</span>
                      {statusBadge.label}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)' }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Protocolos da reunião */}
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}>description</span>
                  <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                    {meeting.protocolIds.length} protocolo(s) para revisão
                  </span>
                </div>

                {/* Expandido */}
                {isExpanded && (
                  <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--outline-variant)' }}>
                    {/* Decisões (se concluída) */}
                    {meeting.status === 'completed' && meeting.decisions && (
                      <div style={{ padding: 'var(--space-3)', background: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary)', color: 'var(--on-primary-container)', marginBottom: 'var(--space-3)' }}>
                        <p style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Decisão da Reunião</p>
                        <p style={{ fontSize: 'var(--body-md)', margin: 0, fontStyle: 'italic' }}>"{meeting.decisions}"</p>
                      </div>
                    )}

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      {meeting.status === 'scheduled' && (
                        <>
                          <button className="btn btn-outline btn-sm">
                            <span className="material-symbols-outlined">edit</span> Editar
                          </button>
                          <button className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
                            <span className="material-symbols-outlined">cancel</span> Cancelar
                          </button>
                        </>
                      )}
                      {meeting.status === 'completed' && (
                        <button className="btn btn-outline btn-sm">
                          <span className="material-symbols-outlined">visibility</span> Ver Ata
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', fontSize: 'var(--body-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span className="material-symbols-outlined">{type === 'error' ? 'error' : 'check_circle'}</span>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>event_busy</span>
      <p>{message}</p>
    </div>
  )
}