// src/pages/SupervisionPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supervisorService, type Supervisee } from '../../services/supervisorService'
import '../../styles/global.css'

// ============================================================
// TIPOS
// ============================================================
type Phase = 'topic' | 'protocol' | 'monograph' | 'none'

// ============================================================
// HELPERS
// ============================================================
function getPhaseConfig(phase: Phase, status?: string) {
  // Se tem status específico do tópico, usa ele
  if (phase === 'topic' && status) {
    const topicStatusMap: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
      topic_pending_supervisor: {
        label: 'Aguardando Supervisor',
        icon: 'hourglass_top',
        color: 'var(--tertiary)',
        bg: 'var(--tertiary-container)',
        textColor: 'var(--on-tertiary-container)',
      },
      topic_pending_nucleo: {
        label: 'Aguardando Núcleo',
        icon: 'hourglass_top',
        color: 'var(--tertiary)',
        bg: 'var(--tertiary-container)',
        textColor: 'var(--on-tertiary-container)',
      },
      topic_assigned_for_review: {
        label: 'Atribuído para Revisão',
        icon: 'assignment_ind',
        color: 'var(--tertiary)',
        bg: 'var(--tertiary-container)',
        textColor: 'var(--on-tertiary-container)',
      },
      topic_in_review: {
        label: 'Em Revisão',
        icon: 'rate_review',
        color: 'var(--tertiary)',
        bg: 'var(--tertiary-container)',
        textColor: 'var(--on-tertiary-container)',
      },
      topic_approved_nucleo: {
        label: 'Aprovado pelo Núcleo',
        icon: 'verified',
        color: 'var(--primary)',
        bg: 'var(--primary-container)',
        textColor: 'var(--on-primary-container)',
      },
      topic_rejected_supervisor: {
        label: 'Rejeitado pelo Supervisor',
        icon: 'cancel',
        color: 'var(--error)',
        bg: 'var(--error-container)',
        textColor: 'var(--on-error-container)',
      },
      topic_rejected_nucleo: {
        label: 'Rejeitado pelo Núcleo',
        icon: 'cancel',
        color: 'var(--error)',
        bg: 'var(--error-container)',
        textColor: 'var(--on-error-container)',
      },
    }
    
    const found = topicStatusMap[status]
    if (found) return found
  }

  // Config padrão por fase
  const configs: Record<Phase, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
    topic: {
      label: 'Tema em andamento',
      icon: 'lightbulb',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-container)',
      textColor: 'var(--on-tertiary-container)',
    },
    protocol: {
      label: 'Protocolo em andamento',
      icon: 'description',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
    monograph: {
      label: 'Monografia em andamento',
      icon: 'book',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
    },
    none: {
      label: 'Sem submissões',
      icon: 'check_circle',
      color: 'var(--outline)',
      bg: 'var(--surface-container)',
      textColor: 'var(--on-surface-variant)',
    },
  }
  return configs[phase] || configs.none
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function SupervisionPage() {
  const navigate = useNavigate()
  const [supervisees, setSupervisees] = useState<Supervisee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPhase, setFilterPhase] = useState<Phase | 'all'>('all')

  useEffect(() => {
    loadSupervisees()
  }, [])

  async function loadSupervisees() {
    setLoading(true)
    setError(null)
    try {
      const data = await supervisorService.listSupervisees()
      console.log('📊 Supervisionandos:', data)
      setSupervisees(data.supervisees || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Filtros
  const filteredSupervisees = supervisees.filter(s => {
    const matchesSearch = searchTerm === '' || 
      s.student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.student_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPhase = filterPhase === 'all' || s.phase === filterPhase

    return matchesSearch && matchesPhase
  })

  // 🆕 Determina se o status é "pendente" (precisa de ação do supervisor)
  function isPendingAction(phase: Phase, status?: string): boolean {
    if (phase === 'none') return false
    if (phase === 'topic') {
      return status === 'topic_pending_supervisor'
    }
    if (phase === 'protocol') {
      return status === 'protocol_pending_supervisor' || status === 'protocol_submitted'
    }
    if (phase === 'monograph') {
      return status === 'monograph_pending_supervisor' || status === 'monograph_submitted'
    }
    return false
  }

  // 🆕 Determina se é bloqueante (não permite nova submissão)
  function isBlocking(phase: Phase, status?: string): boolean {
    if (phase === 'none') return false
    if (phase === 'topic') {
      return status !== 'topic_rejected_supervisor' && status !== 'topic_rejected_nucleo' && status !== 'topic_rejected'
    }
    return false
  }

  // 🆕 Verifica se pode submeter novo (tema rejeitado)
  function canResubmit(phase: Phase, status?: string): boolean {
    if (phase === 'none') return true
    if (phase === 'topic') {
      return status === 'topic_rejected_supervisor' || status === 'topic_rejected_nucleo' || status === 'topic_rejected'
    }
    return false
  }

  // Estatísticas
  const stats = {
    total: supervisees.length,
    pendingTopic: supervisees.filter(s => s.phase === 'topic').length,
    pendingProtocol: supervisees.filter(s => s.phase === 'protocol').length,
    pendingMonograph: supervisees.filter(s => (s.phase as Phase) === 'monograph').length,
    completed: supervisees.filter(s => s.phase === 'none').length,
    // 🆕 Apenas os que precisam de ação do supervisor
    needAction: supervisees.filter(s => isPendingAction(s.phase as Phase, s.current_topic?.status || s.current_protocol?.status)).length,
  }

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)'
      }}>
        <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            Os meus supervisionandos
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {stats.total} estudante{stats.total !== 1 ? 's' : ''} sob supervisão
            {stats.needAction > 0 && ` • ${stats.needAction} precisam de ação`}
            {stats.pendingTopic > 0 && ` • ${stats.pendingTopic} tema${stats.pendingTopic !== 1 ? 's' : ''}`}
            {stats.pendingProtocol > 0 && ` • ${stats.pendingProtocol} protocolo${stats.pendingProtocol !== 1 ? 's' : ''}`}
            {stats.pendingMonograph > 0 && ` • ${stats.pendingMonograph} monografia${stats.pendingMonograph !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatCard icon="hourglass_top" label="Precisam de Ação" count={stats.needAction} color="var(--tertiary)" bg="var(--tertiary-container)" onClick={() => setFilterPhase('topic')} />
        <StatCard icon="lightbulb" label="Temas" count={stats.pendingTopic} color="var(--tertiary)" bg="var(--tertiary-container)" onClick={() => setFilterPhase('topic')} />
        <StatCard icon="description" label="Protocolos" count={stats.pendingProtocol} color="var(--primary)" bg="var(--primary-container)" onClick={() => setFilterPhase('protocol')} />
        <StatCard icon="book" label="Monografias" count={stats.pendingMonograph} color="var(--secondary)" bg="var(--secondary-container)" onClick={() => setFilterPhase('monograph')} />
      </div>

      {/* Erro */}
      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>{error}
        </div>
      )}

      {/* Barra de Pesquisa e Filtros */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por nome, email ou número..." style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filterPhase} onChange={e => setFilterPhase(e.target.value as Phase | 'all')} style={{ padding: '12px 16px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer' }}>
          <option value="all">Todas as fases</option>
          <option value="topic">Temas</option>
          <option value="protocol">Protocolos</option>
          <option value="monograph">Monografias</option>
          <option value="none">Concluídos</option>
        </select>
        {(searchTerm || filterPhase !== 'all') && (
          <button onClick={() => { setSearchTerm(''); setFilterPhase('all') }} style={{ padding: '12px 16px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_alt_off</span>Limpar
          </button>
        )}
      </div>

      {/* Lista de Supervisionandos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filteredSupervisees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>{searchTerm || filterPhase !== 'all' ? 'search_off' : 'groups'}</span>
            <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>{searchTerm || filterPhase !== 'all' ? 'Nenhum resultado encontrado' : 'Nenhum supervisando atribuído'}</p>
          </div>
        ) : (
          filteredSupervisees.map((s, i) => {
            const topicStatus = s.current_topic?.status
            const protocolStatus = s.current_protocol?.status
            const phaseStatus = topicStatus || protocolStatus
            const phaseConfig = getPhaseConfig(s.phase as Phase, phaseStatus)
            const hasPending = isPendingAction(s.phase as Phase, phaseStatus)
            const canClick = hasPending && s.current_submission?.id

            return (
              <div key={s.student.id ?? i} className="card" onClick={() => {
                if (canClick) navigate(`/supervision/review/${s.phase}/${s.current_submission!.id}`)
              }} style={{
                padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center',
                gap: 'var(--space-3)', cursor: canClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease', border: `1px solid ${hasPending ? phaseConfig.color : 'var(--outline-variant)'}`,
                flexWrap: 'wrap', background: hasPending ? `color-mix(in srgb, ${phaseConfig.bg} 30%, var(--surface))` : 'var(--surface)'
              }}
              onMouseEnter={e => { if (canClick) { e.currentTarget.style.borderColor = phaseConfig.color; e.currentTarget.style.boxShadow = 'var(--elevation-2)' } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = hasPending ? phaseConfig.color : 'var(--outline-variant)'; e.currentTarget.style.boxShadow = 'var(--elevation-1)' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>person</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{s.student.name || 'Estudante'}</h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px', flexWrap: 'wrap', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    {s.student.student_number && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>badge</span>{s.student.student_number}</span>}
                    {s.student.course && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>school</span>{s.student.course.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  {/* 🆕 Badge com status real */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: phaseConfig.bg, color: phaseConfig.textColor, whiteSpace: 'nowrap', border: `1px solid ${phaseConfig.color}` }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: phaseConfig.color }} />
                    {phaseConfig.label}
                  </span>
                  {s.current_submission?.title && (
                    <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.current_submission.title}
                    </span>
                  )}
                  <span className="material-symbols-outlined" style={{ color: canClick ? phaseConfig.color : 'var(--outline)', fontSize: '24px' }}>
                    {canClick ? 'arrow_forward_ios' : s.phase === 'none' ? 'check_circle' : 'hourglass_top'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function StatCard({ icon, label, count, color, bg, onClick }: { icon: string; label: string; count: number; color: string; bg: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: 'var(--space-3)', background: bg, borderRadius: 'var(--radius-lg)', border: `1px solid ${color}`, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--elevation-2)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--elevation-1)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color }}>{icon}</span>
      <div>
        <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0, lineHeight: 1 }}>{count}</p>
        <p style={{ fontSize: 'var(--label-sm)', color, margin: '4px 0 0', opacity: 0.8 }}>{label}</p>
      </div>
    </div>
  )
}