import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import '../../styles/global.css'

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
    protocol_resubmitted:        { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTE
// ============================================================
export default function SupervisionPage() {
  const [tab, setTab] = useState<'topics' | 'protocols'>('topics')
  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tab === 'topics') loadTopics()
    else loadProtocols()
  }, [tab])

  async function loadTopics() {
    setLoading(true)
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
    try {
      const data = await protocolService.listForSupervisor()
      setProtocols(data.protocols || [])
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

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        width: '100%',
        fontFamily: 'var(--font-family)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        color: 'var(--on-surface-variant)',
        fontSize: 'var(--body-lg)'
      }}>
        <span style={{
          width: '24px',
          height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite',
          marginRight: 'var(--space-2)'
        }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)',
      width: '100%'
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-2)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)',
            fontFamily: 'var(--font-family)'
          }}>
            Os meus tutorandos
          </h1>
          <p style={{
            fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-family)'
          }}>
            Validação de temas e protocolos • 
            {tab === 'topics' 
              ? `${pendingTopics.length} tema${pendingTopics.length !== 1 ? 's' : ''} pendente${pendingTopics.length !== 1 ? 's' : ''}`
              : `${pendingProtocols.length} protocolo${pendingProtocols.length !== 1 ? 's' : ''} pendente${pendingProtocols.length !== 1 ? 's' : ''}`
            }
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>school</span>
          {tab === 'topics' ? topics.length : protocols.length} 
          {tab === 'topics' ? ' aluno(s)' : ' protocolo(s)'}
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
          fontFamily: 'var(--font-family)'
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
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
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
          {pendingTopics.length > 0 && (
            <span style={{
              background: 'var(--tertiary)',
              color: 'var(--on-tertiary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-bold)'
            }}>
              {pendingTopics.length}
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
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
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
          {pendingProtocols.length > 0 && (
            <span style={{
              background: 'var(--tertiary)',
              color: 'var(--on-tertiary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-bold)'
            }}>
              {pendingProtocols.length}
            </span>
          )}
        </button>
      </div>

      {/* ==================== CONTEÚDO: TEMAS ==================== */}
      {tab === 'topics' && (
        <>
          {/* Pendentes de validação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--tertiary)',
              fontFamily: 'var(--font-family)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>pending_actions</span>
              Pendentes de validação
            </h2>

            {pendingTopics.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-4) var(--space-3)',
                color: 'var(--on-surface-variant)',
                background: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--outline-variant)',
                fontSize: 'var(--body-md)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>
                  task_alt
                </span>
                Sem temas pendentes de validação.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {pendingTopics.map(topic => (
                  <div
                    key={topic.id}
                    className="card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 'var(--body-lg)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface)',
                        fontFamily: 'var(--font-family)',
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {topic.title}
                      </h3>
                      {topic.student?.name && (
                        <p style={{
                          fontSize: 'var(--body-md)',
                          color: 'var(--on-surface-variant)',
                          fontFamily: 'var(--font-family)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                          {topic.student.name}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                      <button
                        onClick={() => approveTopic(topic.id)}
                        disabled={actingId === topic.id}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          padding: '10px var(--space-3)',
                          fontSize: 'var(--body-md)',
                          fontWeight: 'var(--font-semibold)',
                          fontFamily: 'var(--font-family)',
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          cursor: actingId === topic.id ? 'not-allowed' : 'pointer',
                          opacity: actingId === topic.id ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        {actingId === topic.id ? (
                          <>
                            <span style={{
                              width: '14px', height: '14px',
                              border: '2px solid var(--on-primary)',
                              borderTopColor: 'transparent',
                              borderRadius: 'var(--radius-full)',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                            A processar...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                            Aprovar
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => rejectTopic(topic.id)}
                        disabled={actingId === topic.id}
                        className="btn btn-danger"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          padding: '10px var(--space-3)',
                          fontSize: 'var(--body-md)',
                          fontWeight: 'var(--font-semibold)',
                          fontFamily: 'var(--font-family)',
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          cursor: actingId === topic.id ? 'not-allowed' : 'pointer',
                          opacity: actingId === topic.id ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processados */}
          {processedTopics.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h2 style={{
                fontSize: 'var(--title-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface-variant)',
                fontFamily: 'var(--font-family)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>checklist</span>
                Já processados
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {processedTopics.map(topic => (
                  <div
                    key={topic.id}
                    className="card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      opacity: 0.75
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface)',
                        fontFamily: 'var(--font-family)',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {topic.title}
                      </h3>
                      {topic.student?.name && (
                        <p style={{
                          fontSize: 'var(--label-md)',
                          color: 'var(--on-surface-variant)',
                          fontFamily: 'var(--font-family)'
                        }}>
                          {topic.student.name}
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
                      background: topic.status === 'topic_pending_nucleo' || topic.status === 'topic_approved_nucleo'
                        ? 'var(--primary-container)'
                        : 'var(--error-container)',
                      color: topic.status === 'topic_pending_nucleo' || topic.status === 'topic_approved_nucleo'
                        ? 'var(--on-primary-container)'
                        : 'var(--on-error-container)',
                      flexShrink: 0
                    }}>
                      <span style={{
                        width: '6px', height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: topic.status === 'topic_pending_nucleo' || topic.status === 'topic_approved_nucleo'
                          ? 'var(--primary)'
                          : 'var(--error)'
                      }} />
                      {topic.status_label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== CONTEÚDO: PROTOCOLOS ==================== */}
      {tab === 'protocols' && (
        <>
          {/* Pendentes de validação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 style={{
              fontSize: 'var(--title-md)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--tertiary)',
              fontFamily: 'var(--font-family)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>pending_actions</span>
              Pendentes de validação
            </h2>

            {pendingProtocols.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-4) var(--space-3)',
                color: 'var(--on-surface-variant)',
                background: 'var(--surface-container-low)',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--outline-variant)',
                fontSize: 'var(--body-md)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>
                  task_alt
                </span>
                Sem protocolos pendentes de validação.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {pendingProtocols.map(protocol => {
                  const s = getProtocolStatusStyle(protocol.status)
                  return (
                    <div
                      key={protocol.id}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        border: '1px solid var(--tertiary)'
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
                            color: 'var(--on-surface)',
                            fontFamily: 'var(--font-family)'
                          }}>
                            {protocol.code}
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
                            <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                            {s.label}
                          </span>
                        </div>
                        {protocol.topic && (
                          <p style={{
                            fontSize: 'var(--body-sm)',
                            color: 'var(--on-surface-variant)',
                            marginBottom: '2px'
                          }}>
                            Tema: {protocol.topic.title}
                          </p>
                        )}
                        <p style={{
                          fontSize: 'var(--label-md)',
                          color: 'var(--on-surface-variant)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                          {protocol.student?.name || 'Estudante'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                        <Link
                          to={`/supervisor/protocols/${protocol.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                            padding: '10px var(--space-3)',
                            fontSize: 'var(--body-md)',
                            fontWeight: 'var(--font-semibold)',
                            fontFamily: 'var(--font-family)',
                            borderRadius: 'var(--radius-lg)',
                            textDecoration: 'none',
                            background: 'var(--surface-container)',
                            color: 'var(--on-surface)',
                            border: '1px solid var(--outline-variant)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                          Abrir
                        </Link>

                        <button
                          onClick={() => approveProtocol(protocol.id)}
                          disabled={actingId === protocol.id}
                          className="btn btn-primary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                            padding: '10px var(--space-3)',
                            fontSize: 'var(--body-md)',
                            fontWeight: 'var(--font-semibold)',
                            fontFamily: 'var(--font-family)',
                            borderRadius: 'var(--radius-lg)',
                            border: 'none',
                            cursor: actingId === protocol.id ? 'not-allowed' : 'pointer',
                            opacity: actingId === protocol.id ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          {actingId === protocol.id ? (
                            <span style={{
                              width: '14px', height: '14px',
                              border: '2px solid var(--on-primary)',
                              borderTopColor: 'transparent',
                              borderRadius: 'var(--radius-full)',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                          ) : (
                            <>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                              Aprovar
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => rejectProtocol(protocol.id)}
                          disabled={actingId === protocol.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                            padding: '10px var(--space-3)',
                            fontSize: 'var(--body-md)',
                            fontWeight: 'var(--font-semibold)',
                            fontFamily: 'var(--font-family)',
                            borderRadius: 'var(--radius-lg)',
                            border: 'none',
                            cursor: actingId === protocol.id ? 'not-allowed' : 'pointer',
                            opacity: actingId === protocol.id ? 0.6 : 1,
                            transition: 'all 0.2s',
                            background: 'var(--error)',
                            color: 'var(--on-error)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cancel</span>
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Processados */}
          {processedProtocols.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h2 style={{
                fontSize: 'var(--title-md)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface-variant)',
                fontFamily: 'var(--font-family)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>checklist</span>
                Já processados
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {processedProtocols.map(protocol => {
                  const s = getProtocolStatusStyle(protocol.status)
                  return (
                    <div
                      key={protocol.id}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-3)',
                        opacity: 0.75
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
                            fontSize: 'var(--body-md)',
                            fontWeight: 'var(--font-semibold)',
                            color: 'var(--on-surface)',
                            fontFamily: 'var(--font-family)'
                          }}>
                            {protocol.code}
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
                            <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                            {s.label}
                          </span>
                        </div>
                        {protocol.topic && (
                          <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                            {protocol.topic.title}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/supervisor/protocols/${protocol.id}`}
                        style={{
                          padding: '6px var(--space-2)',
                          fontSize: 'var(--label-md)',
                          fontWeight: 'var(--font-medium)',
                          fontFamily: 'var(--font-family)',
                          borderRadius: 'var(--radius-lg)',
                          textDecoration: 'none',
                          background: 'var(--surface-container)',
                          color: 'var(--on-surface)',
                          border: '1px solid var(--outline-variant)',
                          flexShrink: 0
                        }}
                      >
                        Ver
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}