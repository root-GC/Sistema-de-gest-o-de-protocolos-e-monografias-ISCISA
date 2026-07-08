import { useEffect, useState } from 'react'
import { protocolService, type Protocol } from '../../services/protocolService'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    active:  { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Ativo' },
    replaced:{ bg: 'var(--surface-container-highest)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: 'Substituído' },
    deleted: { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Removido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getProtocolStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    protocol_submitted:           { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
    protocol_pending_supervisor:  { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)' },
    protocol_approved_supervisor: { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)' },
    protocol_in_review:           { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
    protocol_approved_nucleo:     { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)' },
    protocol_rejected_nucleo:     { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)' },
    protocol_resubmitted:         { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' }
}

// ============================================================
// COMPONENTE
// ============================================================
export default function DocumentsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    protocolService.list()
      .then(({ protocols }) => setProtocols(protocols))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalDocs = protocols.reduce((sum, p) => sum + (p.documents?.length || 0), 0)

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Documentos
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Todos os documentos submetidos nos seus protocolos.
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>folder</span>
          {totalDocs} documento{totalDocs !== 1 ? 's' : ''}
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
      {protocols.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-6) var(--space-3)',
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
            folder_open
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Nenhum documento encontrado
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Submeta o seu primeiro protocolo para ver os documentos aqui.
          </p>
        </div>
      )}

      {/* Lista de protocolos com documentos */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        {protocols.map(p => {
          const ps = getProtocolStatusStyle(p.status)
          const docs = p.documents || []

          return (
            <div key={p.id} className="card" style={{
              padding: '0',
              overflow: 'hidden'
            }}>
              {/* Cabeçalho do protocolo */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                borderBottom: docs.length > 0 ? '1px solid var(--surface-variant)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <h3 style={{
                    fontSize: 'var(--body-lg)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--on-surface)'
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
                    background: ps.bg,
                    color: ps.color,
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      width: '6px', height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: ps.dot
                    }} />
                    {p.status_label}
                  </span>
                </div>
                <span style={{
                  fontSize: 'var(--label-md)',
                  color: 'var(--on-surface-variant)',
                  fontWeight: 'var(--font-medium)'
                }}>
                  {docs.length} documento{docs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tabela de documentos */}
              {docs.length > 0 && (
                <div style={{ overflow: 'auto' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 'var(--space-2) var(--space-4)' }}>Ficheiro</th>
                        <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'center' }}>Versão</th>
                        <th style={{ padding: 'var(--space-2) var(--space-4)' }}>Estado</th>
                        <th style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right' }}>Submetido em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map(doc => {
                        const ds = getStatusStyle(doc.status)
                        return (
                          <tr key={doc.id}>
                            <td style={{ padding: 'var(--space-2) var(--space-4)' }}>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-1)',
                                  color: 'var(--primary)',
                                  textDecoration: 'none',
                                  fontWeight: 'var(--font-medium)',
                                  fontSize: 'var(--body-md)',
                                  transition: 'color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--on-primary-fixed-variant)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--primary)'}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                  description
                                </span>
                                {doc.file_name}
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                  open_in_new
                                </span>
                              </a>
                            </td>
                            <td style={{
                              padding: 'var(--space-2) var(--space-4)',
                              textAlign: 'center',
                              fontSize: 'var(--body-md)',
                              fontWeight: 'var(--font-medium)',
                              color: 'var(--on-surface)'
                            }}>
                              v{doc.version}
                            </td>
                            <td style={{ padding: 'var(--space-2) var(--space-4)' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--label-md)',
                                fontWeight: 'var(--font-medium)',
                                background: ds.bg,
                                color: ds.color,
                                whiteSpace: 'nowrap'
                              }}>
                                <span style={{
                                  width: '5px', height: '5px',
                                  borderRadius: 'var(--radius-full)',
                                  background: ds.dot
                                }} />
                                {ds.label}
                              </span>
                            </td>
                            <td style={{
                              padding: 'var(--space-2) var(--space-4)',
                              textAlign: 'right',
                              fontSize: 'var(--body-md)',
                              color: 'var(--on-surface-variant)',
                              whiteSpace: 'nowrap'
                            }}>
                              {new Date(doc.submitted_at).toLocaleDateString('pt-PT', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sem documentos */}
              {docs.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-4) var(--space-3)',
                  color: 'var(--on-surface-variant)',
                  fontSize: 'var(--body-md)'
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '24px',
                    marginBottom: 'var(--space-1)',
                    display: 'block'
                  }}>
                    folder_off
                  </span>
                  Nenhum documento anexado a este protocolo.
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