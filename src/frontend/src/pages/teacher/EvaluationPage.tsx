import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { topicService } from '../../services/topicService'
import '../../styles/global.css'

interface TopicInfo {
  id: number
  title: string
  status: string
  status_label: string
}

interface Comment {
  id: number
  content: string
  created_at: string
  user?: {
    id: number
    name: string
  }
}

export default function EvaluationPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const id = Number(topicId)

  const [topic, setTopic] = useState<TopicInfo | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [evaluationDone, setEvaluationDone] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      // Carrega os dados do tema (precisa adicionar este endpoint)
      const topicsData = await topicService.listForReviewer()
      const currentTopic = topicsData.topics.find(t => t.id === id)
      
      if (currentTopic) {
        setTopic(currentTopic)
        
        // Verifica se o tema já foi aprovado/rejeitado
        if (currentTopic.status === 'topic_approved_nucleo' || 
            currentTopic.status === 'topic_rejected_nucleo' ||
            currentTopic.status === 'topic_rejected') {
          setEvaluationDone(true)
          setSuccess('Este tema já foi avaliado e o processo de revisão está concluído.')
        }
      }

      // Carrega comentários
      const response = await topicService.getComments(id)
      // A API retorna { success: true, data: [...] }
      setComments(response.data || response.comments || [])
      
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || evaluationDone) return
    setSubmitting(true)
    setError(null)
    try {
      await topicService.submitComment(id, newComment)
      setNewComment('')
      setSuccess('Comentário adicionado com sucesso!')
      await load()
      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDecision() {
    if (!decision || evaluationDone) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await topicService.submitEvaluation(id, decision)
      setDecision('')
      setSuccess(`Tema ${decision === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
      setEvaluationDone(true)
      await load()
      
      // Redireciona para a lista após 2 segundos
      setTimeout(() => {
        navigate('/reviews')
      }, 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
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
        fontSize: 'var(--body-lg)',
        color: 'var(--on-surface-variant)'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Link
              to="/reviews"
              style={{
                color: 'var(--on-surface-variant)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            </Link>
            <h1 style={{
              fontSize: 'var(--headline-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--on-surface)',
              fontFamily: 'var(--font-family)'
            }}>
              Avaliação do tema #{id}
            </h1>
          </div>
          <p style={{
            fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-family)'
          }}>
            {topic?.title || 'Carregando...'} • Revisão científica
          </p>
          {topic?.status_label && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: 'var(--space-1)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-sm)',
              fontWeight: 'var(--font-medium)',
              background: topic.status === 'topic_approved_nucleo' 
                ? 'var(--primary-container)' 
                : topic.status === 'topic_rejected_nucleo'
                  ? 'var(--error-container)'
                  : 'var(--surface-container)',
              color: topic.status === 'topic_approved_nucleo'
                ? 'var(--on-primary-container)'
                : topic.status === 'topic_rejected_nucleo'
                  ? 'var(--on-error-container)'
                  : 'var(--on-surface-variant)'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: 'var(--radius-full)',
                background: topic.status === 'topic_approved_nucleo'
                  ? 'var(--primary)'
                  : topic.status === 'topic_rejected_nucleo'
                    ? 'var(--error)'
                    : 'var(--outline)'
              }} />
              {topic.status_label}
            </span>
          )}
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {success && (
        <div role="status" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: evaluationDone && topic?.status === 'topic_approved_nucleo'
            ? 'var(--primary-container)'
            : evaluationDone && topic?.status === 'topic_rejected_nucleo'
              ? 'var(--error-container)'
              : 'var(--tertiary-container)',
          color: evaluationDone && topic?.status === 'topic_approved_nucleo'
            ? 'var(--on-primary-container)'
            : evaluationDone && topic?.status === 'topic_rejected_nucleo'
              ? 'var(--on-error-container)'
              : 'var(--on-tertiary-container)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          fontFamily: 'var(--font-family)',
          border: '1px solid var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {evaluationDone ? 'info' : 'check_circle'}
          </span>
          {success}
        </div>
      )}

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

      {/* Aviso de avaliação concluída */}
      {evaluationDone && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-xl)',
          border: '2px solid var(--outline-variant)',
          fontSize: 'var(--body-md)',
          color: 'var(--on-surface-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>
            task_alt
          </span>
          <div>
            <strong style={{ fontSize: 'var(--body-lg)', color: 'var(--on-surface)' }}>
              Processo de avaliação concluído
            </strong>
            <p style={{ marginTop: '4px' }}>
              {topic?.status === 'topic_approved_nucleo'
                ? 'Este tema foi aprovado pelo Núcleo Científico.'
                : 'Este tema foi rejeitado pelo Núcleo Científico.'}
              {' '}Não são permitidas novas avaliações ou comentários.
            </p>
          </div>
        </div>
      )}

      {/* Comentários */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        opacity: evaluationDone ? 0.8 : 1
      }}>
        <h2 style={{
          fontSize: 'var(--title-md)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)',
          fontFamily: 'var(--font-family)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chat</span>
          Comentários ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-4) var(--space-3)',
            color: 'var(--on-surface-variant)',
            background: 'var(--surface-container-low)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--outline-variant)',
            fontSize: 'var(--body-md)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>
              forum
            </span>
            Nenhum comentário ainda.
            {!evaluationDone && ' Inicie a discussão abaixo.'}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {comments.map((comment: Comment) => (
              <div
                key={comment.id}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  fontSize: 'var(--body-md)',
                  color: 'var(--on-surface)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-1)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-1)'
                }}>
                  <span style={{
                    fontSize: 'var(--label-sm)',
                    color: 'var(--on-surface-variant)',
                    fontWeight: 'var(--font-medium)',
                    background: 'var(--surface-container)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {comment.user?.name || 'Anônimo'}
                  </span>
                  <span style={{
                    fontSize: 'var(--label-sm)',
                    color: 'var(--on-surface-variant)'
                  }}>
                    {new Date(comment.created_at).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Novo comentário - Só mostra se não estiver concluído */}
      {!evaluationDone && (
        <form
          onSubmit={addComment}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)'
          }}
        >
          <label
            htmlFor="comment"
            style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)',
              fontFamily: 'var(--font-family)'
            }}
          >
            Adicionar comentário
          </label>
          <textarea
            id="comment"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Escreva o seu comentário técnico-científico..."
            minLength={3}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px var(--space-2)',
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--body-md)',
              fontFamily: 'var(--font-family)',
              color: 'var(--on-surface)',
              outline: 'none',
              resize: 'vertical',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--primary)'
              e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--outline-variant)'
              e.target.style.boxShadow = 'none'
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !newComment.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              padding: '10px var(--space-3)',
              fontSize: 'var(--body-md)',
              fontWeight: 'var(--font-semibold)',
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !newComment.trim() ? 0.6 : 1,
              transition: 'all 0.2s ease',
              width: 'fit-content'
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--on-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: 'var(--radius-full)',
                  animation: 'spin 0.8s linear infinite'
                }} />
                A enviar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                Comentar
              </>
            )}
          </button>
        </form>
      )}

      {/* Decisão final - Só mostra se não estiver concluído */}
      {!evaluationDone && (
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          border: decision ? `2px solid var(--${decision === 'approved' ? 'primary' : 'error'})` : '1px solid var(--outline-variant)'
        }}>
          <h2 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            fontFamily: 'var(--font-family)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>gavel</span>
            Decisão final
          </h2>

          <div style={{
            display: 'flex',
            gap: 'var(--space-3)',
            flexWrap: 'wrap'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: '12px var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              background: decision === 'approved' ? 'var(--primary-container)' : 'var(--surface-container-low)',
              color: decision === 'approved' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
              border: decision === 'approved' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
              fontSize: 'var(--body-md)',
              fontWeight: 'var(--font-medium)',
              fontFamily: 'var(--font-family)',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="decision"
                checked={decision === 'approved'}
                onChange={() => setDecision('approved')}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>check_circle</span>
              Aprovado
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: '12px var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              background: decision === 'rejected' ? 'var(--error-container)' : 'var(--surface-container-low)',
              color: decision === 'rejected' ? 'var(--on-error-container)' : 'var(--on-surface-variant)',
              border: decision === 'rejected' ? '2px solid var(--error)' : '1px solid var(--outline-variant)',
              fontSize: 'var(--body-md)',
              fontWeight: 'var(--font-medium)',
              fontFamily: 'var(--font-family)',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="decision"
                checked={decision === 'rejected'}
                onChange={() => setDecision('rejected')}
                style={{ accentColor: 'var(--error)', cursor: 'pointer' }}
              />
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--error)' }}>cancel</span>
              Não Aprovado
            </label>
          </div>

          <button
            onClick={submitDecision}
            disabled={!decision || submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              padding: '14px var(--space-4)',
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-bold)',
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: !decision || submitting ? 'not-allowed' : 'pointer',
              opacity: !decision || submitting ? 0.6 : 1,
              transition: 'all 0.2s ease',
              width: '100%',
              boxShadow: 'var(--elevation-1)',
              background: decision === 'approved' 
                ? 'var(--primary)' 
                : decision === 'rejected' 
                  ? 'var(--error)' 
                  : 'var(--outline)',
              color: 'var(--on-primary)'
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid var(--on-primary)',
                  borderTopColor: 'transparent',
                  borderRadius: 'var(--radius-full)',
                  animation: 'spin 0.8s linear infinite'
                }} />
                A processar...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>gavel</span>
                Confirmar decisão
              </>
            )}
          </button>
        </div>
      )}

      {/* Botão de voltar quando avaliação concluída */}
      {evaluationDone && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
          <Link
            to="/reviews"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              padding: '12px var(--space-4)',
              fontSize: 'var(--body-md)',
              fontWeight: 'var(--font-semibold)',
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              background: 'var(--surface-container)',
              color: 'var(--on-surface)',
              border: '1px solid var(--outline-variant)',
              transition: 'all 0.2s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            Voltar para lista de temas
          </Link>
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