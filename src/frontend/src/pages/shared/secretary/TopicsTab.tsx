import { useEffect, useState } from 'react'
import { topicService, type Topic } from '../../../services/topicService'
import { TopicJustificationToggle } from '../../../components/TopicJustification'
import '../../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    topic_pending_nucleo:     { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',     dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    topic_approved_nucleo:    { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    topic_rejected:           { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTE
// ============================================================
export function TopicsTab() {
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
      setSelected(prev => { const n = { ...prev }; delete n[topicId]; return n })
      setReviewersByTopic(prev => { const n = { ...prev }; delete n[topicId]; return n })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAssigningId(null)
    }
  }

  const pendingCount = topics.filter(t => t.status === 'topic_pending_nucleo').length

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40vh',
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
        A carregar temas...
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

      {/* Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lightbulb</span>
          {topics.length} tema{topics.length !== 1 ? 's' : ''}
          {pendingCount > 0 && ` • ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
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

      {/* Estado vazio */}
      {topics.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-5) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '48px',
            marginBottom: 'var(--space-2)',
            display: 'block'
          }}>
            lightbulb
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Sem temas pendentes no núcleo
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Os temas submetidos aparecerão aqui para atribuição de avaliadores.
          </p>
        </div>
      )}

      {/* Lista de temas */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }}>
        {topics.map(t => {
          const s = getStatusStyle(t.status)
          const topicReviewers = reviewersByTopic[t.id]
          const selectedReviewers = selected[t.id] ?? []
          const isPending = t.status === 'topic_pending_nucleo'
          const isAssigning = assigningId === t.id

          return (
            <div key={t.id} className="card" style={{
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              {/* Cabeçalho */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.title}
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
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      width: '6px', height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: s.dot
                    }} />
                    {t.status_label || s.label}
                  </span>
                </div>
              </div>

              <TopicJustificationToggle justification={t.justification} showEmpty compact />

              {/* Área de atribuição (apenas pendentes no núcleo) */}
              {isPending && (
                <div style={{
                  padding: 'var(--space-3)',
                  background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)'
                }}>
                  {!topicReviewers ? (
                    <button
                      onClick={() => loadReviewers(t.id)}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '10px var(--space-3)',
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-medium)',
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
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <p style={{
                          fontSize: 'var(--label-md)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--on-surface-variant)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Avaliadores elegíveis ({topicReviewers.length})
                        </p>
                        {selectedReviewers.length > 0 && (
                          <span style={{
                            fontSize: 'var(--label-md)',
                            fontWeight: 'var(--font-medium)',
                            color: 'var(--primary)',
                            background: 'var(--primary-container)',
                            padding: '2px 10px',
                            borderRadius: 'var(--radius-full)'
                          }}>
                            {selectedReviewers.length} selecionado{selectedReviewers.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {topicReviewers.length === 0 ? (
                        <p style={{
                          fontSize: 'var(--body-md)',
                          color: 'var(--on-surface-variant)',
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: 'var(--space-2)'
                        }}>
                          Nenhum avaliador elegível encontrado.
                        </p>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                          gap: 'var(--space-1)'
                        }}>
                          {topicReviewers.map(reviewer => {
                            const isChecked = selectedReviewers.includes(reviewer.id)
                            return (
                              <label
                                key={reviewer.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-1)',
                                  padding: '10px var(--space-2)',
                                  borderRadius: 'var(--radius-md)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: isChecked ? 'var(--primary-container)' : 'transparent',
                                  color: isChecked ? 'var(--on-primary-container)' : 'var(--on-surface)',
                                  fontSize: 'var(--body-md)',
                                  fontWeight: isChecked ? 'var(--font-medium)' : 'var(--font-regular)',
                                  border: isChecked ? '1px solid var(--primary)' : '1px solid transparent'
                                }}
                                onMouseEnter={e => {
                                  if (!isChecked) {
                                    e.currentTarget.style.background = 'var(--surface-container-highest)'
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!isChecked) {
                                    e.currentTarget.style.background = 'transparent'
                                  }
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleReviewer(t.id, reviewer.id)}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    accentColor: 'var(--primary)',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                  }}
                                />
                                <span className="material-symbols-outlined" style={{
                                  fontSize: '18px',
                                  color: isChecked ? 'var(--primary)' : 'var(--on-surface-variant)'
                                }}>
                                  person
                                </span>
                                {reviewer.name}
                              </label>
                            )
                          })}
                        </div>
                      )}

                      {/* Botão atribuir */}
                      <button
                        onClick={() => assign(t.id)}
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
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          cursor: selectedReviewers.length === 0 || isAssigning ? 'not-allowed' : 'pointer',
                          opacity: selectedReviewers.length === 0 || isAssigning ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          width: 'fit-content',
                          marginTop: 'var(--space-1)'
                        }}
                      >
                        {isAssigning ? (
                          <>
                            <span style={{
                              width: '16px', height: '16px',
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
                            Atribuir {selectedReviewers.length} avaliador{selectedReviewers.length !== 1 ? 'es' : ''}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
