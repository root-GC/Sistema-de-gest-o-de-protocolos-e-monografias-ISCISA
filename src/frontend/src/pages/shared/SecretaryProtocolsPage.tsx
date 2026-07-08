import { useEffect, useState } from 'react'
import { topicService, type Topic } from '../../services/topicService'
import '../../styles/global.css'

export default function SecretaryProtocolsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewersByTopic, setReviewersByTopic] = useState<Record<number, { id: number; name: string }[]>>({})
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { topics } = await topicService.listForSecretary()
      setTopics(topics)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadReviewers(topicId: number) {
    try {
      const { reviewers } = await topicService.eligibleReviewers(topicId)
      setReviewersByTopic(prev => ({ ...prev, [topicId]: reviewers }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function toggleReviewer(topicId: number, reviewerId: number) {
    setSelected(prev => {
      const current = prev[topicId] ?? []
      const next = current.includes(reviewerId)
        ? current.filter(id => id !== reviewerId)
        : [...current, reviewerId]
      return { ...prev, [topicId]: next }
    })
  }

  async function assign(topicId: number) {
    const reviewerIds = selected[topicId] ?? []
    if (reviewerIds.length === 0) return
    setAssigningId(topicId)
    try {
      await topicService.assignReviewers(topicId, reviewerIds)
      setSelected(prev => {
        const next = { ...prev }
        delete next[topicId]
        return next
      })
      setReviewersByTopic(prev => {
        const next = { ...prev }
        delete next[topicId]
        return next
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAssigningId(null)
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
      topic_pending_supervisor: {
        bg: 'var(--tertiary-container)',
        color: 'var(--on-tertiary-container)',
        dot: 'var(--tertiary)',
        label: 'Pendente (Supervisor)'
      },
      topic_pending_nucleo: {
        bg: 'var(--tertiary-fixed)',
        color: 'var(--on-tertiary-fixed)',
        dot: 'var(--tertiary)',
        label: 'Pendente (Núcleo)'
      },
      topic_approved_nucleo: {
        bg: 'var(--primary-container)',
        color: 'var(--on-primary-container)',
        dot: 'var(--primary)',
        label: 'Aprovado'
      },
      topic_rejected: {
        bg: 'var(--error-container)',
        color: 'var(--on-error-container)',
        dot: 'var(--error)',
        label: 'Rejeitado'
      },
    }
    return map[status] || {
      bg: 'var(--surface-container)',
      color: 'var(--on-surface-variant)',
      dot: 'var(--outline)',
      label: status
    }
  }

  const pendingTopics = topics.filter(t => t.status === 'topic_pending_nucleo')
  const otherTopics = topics.filter(t => t.status !== 'topic_pending_nucleo')

  if (loading) {
    return (
      <div style={{
        width: '100%',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-background)'
      }}>
        <div style={{
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
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
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
            Gestão de submissões
          </h1>
          <p style={{
            fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-family)'
          }}>
            Atribuição de revisores aos protocolos submetidos • Revisão cega
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>
          {topics.length} submissão{topics.length !== 1 ? 'ões' : ''}
          {pendingTopics.length > 0 && ` • ${pendingTopics.length} pendente${pendingTopics.length !== 1 ? 's' : ''}`}
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

      {/* Secção: Pendentes (Atribuição) */}
      {pendingTopics.length > 0 && (
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
            Pendentes de atribuição
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            {pendingTopics.map(topic => {
              const badge = getStatusBadge(topic.status)
              const topicReviewers = reviewersByTopic[topic.id]
              const selectedReviewers = selected[topic.id] ?? []
              const isAssigning = assigningId === topic.id

              return (
                <div key={topic.id} className="card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)'
                }}>
                  {/* Cabeçalho do tópico */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)'
                  }}>
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
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '2px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--label-md)',
                        fontWeight: 'var(--font-medium)',
                        background: badge.bg,
                        color: badge.color
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: 'var(--radius-full)',
                          background: badge.dot
                        }} />
                        {topic.status_label || badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Área de revisores */}
                  {!topicReviewers ? (
                    <button
                      onClick={() => loadReviewers(topic.id)}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '10px var(--space-3)',
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-medium)',
                        fontFamily: 'var(--font-family)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        width: 'fit-content',
                        border: '1px solid var(--outline-variant)',
                        background: 'var(--surface-container-lowest)',
                        color: 'var(--primary)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--surface-container)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--surface-container-lowest)'
                        e.currentTarget.style.borderColor = 'var(--outline-variant)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                      Ver avaliadores elegíveis
                    </button>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3)',
                      background: 'var(--surface-container-low)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--outline-variant)'
                    }}>
                      <p style={{
                        fontSize: 'var(--label-md)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface-variant)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Avaliadores elegíveis ({topicReviewers.length})
                      </p>

                      {topicReviewers.length === 0 ? (
                        <p style={{
                          fontSize: 'var(--body-md)',
                          color: 'var(--on-surface-variant)',
                          fontStyle: 'italic'
                        }}>
                          Nenhum avaliador elegível encontrado.
                        </p>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: 'var(--space-1)'
                        }}>
                          {topicReviewers.map(reviewer => (
                            <label
                              key={reviewer.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                                padding: '10px var(--space-2)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                background: selectedReviewers.includes(reviewer.id)
                                  ? 'var(--primary-container)'
                                  : 'transparent',
                                color: selectedReviewers.includes(reviewer.id)
                                  ? 'var(--on-primary-container)'
                                  : 'var(--on-surface)',
                                fontSize: 'var(--body-md)',
                                fontFamily: 'var(--font-family)',
                                fontWeight: selectedReviewers.includes(reviewer.id)
                                  ? 'var(--font-medium)'
                                  : 'var(--font-regular)'
                              }}
                              onMouseEnter={e => {
                                if (!selectedReviewers.includes(reviewer.id)) {
                                  e.currentTarget.style.background = 'var(--surface-container-highest)'
                                }
                              }}
                              onMouseLeave={e => {
                                if (!selectedReviewers.includes(reviewer.id)) {
                                  e.currentTarget.style.background = 'transparent'
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedReviewers.includes(reviewer.id)}
                                onChange={() => toggleReviewer(topic.id, reviewer.id)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  accentColor: 'var(--primary)',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              />
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--on-surface-variant)' }}>
                                person
                              </span>
                              {reviewer.name}
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Botão atribuir */}
                      <button
                        onClick={() => assign(topic.id)}
                        disabled={selectedReviewers.length === 0 || isAssigning}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--space-1)',
                          padding: '12px var(--space-3)',
                          fontSize: 'var(--body-md)',
                          fontWeight: 'var(--font-semibold)',
                          fontFamily: 'var(--font-family)',
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          cursor: selectedReviewers.length === 0 || isAssigning ? 'not-allowed' : 'pointer',
                          opacity: selectedReviewers.length === 0 || isAssigning ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          marginTop: 'var(--space-2)',
                          width: 'fit-content'
                        }}
                      >
                        {isAssigning ? (
                          <>
                            <span style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid var(--on-primary)',
                              borderTopColor: 'transparent',
                              borderRadius: 'var(--radius-full)',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                            A atribuir...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
                            Atribuir {selectedReviewers.length} revisor{selectedReviewers.length !== 1 ? 'es' : ''}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Secção: Outros estados */}
      {otherTopics.length > 0 && (
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
            Outras submissões
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            {otherTopics.map(topic => {
              const badge = getStatusBadge(topic.status)
              return (
                <div key={topic.id} className="card" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)'
                }}>
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
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--label-md)',
                    fontWeight: 'var(--font-medium)',
                    background: badge.bg,
                    color: badge.color,
                    flexShrink: 0
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: badge.dot
                    }} />
                    {topic.status_label || badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {topics.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-6) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>
            assignment
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Nenhuma submissão encontrada
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Os protocolos submetidos aparecerão aqui para gestão.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}