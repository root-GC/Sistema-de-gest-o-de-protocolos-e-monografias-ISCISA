// src/pages/supervisor/SupervisorProtocolsPage.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { protocolService, type Protocol } from '../../services/protocolService'
import { topicService, type Topic } from '../../services/topicService'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    protocol_approved_supervisor:{ bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado (Supervisor)' },
    protocol_rejected_supervisor:{ bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Supervisor)' },
    protocol_pending_nucleo:     { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    protocol_in_review:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_in_review_nucleo:   { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão (Núcleo)' },
    protocol_approved_nucleo:    { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    protocol_rejected_nucleo:    { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
    protocol_resubmitted:        { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTE
// ============================================================
export default function SupervisorProtocolsPage() {
  const [tab, setTab] = useState<'topics' | 'protocols'>('protocols')
  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tab === 'topics') loadTopics()
    else loadProtocols()
  }, [tab])

  async function loadTopics() {
    setLoading(true)
    try {
      const data = await topicService.listForSupervisor()
      setTopics(data.topics || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadProtocols() {
    setLoading(true)
    try {
      const data = await protocolService.listForSupervisor()
      setProtocols(data.protocols || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

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
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{
          fontSize: 'var(--headline-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)',
          marginBottom: 'var(--space-1)'
        }}>
          Supervisionamento
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Temas e protocolos dos seus orientandos.
        </p>
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
        marginBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--outline-variant)',
        paddingBottom: 'var(--space-1)'
      }}>
        <button
          onClick={() => setTab('topics')}
          style={{
            padding: '10px var(--space-3)',
            fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)',
            fontFamily: 'var(--font-family)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            background: tab === 'topics' ? 'var(--primary-container)' : 'transparent',
            color: tab === 'topics' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>
            lightbulb
          </span>
          Temas ({topics.length})
        </button>

        <button
          onClick={() => setTab('protocols')}
          style={{
            padding: '10px var(--space-3)',
            fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)',
            fontFamily: 'var(--font-family)',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            background: tab === 'protocols' ? 'var(--primary-container)' : 'transparent',
            color: tab === 'protocols' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>
            description
          </span>
          Protocolos ({protocols.length})
        </button>
      </div>

      {/* ==================== LISTA DE TEMAS ==================== */}
      {tab === 'topics' && (
        <>
          {topics.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-5) var(--space-3)',
              color: 'var(--on-surface-variant)',
              background: 'var(--surface-container-low)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--outline-variant)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
                lightbulb
              </span>
              <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
                Nenhum tema para revisão
              </p>
              <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
                Os temas dos seus orientandos aparecerão aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {topics.map((t: Topic) => (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3) var(--space-4)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 'var(--body-lg)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {t.scientific_area && (
                        <span style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)',
                          background: 'var(--surface-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {t.scientific_area.name}
                        </span>
                      )}
                      {t.student && (
                        <span style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)',
                          background: 'var(--surface-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {t.student.name}
                        </span>
                      )}
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '8px',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-medium)',
                      background: 'var(--tertiary-container)',
                      color: 'var(--on-tertiary-container)'
                    }}>
                      <span style={{
                        width: '6px', height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--tertiary)'
                      }} />
                      {t.status_label || t.status}
                    </span>
                  </div>
                  <Link
                    to={`/supervisor/topics/${t.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      padding: '8px var(--space-3)',
                      background: 'var(--primary)',
                      color: 'var(--on-primary)',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      fontSize: 'var(--body-md)',
                      fontWeight: 'var(--font-semibold)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                    Abrir
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== LISTA DE PROTOCOLOS ==================== */}
      {tab === 'protocols' && (
        <>
          {protocols.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-5) var(--space-3)',
              color: 'var(--on-surface-variant)',
              background: 'var(--surface-container-low)',
              borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--outline-variant)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
                description
              </span>
              <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
                Nenhum protocolo para revisão
              </p>
              <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
                Os protocolos dos seus orientandos aparecerão aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {protocols.map((p: Protocol) => {
                const s = getStatusStyle(p.status)
                const isPending = p.status === 'protocol_pending_supervisor' || p.status === 'protocol_submitted'

                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3) var(--space-4)',
                      border: isPending ? '1px solid var(--tertiary)' : '1px solid var(--outline-variant)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginBottom: '4px',
                        flexWrap: 'wrap'
                      }}>
                        <h3 style={{
                          fontSize: 'var(--body-lg)',
                          fontWeight: 'var(--font-bold)',
                          color: 'var(--on-surface)',
                          fontFamily: 'var(--font-family)'
                        }}>
                          {p.code}
                        </h3>
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
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{
                            width: '6px', height: '6px',
                            borderRadius: 'var(--radius-full)',
                            background: s.dot
                          }} />
                          {p.status_label || s.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {p.topic && (
                          <span style={{
                            fontSize: 'var(--label-sm)',
                            color: 'var(--on-surface-variant)',
                            background: 'var(--surface-container)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)'
                          }}>
                            Tema: {p.topic.title}
                          </span>
                        )}
                        {p.student && (
                          <span style={{
                            fontSize: 'var(--label-sm)',
                            color: 'var(--on-surface-variant)',
                            background: 'var(--surface-container)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)'
                          }}>
                            {p.student.name}
                          </span>
                        )}
                        <span style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)',
                          background: 'var(--surface-container)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          Submissão nº{p.submission_number} • v{p.version}
                        </span>
                      </div>
                    </div>

                    {/* Botão para abrir o protocolo */}
                    <Link
                      to={`/supervisor/protocols/${p.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '8px var(--space-3)',
                        background: isPending ? 'var(--primary)' : 'var(--surface-container)',
                        color: isPending ? 'var(--on-primary)' : 'var(--on-surface)',
                        borderRadius: 'var(--radius-lg)',
                        textDecoration: 'none',
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-semibold)',
                        whiteSpace: 'nowrap',
                        border: isPending ? 'none' : '1px solid var(--outline-variant)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {isPending ? 'rate_review' : 'visibility'}
                      </span>
                      {isPending ? 'Revisar' : 'Ver'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}