// src/pages/supervisor/SupervisorProtocolDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { protocolService, type Protocol, type Document } from '../../services/protocolService'
import '../../styles/global.css'

export default function SupervisorProtocolDetailPage() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (protocolId) load()
  }, [protocolId])

  async function load() {
    setLoading(true)
    try {
      const data = await protocolService.getById(Number(protocolId))
      setProtocol(data.protocol)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)'
      }}>
        <span style={{
          width: '24px', height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite',
          marginRight: 'var(--space-2)'
        }} />
        A carregar protocolo...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!protocol) {
    return <div>Protocolo não encontrado.</div>
  }

  const activeDocs = protocol.documents?.filter(d => d.status === 'active') || []
  const isPending = protocol.status === 'protocol_pending_supervisor' || protocol.status === 'protocol_submitted'

  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)'
    }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/supervisor" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          color: 'var(--on-surface-variant)',
          textDecoration: 'none',
          fontSize: 'var(--body-md)',
          marginBottom: 'var(--space-2)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          Voltar
        </Link>
        <h1 style={{
          fontSize: 'var(--headline-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)'
        }}>
          Protocolo {protocol.code}
        </h1>
        {protocol.topic && (
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            Tema: {protocol.topic.title}
          </p>
        )}
        {protocol.student && (
          <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>
            Estudante: {protocol.student.name} ({protocol.student.email})
          </p>
        )}
        <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>
          Submissão nº{protocol.submission_number} • Versão {protocol.version}
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

      {/* Status */}
      <div className="card" style={{
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        background: isPending ? 'var(--tertiary-container)' : 'var(--surface-container)',
        border: isPending ? '1px solid var(--tertiary)' : '1px solid var(--outline-variant)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--tertiary)' }}>
          {isPending ? 'hourglass_top' : 'task_alt'}
        </span>
        <div>
          <strong style={{ fontSize: 'var(--body-lg)' }}>
            {isPending ? 'Aguardando sua revisão' : 'Já revisado'}
          </strong>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            {protocol.status_label || protocol.status}
          </p>
        </div>
      </div>

      {/* Documentos */}
      <div className="card" style={{
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-4)'
      }}>
        <h2 style={{
          fontSize: 'var(--title-md)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--on-surface)',
          marginBottom: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
          Documentos
        </h2>

        {activeDocs.length === 0 ? (
          <p style={{ color: 'var(--on-surface-variant)' }}>Nenhum documento disponível.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {activeDocs.map((doc: Document) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '12px var(--space-3)',
                  background: 'var(--surface-container-low)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  fontSize: 'var(--body-md)',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 'var(--font-medium)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--primary-container)'
                  e.currentTarget.style.color = 'var(--on-primary-container)'
                  e.currentTarget.style.borderColor = 'var(--primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--surface-container-low)'
                  e.currentTarget.style.color = 'var(--primary)'
                  e.currentTarget.style.borderColor = 'var(--outline-variant)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
                <div>
                  <p style={{ fontWeight: 'var(--font-semibold)' }}>{doc.file_name}</p>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    Versão {doc.version}
                  </p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Botões de ação (apenas para pendentes) */}
      {isPending && (
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await protocolService.approveBySupervisor(protocol.id)
                alert('Protocolo aprovado com sucesso!')
                load()
              } catch (e) {
                alert((e as Error).message)
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              padding: '14px var(--space-4)',
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-semibold)',
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              minWidth: '200px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
            Aprovar protocolo
          </button>

          <button
            className="btn btn-danger"
            onClick={async () => {
              const justification = prompt('Justificação da rejeição (opcional):')
              try {
                await protocolService.rejectBySupervisor(protocol.id, justification || undefined)
                alert('Protocolo rejeitado.')
                load()
              } catch (e) {
                alert((e as Error).message)
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              padding: '14px var(--space-4)',
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-semibold)',
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--error)',
              color: 'var(--on-error)',
              minWidth: '200px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>cancel</span>
            Rejeitar / Devolver
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}