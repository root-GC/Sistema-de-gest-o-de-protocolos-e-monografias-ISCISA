// src/pages/SupervisionPage.tsx
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { monographService, type Monograph } from '../../services/monographService'
import { supervisorService, type Supervisee } from '../../services/supervisorService'
import { TopicJustificationToggle } from '../../components/TopicJustification'
import '../../styles/global.css'

// ============================================================
// TABS
// ============================================================
type Tab = 'supervisees' | 'topics' | 'protocols' | 'monographs'

interface TabConfig {
  id: Tab
  label: string
  icon: string
  count: number
  pendingCount: number
}

// ============================================================
// HELPERS
// ============================================================
function getProtocolStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente' },
    protocol_approved_supervisor:{ bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    protocol_rejected_supervisor:{ bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
    protocol_pending_nucleo:     { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    protocol_in_review_nucleo:   { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_approved_nucleo:    { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado (Núcleo)' },
    protocol_rejected_nucleo:    { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Núcleo)' },
    protocol_rejected_cc:        { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (CC)' },
    protocol_rejected_bioetica:  { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Bioética)' },
    protocol_resubmitted:        { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getMonographStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    monograph_submitted:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Submetida' },
    monograph_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente' },
    monograph_approved_supervisor:{ bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovada' },
    monograph_rejected_supervisor:{ bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitada' },
    monograph_in_review:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    monograph_approved_nucleo:    { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovada' },
    monograph_rejected_nucleo:    { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitada (Núcleo)' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getPhaseStyle(phase: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Tema' },
    protocol: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Protocolo' },
    monograph: { bg: 'var(--secondary-container)', color: 'var(--on-secondary-container)', dot: 'var(--secondary)', label: 'Monografia' },
    none: { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: 'Sem submissão' },
  }
  return map[phase] || map.none
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

// ============================================================
// COMPONENTE
// ============================================================
export default function SupervisionPage() {
  const location = useLocation()
  const [tab, setTab] = useState<Tab>(() => {
    if (location.pathname === '/supervision/list') return 'supervisees'
    if (location.pathname === '/supervision/pending') return 'topics'
    return 'supervisees'
  })

  const [supervisees, setSupervisees] = useState<Supervisee[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [monographs, setMonographs] = useState<Monograph[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (location.pathname === '/supervision/list') setTab('supervisees')
    if (location.pathname === '/supervision/pending') setTab('topics')
  }, [location.pathname])

  useEffect(() => {
    switch (tab) {
      case 'supervisees': loadSupervisees(); break
      case 'topics': loadTopics(); break
      case 'protocols': loadProtocols(); break
      case 'monographs': loadMonographs(); break
    }
  }, [tab])

  async function loadSupervisees() {
    setLoading(true)
    setError(null)
    try {
      const data = await supervisorService.listSupervisees()
      setSupervisees(data.supervisees || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadTopics() {
    setLoading(true)
    setError(null)
    try {
      const data = await topicService.getForSupervisor()
      setTopics(data.topics || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadProtocols() {
    setLoading(true)
    setError(null)
    try {
      const data = await protocolService.listForSupervisor()
      setProtocols(data.protocols || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMonographs() {
    setLoading(true)
    setError(null)
    try {
      const data = await monographService.list()
      setMonographs(data.monographs || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function approveTopic(id: number) {
    setActingId(id)
    try {
      await topicService.approveBySupervisor(id)
      await loadTopics()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function rejectTopic(id: number) {
    const justification = window.prompt('Justificação da rejeição:')
    if (justification === null) return
    setActingId(id)
    try {
      await topicService.rejectBySupervisor(id, justification)
      await loadTopics()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function approveProtocol(id: number) {
    setActingId(id)
    try {
      await protocolService.approveBySupervisor(id)
      await loadProtocols()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function rejectProtocol(id: number) {
    const justification = window.prompt('Justificação da rejeição (opcional):')
    if (justification === null) return
    setActingId(id)
    try {
      await protocolService.rejectBySupervisor(id, justification || undefined)
      await loadProtocols()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function approveMonograph(id: number) {
    setActingId(id)
    try {
      // await monographService.approveBySupervisor(id)
      await loadMonographs()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function rejectMonograph(id: number) {
    const justification = window.prompt('Justificação da rejeição (opcional):')
    if (justification === null) return
    setActingId(id)
    try {
      // await monographService.rejectBySupervisor(id, justification || undefined)
      await loadMonographs()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  // ============================================================
  // DADOS FILTRADOS
  // ============================================================
  const pendingTopics = topics.filter(t => t.status === 'topic_pending_supervisor')
  const processedTopics = topics.filter(t => t.status !== 'topic_pending_supervisor')

  const pendingProtocols = protocols.filter(p => 
    p.status === 'protocol_pending_supervisor' || p.status === 'protocol_submitted'
  )
  const processedProtocols = protocols.filter(p => 
    p.status !== 'protocol_pending_supervisor' && p.status !== 'protocol_submitted'
  )

  const pendingMonographs = monographs.filter(m => 
    m.status === 'monograph_pending_supervisor' || m.status === 'monograph_submitted'
  )
  const processedMonographs = monographs.filter(m => 
    m.status !== 'monograph_pending_supervisor' && m.status !== 'monograph_submitted'
  )

  // ============================================================
  // CONFIGURAÇÃO DAS TABS
  // ============================================================
  const tabs: TabConfig[] = [
    { id: 'supervisees', label: 'Supervisandos', icon: 'groups', count: supervisees.length, pendingCount: 0 },
    { id: 'topics', label: 'Temas', icon: 'lightbulb', count: topics.length, pendingCount: pendingTopics.length },
    { id: 'protocols', label: 'Protocolos', icon: 'description', count: protocols.length, pendingCount: pendingProtocols.length },
    { id: 'monographs', label: 'Monografias', icon: 'book', count: monographs.length, pendingCount: pendingMonographs.length },
  ]

  const activeTab = tabs.find(t => t.id === tab)!

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)',
        fontSize: 'var(--body-lg)',
        gap: 'var(--space-2)'
      }}>
        <span style={{
          width: '24px', height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite'
        }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)'
    }}>

      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Os meus supervisionandos
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {tab === 'supervisees' && `${supervisees.length} estudante${supervisees.length !== 1 ? 's' : ''} sob supervisão`}
            {tab === 'topics' && `${pendingTopics.length} tema${pendingTopics.length !== 1 ? 's' : ''} pendente${pendingTopics.length !== 1 ? 's' : ''} de validação`}
            {tab === 'protocols' && `${pendingProtocols.length} protocolo${pendingProtocols.length !== 1 ? 's' : ''} pendente${pendingProtocols.length !== 1 ? 's' : ''} de validação`}
            {tab === 'monographs' && `${pendingMonographs.length} monografia${pendingMonographs.length !== 1 ? 's' : ''} pendente${pendingMonographs.length !== 1 ? 's' : ''} de validação`}
          </p>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: 'var(--surface-container)',
          color: 'var(--on-surface-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{activeTab.icon}</span>
          {activeTab.count} {activeTab.label.toLowerCase()}
        </span>
      </div>

      {/* Erro */}
      {error && (
        <div role="alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--error-container)',
          color: 'var(--on-error-container)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-1)',
        borderBottom: '2px solid var(--outline-variant)',
        marginBottom: 'var(--space-4)'
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '12px var(--space-3)',
              fontSize: 'var(--body-md)',
              fontWeight: tab === t.id ? 'var(--font-bold)' : 'var(--font-medium)',
              fontFamily: 'var(--font-family)',
              border: 'none',
              borderBottom: tab === t.id ? '3px solid var(--primary)' : '3px solid transparent',
              borderRadius: 0,
              cursor: 'pointer',
              background: 'transparent',
              color: tab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              whiteSpace: 'nowrap',
              marginBottom: '-2px',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{t.icon}</span>
            <span style={{ display: 'inline' }}>{t.label}</span>
            {t.pendingCount > 0 && (
              <span style={{
                background: 'var(--tertiary)',
                color: 'var(--on-tertiary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--label-sm)',
                fontWeight: 'var(--font-bold)',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {t.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== SUPERVISANDOS ==================== */}
      {tab === 'supervisees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {supervisees.length === 0 ? (
            <EmptyState icon="groups" message="Nenhum supervisando atribuído." />
          ) : (
            supervisees.map((s, i) => {
              const phaseStyle = getPhaseStyle(s.phase)
              return (
                <div key={s.student.id ?? i} className="card" style={{
                  padding: 'var(--space-4)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr',
                  gap: 'var(--space-4)',
                  alignItems: 'start'
                }}>
                  {/* Info do Estudante */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'var(--primary-container)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>person</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{s.student.name || 'Estudante'}</h3>
                        {s.student.email && <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{s.student.email}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {s.student.student_number && <Badge>{s.student.student_number}</Badge>}
                      {s.student.course && <Badge>{s.student.course.name}</Badge>}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      <StatusBadge bg={phaseStyle.bg} color={phaseStyle.color} dot={phaseStyle.dot} label={s.phase_label || phaseStyle.label} />
                      {formatDate(s.current_submission?.submitted_at) && (
                        <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                          {formatDate(s.current_submission?.submitted_at)}
                        </span>
                      )}
                    </div>
                    {s.phase === 'none' ? (
                      <p style={{ color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>Sem submissões.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <p style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--body-md)' }}>
                          {s.current_topic?.title || s.current_submission?.title || 'Sem título'}
                        </p>
                        <TopicJustificationToggle justification={s.current_topic?.justification} showEmpty compact />
                        <Link to={`/supervisor/protocols/${s.current_protocol?.id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', background: 'var(--surface-container)',
                          borderRadius: 'var(--radius-lg)', textDecoration: 'none',
                          fontSize: 'var(--body-md)', color: 'var(--on-surface)',
                          border: '1px solid var(--outline-variant)', width: 'fit-content'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                          Ver detalhes
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ==================== TEMAS ==================== */}
      {tab === 'topics' && (
        <ApprovalSection
          title="Pendentes de validação"
          icon="pending_actions"
          color="var(--tertiary)"
          items={pendingTopics}
          emptyMessage="Sem temas pendentes de validação."
          renderItem={(topic) => (
            <ApprovalCard
              key={topic.id}
              title={topic.title}
              subtitle={topic.student?.name}
              justification={topic.justification}
              onApprove={() => approveTopic(topic.id)}
              onReject={() => rejectTopic(topic.id)}
              loading={actingId === topic.id}
            />
          )}
        />
      )}

      {tab === 'topics' && processedTopics.length > 0 && (
        <ProcessedSection
          title="Já processados"
          items={processedTopics}
          renderItem={(topic) => (
            <ProcessedCard
              key={topic.id}
              title={topic.title}
              subtitle={topic.student?.name}
              justification={topic.justification}
              statusLabel={topic.status_label}
              isApproved={['topic_pending_nucleo', 'topic_approved_nucleo'].includes(topic.status)}
            />
          )}
        />
      )}

      {/* ==================== PROTOCOLOS ==================== */}
      {tab === 'protocols' && (
        <ApprovalSection
          title="Pendentes de validação"
          icon="pending_actions"
          color="var(--tertiary)"
          items={pendingProtocols}
          emptyMessage="Sem protocolos pendentes de validação."
          renderItem={(protocol) => {
            const s = getProtocolStatusStyle(protocol.status)
            return (
              <ApprovalCard
                key={protocol.id}
                title={protocol.code}
                subtitle={protocol.student?.name}
                topicTitle={protocol.topic?.title}
                justification={protocol.topic?.justification}
                statusBadge={<StatusBadge bg={s.bg} color={s.color} dot={s.dot} label={s.label} />}
                onApprove={() => approveProtocol(protocol.id)}
                onReject={() => rejectProtocol(protocol.id)}
                loading={actingId === protocol.id}
                linkTo={`/supervisor/protocols/${protocol.id}`}
              />
            )
          }}
        />
      )}

      {tab === 'protocols' && processedProtocols.length > 0 && (
        <ProcessedSection
          title="Já processados"
          items={processedProtocols}
          renderItem={(protocol) => {
            const s = getProtocolStatusStyle(protocol.status)
            return (
              <ProcessedCard
                key={protocol.id}
                title={protocol.code}
                subtitle={protocol.topic?.title}
                justification={protocol.topic?.justification}
                statusBadge={<StatusBadge bg={s.bg} color={s.color} dot={s.dot} label={s.label} />}
                linkTo={`/supervisor/protocols/${protocol.id}`}
              />
            )
          }}
        />
      )}

      {/* ==================== MONOGRAFIAS ==================== */}
      {tab === 'monographs' && (
        <ApprovalSection
          title="Pendentes de validação"
          icon="pending_actions"
          color="var(--tertiary)"
          items={pendingMonographs}
          emptyMessage="Sem monografias pendentes de validação."
          renderItem={(monograph) => {
            const s = getMonographStatusStyle(monograph.status)
            return (
              <ApprovalCard
                key={monograph.id}
                title={monograph.code}
                subtitle={monograph.title || 'Sem título'}
                statusBadge={<StatusBadge bg={s.bg} color={s.color} dot={s.dot} label={s.label} />}
                onApprove={() => approveMonograph(monograph.id)}
                onReject={() => rejectMonograph(monograph.id)}
                loading={actingId === monograph.id}
              />
            )
          }}
        />
      )}

      {tab === 'monographs' && processedMonographs.length > 0 && (
        <ProcessedSection
          title="Já processadas"
          items={processedMonographs}
          renderItem={(monograph) => {
            const s = getMonographStatusStyle(monograph.status)
            return (
              <ProcessedCard
                key={monograph.id}
                title={monograph.code}
                subtitle={monograph.title || 'Sem título'}
                statusBadge={<StatusBadge bg={s.bg} color={s.color} dot={s.dot} label={s.label} />}
              />
            )
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 'var(--label-sm)',
      color: 'var(--on-surface-variant)',
      background: 'var(--surface-container)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)'
    }}>
      {children}
    </span>
  )
}

function StatusBadge({ bg, color, dot, label }: { bg: string; color: string; dot: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--label-md)',
      fontWeight: 'var(--font-medium)',
      background: bg,
      color: color,
      whiteSpace: 'nowrap'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: dot }} />
      {label}
    </span>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--space-5) var(--space-3)',
      color: 'var(--on-surface-variant)',
      background: 'var(--surface-container-low)',
      borderRadius: 'var(--radius-xl)',
      border: '1px dashed var(--outline-variant)'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '40px', marginBottom: 'var(--space-2)', display: 'block' }}>
        {icon}
      </span>
      <p style={{ fontSize: 'var(--body-md)' }}>{message}</p>
    </div>
  )
}

function ApprovalSection<T>({ title, icon, color, items, emptyMessage, renderItem }: {
  title: string
  icon: string
  color: string
  items: T[]
  emptyMessage: string
  renderItem: (item: T) => React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
      <h2 style={{
        fontSize: 'var(--title-md)',
        fontWeight: 'var(--font-semibold)',
        color: color,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
        {title}
        <span style={{
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--on-surface-variant)',
          marginLeft: 'var(--space-1)'
        }}>
          ({items.length})
        </span>
      </h2>
      {items.length === 0 ? (
        <EmptyState icon="task_alt" message={emptyMessage} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {items.map(renderItem)}
        </div>
      )}
    </div>
  )
}

function ProcessedSection<T>({ title, items, renderItem }: {
  title: string
  items: T[]
  renderItem: (item: T) => React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h2 style={{
        fontSize: 'var(--title-md)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--on-surface-variant)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>checklist</span>
        {title}
        <span style={{
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--on-surface-variant)',
          marginLeft: 'var(--space-1)'
        }}>
          ({items.length})
        </span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.map(renderItem)}
      </div>
    </div>
  )
}

function ApprovalCard({
  title, subtitle, topicTitle, justification, statusBadge,
  onApprove, onReject, loading, linkTo
}: {
  title: string
  subtitle?: string
  topicTitle?: string
  justification?: string | null
  statusBadge?: React.ReactNode
  onApprove: () => void
  onReject: () => void
  loading: boolean
  linkTo?: string
}) {
  return (
    <div className="card" style={{
      padding: 'var(--space-4)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 'var(--space-4)'
    }}>
      <div style={{ flex: 1, minWidth: '250px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{title}</h3>
          {statusBadge}
        </div>
        {subtitle && (
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
            {subtitle}
          </p>
        )}
        {topicTitle && (
          <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', margin: '4px 0' }}>Tema: {topicTitle}</p>
        )}
        {justification && <TopicJustificationToggle justification={justification} showEmpty compact style={{ marginTop: 'var(--space-2)' }} />}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexShrink: 0 }}>
        {linkTo && (
          <Link to={linkTo} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', borderRadius: 'var(--radius-lg)',
            textDecoration: 'none', fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)',
            background: 'var(--surface-container)', color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
            Abrir
          </Link>
        )}
        <button onClick={onApprove} disabled={loading} className="btn btn-primary" style={{
          padding: '10px 16px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)',
          borderRadius: 'var(--radius-lg)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          {loading ? <span style={{ width: '14px', height: '14px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>}
          Aprovar
        </button>
        <button onClick={onReject} disabled={loading} style={{
          padding: '10px 16px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)',
          borderRadius: 'var(--radius-lg)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--error)', color: 'var(--on-error)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
          Rejeitar
        </button>
      </div>
    </div>
  )
}

function ProcessedCard({
  title, subtitle, justification, statusLabel, isApproved, statusBadge, linkTo
}: {
  title: string
  subtitle?: string
  justification?: string | null
  statusLabel?: string
  isApproved?: boolean
  statusBadge?: React.ReactNode
  linkTo?: string
}) {
  return (
    <div className="card" style={{
      padding: 'var(--space-3) var(--space-4)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 'var(--space-2)',
      opacity: 0.75
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{title}</h3>
          {statusBadge || (statusLabel && (
            <StatusBadge
              bg={isApproved ? 'var(--primary-container)' : 'var(--error-container)'}
              color={isApproved ? 'var(--on-primary-container)' : 'var(--on-error-container)'}
              dot={isApproved ? 'var(--primary)' : 'var(--error)'}
              label={statusLabel}
            />
          ))}
        </div>
        {subtitle && <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>{subtitle}</p>}
        {justification && <TopicJustificationToggle justification={justification} showEmpty compact style={{ marginTop: 'var(--space-1)' }} />}
      </div>
      {linkTo && (
        <Link to={linkTo} style={{
          padding: '6px 12px', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)',
          borderRadius: 'var(--radius-lg)', textDecoration: 'none', flexShrink: 0,
          background: 'var(--surface-container)', color: 'var(--on-surface)',
          border: '1px solid var(--outline-variant)'
        }}>
          Ver
        </Link>
      )}
    </div>
  )
}