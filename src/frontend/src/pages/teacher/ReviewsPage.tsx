import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getTopicStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic_pending_nucleo:   { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Pendente' },
    topic_assigned:         { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Atribuído' },
    topic_in_review:        { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    topic_approved_nucleo:  { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    topic_rejected_nucleo:  { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getProtocolStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_in_review_nucleo:   { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_approved_nucleo:    { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    protocol_rejected_nucleo:    { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
    protocol_resubmitted:        { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTE
// ============================================================
export default function ReviewsPage() {
  const [tab, setTab] = useState<'topics' | 'protocols'>('topics')
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
      const data = await topicService.listForReviewer()
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
      const data = await protocolService.listForReviewer()
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
          width: '24px',
          height: '24px',
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
  // DADOS FILTRADOS
  // ============================================================
  const assignedTopics = topics.filter(t => 
    t.status !== 'topic_approved_nucleo' && t.status !== 'topic_rejected_nucleo'
  )
  const doneTopics = topics.filter(t => 
    t.status === 'topic_approved_nucleo' || t.status === 'topic_rejected_nucleo'
  )

  const assignedProtocols = protocols.filter(p => 
    p.status !== 'protocol_approved_nucleo' && p.status !== 'protocol_rejected_nucleo'
  )
  const doneProtocols = protocols.filter(p => 
    p.status === 'protocol_approved_nucleo' || p.status === 'protocol_rejected_nucleo'
  )

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
          Revisões Científicas
        </h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          {tab === 'topics' 
            ? `${assignedTopics.length} tema${assignedTopics.length !== 1 ? 's' : ''} pendente${assignedTopics.length !== 1 ? 's' : ''} • ${doneTopics.length} concluído${doneTopics.length !== 1 ? 's' : ''}`
            : `${assignedProtocols.length} protocolo${assignedProtocols.length !== 1 ? 's' : ''} pendente${assignedProtocols.length !== 1 ? 's' : ''} • ${doneProtocols.length} concluído${doneProtocols.length !== 1 ? 's' : ''}`
          }
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
        borderBottom: '1px solid var(--outline-variant)',
        paddingBottom: 'var(--space-1)',
        marginBottom: 'var(--space-4)'
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
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lightbulb</span>
          Temas
          {assignedTopics.length > 0 && (
            <span style={{
              background: 'var(--tertiary)',
              color: 'var(--on-tertiary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-bold)'
            }}>
              {assignedTopics.length}
            </span>
          )}
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
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
          Protocolos
          {assignedProtocols.length > 0 && (
            <span style={{
              background: 'var(--tertiary)',
              color: 'var(--on-tertiary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-bold)'
            }}>
              {assignedProtocols.length}
            </span>
          )}
        </button>
      </div>

      {/* ==================== TEMAS ==================== */}
      {tab === 'topics' && (
        <>
          {/* Atribuídas */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--tertiary)',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>pending_actions</span>
              Atribuídas a mim
            </h2>

            {assignedTopics.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-4) var(--space-3)',
                color: 'var(--on-surface-variant)',
                background: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--outline-variant)',
                fontSize: 'var(--body-md)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>task_alt</span>
                Nenhuma revisão pendente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {assignedTopics.map(topic => {
                  const s = getTopicStatusStyle(topic.status)
                  return (
                    <Link
                      key={topic.id}
                      to={`/reviews/topics/${topic.id}`}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-3) var(--space-4)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        border: '1px solid var(--outline-variant)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.borderColor = 'var(--outline-variant)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: 'var(--body-lg)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--on-surface)',
                          marginBottom: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {topic.title}
                        </h3>
                        {topic.scientific_area && (
                          <span style={{
                            fontSize: 'var(--label-sm)',
                            color: 'var(--on-surface-variant)',
                            marginRight: '8px'
                          }}>
                            {topic.scientific_area.name}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--label-md)',
                          fontWeight: 'var(--font-medium)',
                          background: s.bg,
                          color: s.color
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                          {topic.status_label || s.label}
                        </span>
                      </div>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '24px',
                        color: 'var(--primary)',
                        flexShrink: 0
                      }}>
                        arrow_forward
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Concluídas */}
          {doneTopics.length > 0 && (
            <div>
              <h2 style={{
                fontSize: 'var(--title-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface-variant)',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>checklist</span>
                Concluídas
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {doneTopics.map(topic => {
                  const s = getTopicStatusStyle(topic.status)
                  return (
                    <div key={topic.id} className="card" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      opacity: 0.75
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
                          {topic.title}
                        </h3>
                      </div>
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
                        flexShrink: 0
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                        {topic.status_label || s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== PROTOCOLOS ==================== */}
      {tab === 'protocols' && (
        <>
          {/* Atribuídos */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <h2 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--tertiary)',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>pending_actions</span>
              Atribuídos a mim
            </h2>

            {assignedProtocols.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-4) var(--space-3)',
                color: 'var(--on-surface-variant)',
                background: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--outline-variant)',
                fontSize: 'var(--body-md)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>task_alt</span>
                Nenhum protocolo pendente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {assignedProtocols.map(protocol => {
                  const s = getProtocolStatusStyle(protocol.status)
                  return (
                    <Link
                      key={protocol.id}
                      to={`/reviews/protocols/${protocol.id}`}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-3) var(--space-4)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        border: '1px solid var(--outline-variant)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.borderColor = 'var(--outline-variant)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginBottom: '6px',
                          flexWrap: 'wrap'
                        }}>
                          <h3 style={{
                            fontSize: 'var(--body-lg)',
                            fontWeight: 'var(--font-bold)',
                            color: 'var(--on-surface)'
                          }}>
                            {protocol.code}
                          </h3>
                        </div>
                        {protocol.topic && (
                          <p style={{
                            fontSize: 'var(--body-sm)',
                            color: 'var(--on-surface-variant)',
                            marginBottom: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            Tema: {protocol.topic.title}
                          </p>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--label-md)',
                          fontWeight: 'var(--font-medium)',
                          background: s.bg,
                          color: s.color
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                          {protocol.status_label || s.label}
                        </span>
                      </div>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '24px',
                        color: 'var(--primary)',
                        flexShrink: 0
                      }}>
                        arrow_forward
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Concluídos */}
          {doneProtocols.length > 0 && (
            <div>
              <h2 style={{
                fontSize: 'var(--title-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface-variant)',
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>checklist</span>
                Concluídos
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {doneProtocols.map(protocol => {
                  const s = getProtocolStatusStyle(protocol.status)
                  return (
                    <div key={protocol.id} className="card" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      opacity: 0.75
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: 'var(--body-md)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--on-surface)',
                          marginBottom: '4px'
                        }}>
                          {protocol.code}
                        </h3>
                        {protocol.topic && (
                          <p style={{
                            fontSize: 'var(--label-sm)',
                            color: 'var(--on-surface-variant)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {protocol.topic.title}
                          </p>
                        )}
                      </div>
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
                        flexShrink: 0
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                        {protocol.status_label || s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}