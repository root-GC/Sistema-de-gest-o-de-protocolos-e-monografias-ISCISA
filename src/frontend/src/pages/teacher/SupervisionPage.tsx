import { useEffect, useState } from 'react'
import { topicService, type Topic } from '../../services/topicService'
import '../../styles/global.css'

export default function SupervisionPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { topics } = await topicService.getForSupervisor()
      setTopics(topics)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: number) {
    setActingId(id)
    try {
      await topicService.approveBySupervisor(id)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

  async function reject(id: number) {
    const justification = window.prompt('Justificação da rejeição:')
    if (justification === null) return
    setActingId(id)
    try {
      await topicService.rejectBySupervisor(id, justification)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setActingId(null)
    }
  }

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

  const pending = topics.filter(t => t.status === 'topic_pending_supervisor')
  const processed = topics.filter(t => t.status !== 'topic_pending_supervisor')

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
            Validação de temas submetidos • {pending.length} pendente{pending.length !== 1 ? 's' : ''}
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
          {topics.length} aluno{topics.length !== 1 ? 's' : ''}
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

        {pending.length === 0 ? (
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            {pending.map(topic => (
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

                <div style={{
                  display: 'flex',
                  gap: 'var(--space-1)',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => approve(topic.id)}
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
                    onMouseEnter={e => {
                      if (actingId !== topic.id) {
                        e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                        e.currentTarget.style.transform = 'scale(0.97)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {actingId === topic.id ? (
                      <>
                        <span style={{
                          width: '14px',
                          height: '14px',
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
                    onClick={() => reject(topic.id)}
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
                    onMouseEnter={e => {
                      if (actingId !== topic.id) {
                        e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                        e.currentTarget.style.transform = 'scale(0.97)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'scale(1)'
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
      {processed.length > 0 && (
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

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}>
            {processed.map(topic => (
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
                  background: topic.status === 'topic_approved_supervisor' || topic.status === 'topic_approved_nucleo'
                    ? 'var(--primary-container)'
                    : 'var(--error-container)',
                  color: topic.status === 'topic_approved_supervisor' || topic.status === 'topic_approved_nucleo'
                    ? 'var(--on-primary-container)'
                    : 'var(--on-error-container)',
                  flexShrink: 0
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    background: topic.status === 'topic_approved_supervisor' || topic.status === 'topic_approved_nucleo'
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}