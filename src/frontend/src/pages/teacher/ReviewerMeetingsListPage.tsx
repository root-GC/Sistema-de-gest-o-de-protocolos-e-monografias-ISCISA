// src/pages/reviewer/ReviewerMeetingsListPage.tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { evaluationService, type EvaluationForm } from '../../services/evaluationService'
import { useAuth } from '../../context/AuthContext'

// ============================================================
// TIPOS
// ============================================================
type MeetingStatus = 'deliberation_pending' | 'deliberation_scheduled' | 'in_deliberation' | 'concluded' | 'all'

// ============================================================
// HELPERS
// ============================================================
function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
    deliberation_pending: {
      label: 'Pendente',
      icon: 'schedule',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-container)',
      textColor: 'var(--on-tertiary-container)',
    },
    deliberation_scheduled: {
      label: 'Agendada',
      icon: 'event',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
    in_deliberation: {
      label: 'Em andamento',
      icon: 'play_circle',
      color: 'var(--secondary)',
      bg: 'var(--secondary-container)',
      textColor: 'var(--on-secondary-container)',
    },
    concluded: {
      label: 'Concluída',
      icon: 'check_circle',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-fixed)',
      textColor: 'var(--on-tertiary-fixed)',
    },
  }
  return configs[status] || {
    label: status,
    icon: 'help',
    color: 'var(--outline)',
    bg: 'var(--surface-container)',
    textColor: 'var(--on-surface-variant)',
  }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ReviewerMeetingsListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [forms, setForms] = useState<EvaluationForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<MeetingStatus>('all')

  useEffect(() => {
    loadDeliberationForms()
  }, [])

  async function loadDeliberationForms() {
    setLoading(true)
    setError(null)
    try {
      const data = await evaluationService.listForReviewer()
      console.log('📊 Reuniões de Deliberação:', data)
      
      const deliberationForms = (data.evaluation_forms || []).filter(f => 
        f.status === 'deliberation_pending' || 
        f.status === 'deliberation_scheduled' || 
        f.status === 'in_deliberation' ||
        f.status === 'concluded'
      )
      
      setForms(deliberationForms)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtros
  const filteredForms = forms.filter(f => {
    const matchesSearch = searchTerm === '' || 
      f.protocol?.topic?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.protocol?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.deliberation_location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || f.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // 🆕 Determina se a reunião está ativa (em andamento)
  function isActiveMeeting(status: string): boolean {
    return status === 'in_deliberation'
  }

  // 🆕 Determina se está pendente (precisa de ação)
  function isPendingAction(status: string): boolean {
    return status === 'deliberation_pending'
  }

  // Estatísticas
  const stats = {
    total: forms.length,
    pending: forms.filter(f => f.status === 'deliberation_pending').length,
    scheduled: forms.filter(f => f.status === 'deliberation_scheduled').length,
    active: forms.filter(f => f.status === 'in_deliberation').length,
    concluded: forms.filter(f => f.status === 'concluded').length,
    needAction: forms.filter(f => isPendingAction(f.status)).length,
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
        A carregar reuniões...
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
            Reuniões de Deliberação
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {stats.total} reuni{stats.total !== 1 ? 'ões' : 'ão'} encontrada{stats.total !== 1 ? 's' : ''}
            {stats.needAction > 0 && ` • ${stats.needAction} pendente${stats.needAction !== 1 ? 's' : ''}`}
            {stats.active > 0 && ` • ${stats.active} em andamento`}
            {stats.scheduled > 0 && ` • ${stats.scheduled} agendada${stats.scheduled !== 1 ? 's' : ''}`}
            {stats.concluded > 0 && ` • ${stats.concluded} concluída${stats.concluded !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatCard icon="hourglass_top" label="Pendentes" count={stats.pending} color="var(--tertiary)" bg="var(--tertiary-container)" textColor="var(--on-tertiary-container)" onClick={() => setFilterStatus('deliberation_pending')} />
        <StatCard icon="event" label="Agendadas" count={stats.scheduled} color="var(--primary)" bg="var(--primary-container)" textColor="var(--on-primary-container)" onClick={() => setFilterStatus('deliberation_scheduled')} />
        <StatCard icon="play_circle" label="Em Andamento" count={stats.active} color="var(--secondary)" bg="var(--secondary-container)" textColor="var(--on-secondary-container)" onClick={() => setFilterStatus('in_deliberation')} />
        <StatCard icon="check_circle" label="Concluídas" count={stats.concluded} color="var(--tertiary)" bg="var(--tertiary-fixed)" textColor="var(--on-tertiary-fixed)" onClick={() => setFilterStatus('concluded')} />
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
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por título, código ou local..." style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as MeetingStatus)} style={{ padding: '12px 16px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer' }}>
          <option value="all">Todos os estados</option>
          <option value="deliberation_pending">Pendentes</option>
          <option value="deliberation_scheduled">Agendadas</option>
          <option value="in_deliberation">Em andamento</option>
          <option value="concluded">Concluídas</option>
        </select>
        {(searchTerm || filterStatus !== 'all') && (
          <button onClick={() => { setSearchTerm(''); setFilterStatus('all') }} style={{ padding: '12px 16px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_alt_off</span>Limpar
          </button>
        )}
      </div>

      {/* Lista de Reuniões */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filteredForms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>{searchTerm || filterStatus !== 'all' ? 'search_off' : 'event_busy'}</span>
            <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>{searchTerm || filterStatus !== 'all' ? 'Nenhum resultado encontrado' : 'Nenhuma reunião de deliberação encontrada'}</p>
          </div>
        ) : (
          filteredForms.map((form, i) => {
            const statusConfig = getStatusConfig(form.status)
            const isActive = isActiveMeeting(form.status)
            const hasPending = isPendingAction(form.status)
            const canClick = form.protocol_id // Sempre pode clicar se tem protocol_id

            return (
              <Link
                key={form.id ?? i}
                to={`/reviewer/meetings/${form.protocol_id}`}
                style={{
                  padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center',
                  gap: 'var(--space-3)', cursor: canClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease', border: `1px solid ${hasPending || isActive ? statusConfig.color : 'var(--outline-variant)'}`,
                  flexWrap: 'wrap', background: hasPending || isActive ? `color-mix(in srgb, ${statusConfig.bg} 30%, var(--surface))` : 'var(--surface)',
                  textDecoration: 'none', color: 'inherit',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { 
                  if (canClick) { 
                    e.currentTarget.style.borderColor = statusConfig.color
                    e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                  }
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.borderColor = hasPending || isActive ? statusConfig.color : 'var(--outline-variant)'
                  e.currentTarget.style.boxShadow = 'var(--elevation-1)'
                }}
              >
                {/* Indicador lateral para reuniões ativas */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: 'var(--secondary)',
                    animation: 'pulseWidth 2s ease-in-out infinite',
                  }} />
                )}

                {/* Ícone da Reunião */}
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
                  background: isActive ? statusConfig.bg : 'var(--surface-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, border: `2px solid ${isActive ? statusConfig.color : 'var(--outline-variant)'}`,
                  position: 'relative',
                }}>
                  <span className="material-symbols-outlined" style={{ color: statusConfig.color, fontSize: '24px' }}>
                    {statusConfig.icon}
                  </span>
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      width: '10px', height: '10px',
                      background: 'var(--secondary)',
                      borderRadius: 'var(--radius-full)',
                      border: '2px solid var(--surface-container-lowest)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  )}
                </div>

                {/* Informações da Reunião */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 8px', borderRadius: 'var(--radius-md)' }}>
                      {form.protocol?.code || `#${form.protocol_id}`}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: statusConfig.bg, color: statusConfig.textColor, whiteSpace: 'nowrap', border: `1px solid ${statusConfig.color}` }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: statusConfig.color, animation: isActive ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
                      {statusConfig.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
                    {form.protocol?.topic?.title || 'Sem título'}
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    {form.deliberation_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span>
                        {new Date(form.deliberation_date).toLocaleDateString('pt-PT', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                    {form.deliberation_location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                        {form.deliberation_location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ação */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  {isActive && (
                    <span style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Entrar
                    </span>
                  )}
                  <span className="material-symbols-outlined" style={{ color: canClick ? statusConfig.color : 'var(--outline)', fontSize: '24px' }}>
                    {canClick ? 'arrow_forward_ios' : 'hourglass_top'}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes pulseWidth { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function StatCard({ icon, label, count, color, bg, textColor, onClick }: { icon: string; label: string; count: number; color: string; bg: string; textColor: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: 'var(--space-3)', background: bg, borderRadius: 'var(--radius-lg)', border: `1px solid ${color}`, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--elevation-2)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--elevation-1)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color }}>{icon}</span>
      <div>
        <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0, lineHeight: 1 }}>{count}</p>
        <p style={{ fontSize: 'var(--label-sm)', color: textColor, margin: '4px 0 0' }}>{label}</p>
      </div>
    </div>
  )
}