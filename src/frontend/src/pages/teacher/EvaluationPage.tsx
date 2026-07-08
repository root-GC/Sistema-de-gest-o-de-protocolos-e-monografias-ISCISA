import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { topicService } from '../../services/topicService'
import '../../styles/global.css'

interface Comment {
  id: number
  content: string
  created_at: string
}

export default function EvaluationPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const id = Number(topicId)

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const { comments } = await topicService.getComments(id)
      setComments(comments)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await topicService.submitComment(id, newComment)
      setNewComment('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDecision() {
    if (!decision) return
    setSubmitting(true)
    try {
      await topicService.submitEvaluation(id, decision)
      setDecision('')
      await load()
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
            Comentários e decisão final • Revisão científica
          </p>
        </div>
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

      {/* Comentários */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)'
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
            Nenhum comentário ainda. Inicie a discussão abaixo.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {comments.map(comment => (
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
                  marginBottom: 'var(--space-1)'
                }}>
                  <span style={{
                    fontSize: 'var(--label-md)',
                    color: 'var(--on-surface-variant)',
                    fontWeight: 'var(--font-medium)'
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

      {/* Novo comentário */}
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

      {/* Decisão final */}
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        border: decision ? `2px solid var(--${decision === 'approved' ? 'primary' : 'secondary'})` : '1px solid var(--outline-variant)'
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
            Aprovar
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '12px var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            background: decision === 'rejected' ? 'var(--secondary-container)' : 'var(--surface-container-low)',
            color: decision === 'rejected' ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
            border: decision === 'rejected' ? '2px solid var(--secondary)' : '1px solid var(--outline-variant)',
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
              style={{ accentColor: 'var(--secondary)', cursor: 'pointer' }}
            />
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--secondary)' }}>cancel</span>
            Rejeitar
          </label>
        </div>

        <button
          onClick={submitDecision}
          disabled={!decision || submitting}
          className={decision === 'approved' ? 'btn btn-primary' : decision === 'rejected' ? 'btn btn-danger' : 'btn'}
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
            boxShadow: 'var(--elevation-1)'
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}