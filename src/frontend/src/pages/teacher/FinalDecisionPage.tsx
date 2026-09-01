// src/pages/reviewer/FinalDecisionPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { evaluationService, type EvaluationForm } from '../../services/evaluationService'

// ============================================================
// HELPERS
// ============================================================
function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
    deliberated: {
      label: 'Aguardando Decisão',
      icon: 'hourglass_top',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-container)',
      textColor: 'var(--on-tertiary-container)',
    },
    concluded: {
      label: 'Concluída',
      icon: 'check_circle',
      color: 'var(--primary)',
      bg: 'var(--primary-fixed)',
      textColor: 'var(--on-primary-fixed)',
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

function getPhaseConfig(phase: string) {
  const configs: Record<string, { label: string; icon: string; color: string; bg: string; textColor: string }> = {
    topic: {
      label: 'Tema',
      icon: 'lightbulb',
      color: 'var(--tertiary)',
      bg: 'var(--tertiary-container)',
      textColor: 'var(--on-tertiary-container)',
    },
    protocol: {
      label: 'Protocolo',
      icon: 'description',
      color: 'var(--primary)',
      bg: 'var(--primary-container)',
      textColor: 'var(--on-primary-container)',
    },
  }
  return configs[phase] || configs.protocol
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr || '' }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function FinalDecisionPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<EvaluationForm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadPendingDecisions = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError(null)
    try {
      const [ccData, bioeticaData] = await Promise.all([
        evaluationService.listPendingFinalDecision('comite-cientifico'),
        evaluationService.listPendingFinalDecision('comite-bioetica'),
      ])
      const uniqueForms = [
        ...(ccData.evaluation_forms || []),
        ...(bioeticaData.evaluation_forms || []),
      ]
        .filter((form, index, all) => all.findIndex(item => item.id === form.id) === index)

      setForms(uniqueForms)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as decisões pendentes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void loadPendingDecisions() }, 0)
    return () => window.clearTimeout(requestId)
  }, [loadPendingDecisions])

  // Filtros
  const filteredForms = forms.filter(f => {
    const matchesSearch = searchTerm === '' || 
      f.protocol?.topic?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.protocol?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.protocol?.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Estatísticas
  const stats = {
    total: forms.length,
    pending: forms.filter(f => f.status === 'deliberated').length,
    concluded: forms.filter(f => f.status === 'concluded').length,
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
        A carregar decisões pendentes...
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
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            Decisões Pendentes
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {stats.total} ficha{stats.total !== 1 ? 's' : ''} encontrada{stats.total !== 1 ? 's' : ''}
            {stats.pending > 0 && ` • ${stats.pending} aguardando decisão`}
            {stats.concluded > 0 && ` • ${stats.concluded} concluída${stats.concluded !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>{error}
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por título, código ou estudante..." style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ padding: '12px 16px', background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_alt_off</span>Limpar
          </button>
        )}
      </div>

      {/* Lista de Fichas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {filteredForms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>{searchTerm ? 'search_off' : 'gavel'}</span>
            <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>{searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma decisão pendente'}</p>
          </div>
        ) : (
          filteredForms.map((form, i) => {
            const statusConfig = getStatusConfig(form.status)
            const phaseConfig = getPhaseConfig(form.protocol ? 'protocol' : 'topic')
            const isPending = form.status === 'deliberated'

            // Resumo das decisões dos revisores
            const reviewerDecisions = (form.reviewer_evaluations || []).map(re => ({
              name: re.reviewer?.user?.name || 'Revisor',
              decision: re.decision === 'approved' ? 'Aprovou' : re.decision === 'not_approved' ? 'Não Aprovou' : 'Pendente',
              isApproved: re.decision === 'approved',
            }))

            return (
              <div
                key={form.id ?? i}
                className="card"
                onClick={() => navigate(`/reviewer/final-decisions/${form.id}`)}
                style={{
                  padding: 'var(--space-2) var(--space-3)', display: 'flex', alignItems: 'center',
                  gap: 'var(--space-3)', cursor: 'pointer',
                  transition: 'border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease', border: `1px solid ${isPending ? statusConfig.color : 'var(--outline-variant)'}`,
                  flexWrap: 'wrap', background: isPending ? `color-mix(in srgb, ${statusConfig.bg} 30%, var(--surface))` : 'var(--surface)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = statusConfig.color; e.currentTarget.style.boxShadow = 'var(--elevation-2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isPending ? statusConfig.color : 'var(--outline-variant)'; e.currentTarget.style.boxShadow = 'var(--elevation-1)' }}
              >
                {/* Ícone */}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: phaseConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: phaseConfig.color, fontSize: '24px' }}>{phaseConfig.icon}</span>
                </div>

                {/* Informações */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
                    {form.protocol?.code && (
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 8px', borderRadius: 'var(--radius-md)' }}>
                        {form.protocol.code}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: statusConfig.bg, color: statusConfig.textColor, whiteSpace: 'nowrap', border: `1px solid ${statusConfig.color}` }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: statusConfig.color }} />
                      {statusConfig.label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
                    {form.protocol?.topic?.title || 'Sem título'}
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    {form.protocol?.student?.name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                        {form.protocol.student.name}
                      </span>
                    )}
                    {form.deliberation_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span>
                        {formatDate(form.deliberation_date)}
                      </span>
                    )}
                  </div>

                  {/* Resumo dos revisores */}
                  {reviewerDecisions.length > 0 && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                      {reviewerDecisions.map((rd, idx) => (
                        <span key={idx} style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          background: rd.isApproved ? 'var(--primary-container)' : 'var(--error-container)',
                          color: rd.isApproved ? 'var(--on-primary-container)' : 'var(--on-error-container)',
                        }}>
                          {rd.name}: {rd.decision}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ação */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: isPending ? statusConfig.color : 'var(--outline)', fontSize: '24px' }}>
                    arrow_forward_ios
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
