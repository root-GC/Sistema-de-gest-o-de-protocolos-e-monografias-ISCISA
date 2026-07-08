import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { protocolService, type Protocol } from '../../services/protocolService'
import { topicService, type Topic } from '../../services/topicService'
import '../../styles/global.css'

// ============================================================
// CONSTANTES
// ============================================================
const STATUS_GROUPS: Record<string, { label: string; icon: string; color: string; statuses: string[] }> = {
  reviewing:   { label: 'Em Revisão',   icon: 'rate_review',    color: 'var(--tertiary)', statuses: ['topic_in_review', 'topic_assigned_for_review', 'protocol_in_review_nucleo'] },
  approved:    { label: 'Aprovados',    icon: 'check_circle',   color: 'var(--primary)',  statuses: ['topic_approved_nucleo'] },
  corrections: { label: 'Correções',    icon: 'edit_note',      color: 'var(--secondary)',statuses: ['topic_rejected_supervisor', 'topic_rejected_nucleo', 'protocol_rejected_supervisor'] },
}

// ============================================================
// HELPERS
// ============================================================
function getTopicStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    topic_in_review:              { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
    topic_assigned_for_review:    { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)' },
    topic_approved_nucleo:        { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)' },
    topic_rejected_supervisor:    { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)' },
    topic_rejected_nucleo:        { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)' },
    topic_pending_supervisor:     { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)' },
    topic_pending_nucleo:         { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' }
}

function getProtocolStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    protocol_in_review_nucleo:    { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)' },
    protocol_submitted:           { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
    protocol_pending_supervisor:  { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)' },
    protocol_approved_supervisor: { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)' },
    protocol_approved_nucleo:     { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)' },
    protocol_rejected_nucleo:     { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)' },
    protocol_resubmitted:         { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function ProtocolsOverviewPage() {
  const [searchParams] = useSearchParams()
  const statusFilter = searchParams.get('status')

  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([topicService.list(), protocolService.list()])
      .then(([t, p]) => { setTopics(t.topics); setProtocols(p.protocols) })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const activeGroup = statusFilter ? STATUS_GROUPS[statusFilter] ?? null : null
  const allowedStatuses = activeGroup ? activeGroup.statuses : null

  const filteredTopics = useMemo(
    () => allowedStatuses ? topics.filter(t => allowedStatuses.includes(t.status)) : topics,
    [topics, allowedStatuses]
  )
  const filteredProtocols = useMemo(
    () => allowedStatuses ? protocols.filter(p => allowedStatuses.includes(p.status)) : protocols,
    [protocols, allowedStatuses]
  )

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
            Todos os protocolos
            {activeGroup && (
              <span style={{ color: activeGroup.color, marginLeft: 'var(--space-2)' }}>
                — {activeGroup.label}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Visão geral de temas e protocolos do sistema.
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>inventory_2</span>
          {filteredTopics.length + filteredProtocols.length} item{filteredTopics.length + filteredProtocols.length !== 1 ? 'ns' : ''}
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

      {/* Filtros rápidos */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-1)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-4)'
      }}>
        <FilterChip
          label="Todos"
          icon="inventory_2"
          active={!statusFilter}
          to="/protocols"
        />
        {Object.entries(STATUS_GROUPS).map(([key, group]) => (
          <FilterChip
            key={key}
            label={group.label}
            icon={group.icon}
            color={group.color}
            active={statusFilter === key}
            to={`/protocols?status=${key}`}
            count={
              topics.filter(t => group.statuses.includes(t.status)).length +
              protocols.filter(p => group.statuses.includes(p.status)).length
            }
          />
        ))}
      </div>

      {/* Estado vazio */}
      {filteredTopics.length === 0 && filteredProtocols.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-6) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
            folder_open
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Nenhum item encontrado
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            {statusFilter ? 'Tente outro filtro.' : 'Os protocolos e temas aparecerão aqui.'}
          </p>
        </div>
      )}

      {/* Grid: Temas + Protocolos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 'var(--space-4)',
        alignItems: 'start'
      }}>
        {/* Temas */}
        {filteredTopics.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--on-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>lightbulb</span>
              Temas ({filteredTopics.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredTopics.map(t => {
                const s = getTopicStatusStyle(t.status)
                return (
                  <div key={t.id} className="card" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    transition: 'box-shadow 0.2s'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface)',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.title}
                      </h3>
                    </div>
                    <StatusBadge s={s} label={t.status_label} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Protocolos */}
        {filteredProtocols.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--on-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
              Protocolos ({filteredProtocols.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredProtocols.map(p => {
                const s = getProtocolStatusStyle(p.status)
                return (
                  <div key={p.id} className="card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                    padding: 'var(--space-2) var(--space-3)',
                    transition: 'box-shadow 0.2s'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)'
                    }}>
                      <h3 style={{
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-bold)',
                        color: 'var(--on-surface)'
                      }}>
                        {p.code}
                      </h3>
                      <StatusBadge s={s} label={p.status_label} />
                    </div>
                    <p style={{
                      fontSize: 'var(--label-md)',
                      color: 'var(--on-surface-variant)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      Tema: {p.topic?.title || '—'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function StatusBadge({ s, label }: { s: { bg: string; color: string; dot: string }; label?: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--label-md)',
      fontWeight: 'var(--font-medium)',
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}>
      <span style={{
        width: '6px', height: '6px',
        borderRadius: 'var(--radius-full)',
        background: s.dot
      }} />
      {label || ''}
    </span>
  )
}

function FilterChip({ label, icon, color, active, to, count }: {
  label: string
  icon: string
  color?: string
  active: boolean
  to: string
  count?: number
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '8px var(--space-2)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--body-md)',
        fontWeight: active ? 'var(--font-bold)' : 'var(--font-medium)',
        fontFamily: 'var(--font-family)',
        textDecoration: 'none',
        background: active ? (color || 'var(--primary-container)') : 'var(--surface-container)',
        color: active ? (color ? 'var(--on-primary-container)' : 'var(--on-primary-container)') : 'var(--on-surface-variant)',
        border: active ? `2px solid ${color || 'var(--primary)'}` : '2px solid transparent',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-container-highest)'
          e.currentTarget.style.borderColor = color || 'var(--outline-variant)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-container)'
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-bold)',
          background: active ? 'rgba(255,255,255,0.2)' : 'var(--surface-container-highest)',
          padding: '1px 8px',
          borderRadius: 'var(--radius-full)',
          marginLeft: '2px'
        }}>
          {count}
        </span>
      )}
    </Link>
  )
}