import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { topicService, type Topic } from '../../services/topicService'
import '../../styles/global.css'

function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic_pending_nucleo:   { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Pendente' },
    topic_approved_nucleo:  { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    topic_rejected_nucleo:  { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

export default function ReviewsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    topicService.listForReviewer()
      .then(({ topics }) => setTopics(topics))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

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

  const assigned = topics.filter(t => t.status !== 'topic_approved_nucleo' && t.status !== 'topic_rejected_nucleo')
  const done = topics.filter(t => t.status === 'topic_approved_nucleo' || t.status === 'topic_rejected_nucleo')

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
          Temas atribuídos para avaliação • {assigned.length} pendente{assigned.length !== 1 ? 's' : ''} • {done.length} concluído{done.length !== 1 ? 's' : ''}
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

        {assigned.length === 0 ? (
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
            {assigned.map(topic => {
              const s = getStatusStyle(topic.status)
              return (
                <Link
                  key={topic.id}
                  to={`/reviews/${topic.id}`}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3) var(--space-4)',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'var(--elevation-0)'
                    e.currentTarget.style.borderColor = 'var(--surface-container-high)'
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
      {done.length > 0 && (
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
            {done.map(topic => {
              const s = getStatusStyle(topic.status)
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}