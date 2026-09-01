// src/pages/teacher/ValidationPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supervisorService, type Supervisee } from '../../services/supervisorService'
import '../../styles/global.css'

// ============================================================
// TIPOS
// ============================================================
type TabType = 'topics' | 'protocols' | 'monographs'

interface TabConfig {
  id: TabType
  label: string
  icon: string
  color: string
  bg: string
  textColor: string
}

interface PendingItem {
  id: number
  type: 'topic' | 'protocol' | 'monograph'
  title: string
  code?: string
  studentName: string
  studentEmail?: string | null
  studentNumber?: string | null
  courseName?: string
  status: string
  statusLabel: string
  justification?: string | null
  submittedAt?: string | null
}

// ============================================================
// HELPERS - Status reais dos tópicos
// ============================================================
function getTopicStatusConfig(status: string) {
  const map: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
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
      label: 'Não Aprovado pelo Supervisor',
      icon: 'cancel',
      color: 'var(--error)',
      bg: 'var(--error-container)',
      textColor: 'var(--on-error-container)',
    },
    topic_rejected_nucleo: {
      label: 'Não Aprovado pelo Núcleo',
      icon: 'cancel',
      color: 'var(--error)',
      bg: 'var(--error-container)',
      textColor: 'var(--on-error-container)',
    },
  }
  return map[status] || {
    label: status.replace(/_/g, ' ').replace(/topic_/g, ''),
    icon: 'help',
    color: 'var(--outline)',
    bg: 'var(--surface-container)',
    textColor: 'var(--on-surface-variant)',
  }
}

function getProtocolStatusConfig(status: string) {
  const map: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
    protocol_pending_supervisor: {
      label: 'Aguardando Supervisor',
      icon: 'hourglass_top',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
    protocol_submitted: {
      label: 'Submetido',
      icon: 'send',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
    protocol_rejected_supervisor: {
      label: 'Não Aprovado pelo Supervisor',
      icon: 'cancel',
      color: 'var(--error)',
      bg: 'var(--error-container)',
      textColor: 'var(--on-error-container)',
    },
    protocol_pending_nucleo: {
      label: 'Aguardando Núcleo',
      icon: 'hourglass_top',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
    protocol_in_review_nucleo: {
      label: 'Em Revisão pelo Núcleo',
      icon: 'rate_review',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
    protocol_approved_nucleo: {
      label: 'Aprovado pelo Núcleo',
      icon: 'verified',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
  }
  return map[status] || {
    label: status.replace(/_/g, ' ').replace(/protocol_/g, ''),
    icon: 'help',
    color: 'var(--outline)',
    bg: 'var(--surface-container)',
    textColor: 'var(--on-surface-variant)',
  }
}

function getMonographStatusConfig(status: string) {
  const map: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
    monograph_pending_supervisor: {
      label: 'Aguardando Supervisor',
      icon: 'hourglass_top',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
    },
    monograph_submitted: {
      label: 'Submetida',
      icon: 'send',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
    },
    monograph_rejected_supervisor: {
      label: 'Não Aprovada pelo Supervisor',
      icon: 'cancel',
      color: 'var(--error)',
      bg: 'var(--error-container)',
      textColor: 'var(--on-error-container)',
    },
    monograph_in_review: {
      label: 'Em Revisão',
      icon: 'rate_review',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
    },
    monograph_approved_nucleo: {
      label: 'Aprovada',
      icon: 'verified',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
    },
  }
  return map[status] || {
    label: status.replace(/_/g, ' ').replace(/monograph_/g, ''),
    icon: 'help',
    color: 'var(--outline)',
    bg: 'var(--surface-container)',
    textColor: 'var(--on-surface-variant)',
  }
}

function getStatusConfig(type: string, status: string) {
  if (type === 'topic') return getTopicStatusConfig(status)
  if (type === 'protocol') return getProtocolStatusConfig(status)
  if (type === 'monograph') return getMonographStatusConfig(status)
  return getTopicStatusConfig(status)
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ValidationPage() {
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<TabType>('topics')
  const [supervisees, setSupervisees] = useState<Supervisee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const tabs: TabConfig[] = [
    { id: 'topics', label: 'Temas', icon: 'lightbulb', color: 'var(--tertiary)', bg: 'var(--tertiary-container)', textColor: 'var(--on-tertiary-container)' },
    { id: 'protocols', label: 'Protocolos', icon: 'description', color: 'var(--primary)', bg: 'var(--primary-container)', textColor: 'var(--on-primary-container)' },
    { id: 'monographs', label: 'Monografias', icon: 'book', color: 'var(--secondary)', bg: 'var(--secondary-container)', textColor: 'var(--on-secondary-container)' },
  ]

  const loadSupervisees = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError(null)
    try {
      const data = await supervisorService.listSupervisees()
      console.log('📊 Supervisionandos:', data)
      setSupervisees(data.supervisees || [])
    } catch (e) {
      console.error('❌ Erro:', e)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void loadSupervisees() }, 0)
    return () => window.clearTimeout(requestId)
  }, [loadSupervisees])

  // 🆕 Filtra apenas os que precisam de ação do supervisor
  function needsSupervisorAction(phase: string, status?: string): boolean {
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

  // Extrai itens pendentes dos supervisees
  function getPendingItems(): PendingItem[] {
    const items: PendingItem[] = []
    
    for (const s of supervisees) {
      const studentName = s.student.name || 'Estudante'
      const studentEmail = s.student.email
      const studentNumber = s.student.student_number
      const courseName = s.student.course?.name

      // Temas - apenas os que precisam de ação do supervisor
      if (activeTab === 'topics' && s.current_topic && s.phase === 'topic') {
        if (needsSupervisorAction('topic', s.current_topic.status)) {
          items.push({
            id: s.current_topic.id,
            type: 'topic',
            title: s.current_topic.title,
            studentName,
            studentEmail,
            studentNumber,
            courseName,
            status: s.current_topic.status,
            statusLabel: s.current_topic.status_label,
            justification: s.current_topic.justification,
            submittedAt: s.current_topic.submitted_at,
          })
        }
      }

      // Protocolos - apenas os que precisam de ação
      if (activeTab === 'protocols' && s.current_protocol && s.phase === 'protocol') {
        if (needsSupervisorAction('protocol', s.current_protocol.status)) {
          items.push({
            id: s.current_protocol.id,
            type: 'protocol',
            title: s.current_topic?.title || s.current_protocol.code || 'Sem título',
            code: s.current_protocol.code,
            studentName,
            studentEmail,
            studentNumber,
            courseName,
            status: s.current_protocol.status,
            statusLabel: s.current_protocol.status_label,
            submittedAt: s.current_protocol.submitted_at,
          })
        }
      }

      // Monografias
      if (activeTab === 'monographs' && s.current_submission && s.phase === 'monograph') {
        if (needsSupervisorAction('monograph', s.current_submission.status)) {
          items.push({
            id: s.current_submission.id,
            type: 'monograph',
            title: s.current_submission.title || s.current_submission.code || 'Sem título',
            code: s.current_submission.code,
            studentName,
            studentEmail,
            studentNumber,
            courseName,
            status: s.current_submission.status,
            statusLabel: s.current_submission.status_label,
            submittedAt: s.current_submission.submitted_at,
          })
        }
      }
    }

    return items
  }

  const pendingItems = getPendingItems()
  
  // Filtro por pesquisa
  const filteredItems = pendingItems.filter(item => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      item.title?.toLowerCase().includes(term) ||
      item.studentName?.toLowerCase().includes(term) ||
      item.studentEmail?.toLowerCase().includes(term) ||
      item.code?.toLowerCase().includes(term)
    )
  })

  // Estatísticas - apenas os que precisam de ação
  const stats = {
    pendingTopics: supervisees.filter(s => s.phase === 'topic' && needsSupervisorAction('topic', s.current_topic?.status)).length,
    pendingProtocols: supervisees.filter(s => s.phase === 'protocol' && needsSupervisorAction('protocol', s.current_protocol?.status)).length,
    pendingMonographs: supervisees.filter(s => s.phase === 'monograph' && needsSupervisorAction('monograph', s.current_submission?.status)).length,
    totalSupervisees: supervisees.length,
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
    <div className="teacher-workspace" style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>Validar Submissões</h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {stats.totalSupervisees} supervisionando{stats.totalSupervisees !== 1 ? 's' : ''}
            {stats.pendingTopics > 0 && ` • ${stats.pendingTopics} tema${stats.pendingTopics !== 1 ? 's' : ''} pendente${stats.pendingTopics !== 1 ? 's' : ''}`}
            {stats.pendingProtocols > 0 && ` • ${stats.pendingProtocols} protocolo${stats.pendingProtocols !== 1 ? 's' : ''} pendente${stats.pendingProtocols !== 1 ? 's' : ''}`}
            {stats.pendingMonographs > 0 && ` • ${stats.pendingMonographs} monografia${stats.pendingMonographs !== 1 ? 's' : ''} pendente${stats.pendingMonographs !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/supervision')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            color: 'var(--on-surface)',
            fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)',
            fontFamily: 'var(--font-family)',
            cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>groups</span>
          Ver supervisionandos
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-4)'
      }}>
        <PageSwitchButton icon="groups" label="Supervisionandos" subtitle={`${stats.totalSupervisees} estudantes`} onClick={() => navigate('/supervision')} />
        <PageSwitchButton active icon="task_alt" label="Pendentes" subtitle={`${stats.pendingTopics + stats.pendingProtocols + stats.pendingMonographs} por decidir`} onClick={() => navigate('/supervision/pending')} />
      </div>

      {/* Estatísticas Rápidas */}
      <div className="teacher-summary-grid">
        <StatCard icon="hourglass_top" label="Precisam de Ação" count={stats.pendingTopics + stats.pendingProtocols + stats.pendingMonographs} color="var(--tertiary)" bg="var(--tertiary-container)" onClick={() => setActiveTab('topics')} />
        <StatCard icon="lightbulb" label="Temas" count={stats.pendingTopics} color="var(--tertiary)" bg="var(--tertiary-container)" onClick={() => setActiveTab('topics')} />
        <StatCard icon="description" label="Protocolos" count={stats.pendingProtocols} color="var(--primary)" bg="var(--primary-container)" onClick={() => setActiveTab('protocols')} />
        <StatCard icon="book" label="Monografias" count={stats.pendingMonographs} color="var(--secondary)" bg="var(--secondary-container)" onClick={() => setActiveTab('monographs')} />
      </div>

      {/* Erro */}
      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>{error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-3)', overflowX: 'auto' }}>
        {tabs.map(tab => {
          const count = tab.id === 'topics' ? stats.pendingTopics : tab.id === 'protocols' ? stats.pendingProtocols : stats.pendingMonographs
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px var(--space-3)', fontSize: 'var(--body-md)',
              fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'var(--font-medium)',
              fontFamily: 'var(--font-family)', border: 'none',
              borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
              borderRadius: 0, cursor: 'pointer', background: 'transparent',
              color: activeTab === tab.id ? tab.color : 'var(--on-surface-variant)',
              transition: 'border-color 200ms ease, color 200ms ease, background-color 200ms ease', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              whiteSpace: 'nowrap', marginBottom: '-2px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
              {tab.label}
              {count > 0 && <span style={{ background: tab.color, color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-bold)', minWidth: '20px', textAlign: 'center' }}>{count}</span>}
            </button>
          )
        })}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        padding: '12px 16px',
        marginBottom: 'var(--space-4)',
        background: 'var(--surface-container-low)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} em {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()}
        </span>
        <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
          Abre qualquer item para decidir, descarregar documento ou registar correções.
        </span>
      </div>

      {/* Barra de Pesquisa */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ padding: '12px 16px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>task_alt</span>
            <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>Nenhum item pendente para validação</p>
            <p style={{ fontSize: 'var(--body-sm)', marginTop: 'var(--space-1)' }}>Todas as submissões foram processadas.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const statusConfig = getStatusConfig(item.type, item.status)
            return (
              <div key={`${item.type}-${item.id}-${index}`} className="card" onClick={() => navigate(`/supervision/review/${item.type}/${item.id}`)} style={{
                padding: 'var(--space-2) var(--space-3)', display: 'flex', alignItems: 'center',
                gap: 'var(--space-3)', cursor: 'pointer', transition: 'border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease',
                border: `1px solid ${statusConfig.color}`, flexWrap: 'wrap',
                background: `color-mix(in srgb, ${statusConfig.bg} 25%, var(--surface))`
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--elevation-2)'; e.currentTarget.style.borderColor = statusConfig.color }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--elevation-1)'; e.currentTarget.style.borderColor = statusConfig.color }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: statusConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: statusConfig.color, fontSize: '24px' }}>{statusConfig.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.code ? `${item.code} • ` : ''}{item.title}
                  </h3>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                    {item.studentName}
                    {item.courseName && ` • ${item.courseName}`}
                    {item.submittedAt && ` • ${formatDate(item.submittedAt)}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: statusConfig.bg, color: statusConfig.textColor, whiteSpace: 'nowrap', border: `1px solid ${statusConfig.color}` }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: statusConfig.color }} />
                    {statusConfig.label}
                  </span>
                  <span className="material-symbols-outlined" style={{ color: statusConfig.color, fontSize: '24px' }}>arrow_forward_ios</span>
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
// COMPONENTE AUXILIAR
// ============================================================
function StatCard({ icon, label, count, color, bg, onClick }: { icon: string; label: string; count: number; color: string; bg: string; onClick: () => void }) {
  return (
    <button type="button" className="teacher-summary-card" onClick={onClick} style={{ borderColor: color }}>
      <span className="material-symbols-outlined" aria-hidden="true" style={{ color, background: bg, borderRadius: 'var(--radius-md)', padding: '4px' }}>{icon}</span>
      <span className="teacher-summary-card__label">{label}</span>
      <strong className="teacher-summary-card__value">{count}</strong>
    </button>
  )
}

function PageSwitchButton({
  active = false,
  icon,
  label,
  subtitle,
  onClick,
}: {
  active?: boolean
  icon: string
  label: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--outline-variant)'}`,
        background: active ? 'var(--primary-container)' : 'var(--surface)',
        color: active ? 'var(--on-primary-container)' : 'var(--on-surface)',
        cursor: 'pointer',
        fontFamily: 'var(--font-family)',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: active ? 'var(--primary)' : 'var(--on-surface-variant)' }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)' }}>{label}</span>
        <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>{subtitle}</span>
      </span>
    </button>
  )
}
