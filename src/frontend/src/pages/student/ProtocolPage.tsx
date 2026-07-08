import { useEffect, useState } from 'react'
import { protocolService, type Protocol } from '../../services/protocolService'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    protocol_approved_supervisor:{ bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado (Supervisor)' },
    protocol_rejected_supervisor:{ bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Supervisor)' },
    protocol_in_review:          { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_approved_nucleo:    { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    protocol_rejected_nucleo:    { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
    protocol_resubmitted:        { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================================
// COMPONENTE
// ============================================================
export default function ProtocolPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [topicId, setTopicId] = useState('')
  const [protocolType, setProtocolType] = useState('protocol')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { protocols } = await protocolService.list()
      setProtocols(protocols)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const current = protocols[0]
  const canSubmitNew = !current || current.status === 'protocol_rejected_supervisor'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError(null)
    try {
      await protocolService.submit(Number(topicId), protocolType, file)
      setFile(null)
      setTopicId('')
      await load()
    } catch (err) {
      const e = err as Error & { status?: number }
      if (e.status === 409) {
        setError('Já existe um protocolo activo para este tema.')
      } else {
        setError(e.message)
      }
    } finally {
      setSubmitting(false)
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
            O meu protocolo
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Submeta e acompanhe o seu protocolo de investigação.
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
          {protocols.length} protocolo{protocols.length !== 1 ? 's' : ''}
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

      {/* Lista de protocolos */}
      {protocols.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)'
        }}>
          {protocols.map(p => {
            const s = getStatusStyle(p.status)
            const activeDocs = p.documents?.filter(d => d.status === 'active') || []

            return (
              <div key={p.id} className="card" style={{
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)'
              }}>
                {/* Cabeçalho do protocolo */}
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
                      marginBottom: '6px',
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{
                        fontSize: 'var(--body-lg)',
                        fontWeight: 'var(--font-bold)',
                        color: 'var(--on-surface)',
                        fontFamily: 'var(--font-family)'
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
                        background: s.bg,
                        color: s.color,
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          width: '6px', height: '6px',
                          borderRadius: 'var(--radius-full)',
                          background: s.dot
                        }} />
                        {p.status_label || s.label}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 'var(--label-md)',
                      color: 'var(--on-surface-variant)'
                    }}>
                      Submissão nº{p.submission_number} • Versão {p.version}
                    </p>
                  </div>
                </div>

                {/* Justificação (se existir) */}
                {p.justification && (
                  <div style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-1)'
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '18px',
                      color: 'var(--tertiary)',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      info
                    </span>
                    <span>{p.justification}</span>
                  </div>
                )}

                {/* Documentos anexos */}
                {activeDocs.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)'
                  }}>
                    <p style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Documentos anexos
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-1)'
                    }}>
                      {activeDocs.map(doc => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                            padding: '8px var(--space-2)',
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
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                          {doc.file_name}
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Estado vazio */}
      {protocols.length === 0 && canSubmitNew && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-5) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '48px',
            marginBottom: 'var(--space-2)',
            display: 'block'
          }}>
            description
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Nenhum protocolo submetido
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Submeta o seu primeiro protocolo abaixo.
          </p>
        </div>
      )}

      {/* Formulário de submissão */}
      {canSubmitNew ? (
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)'
          }}
        >
          <h2 style={{
            fontSize: 'var(--title-md)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Submeter novo protocolo
          </h2>

          {/* ID do tema */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="topicId" style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)'
            }}>
              ID do tema aprovado
            </label>
            <input
              id="topicId"
              type="number"
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              placeholder="Ex: 42"
              required
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
          </div>

          {/* Grid: Tipo + Ficheiro */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)'
          }}>
            {/* Tipo de protocolo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="protocolType" style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)'
              }}>
                Tipo
              </label>
              <select
                id="protocolType"
                value={protocolType}
                onChange={e => setProtocolType(e.target.value)}
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  backgroundImage: 'none'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--primary)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--outline-variant)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="protocol">Protocolo</option>
              </select>
            </div>

            {/* Upload de ficheiro */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="file" style={{
                fontSize: 'var(--label-md)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--on-surface-variant)'
              }}>
                Documento (.docx)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="file"
                  type="file"
                  accept=".docx"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                  required
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: '12px var(--space-2)',
                  background: 'var(--surface-container-lowest)',
                  border: '1px dashed var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--body-md)',
                  color: file ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'rgba(0,105,51,0.02)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--outline-variant)'
                  e.currentTarget.style.background = 'var(--surface-container-lowest)'
                }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                    {file ? 'check_circle' : 'upload'}
                  </span>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {file ? `${file.name} (${formatFileSize(file.size)})` : 'Selecionar ficheiro...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !file}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              padding: '14px var(--space-3)',
              fontSize: 'var(--body-lg)',
              fontWeight: 'var(--font-semibold)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: submitting || !file ? 'not-allowed' : 'pointer',
              opacity: submitting || !file ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: 'var(--elevation-1)',
              marginTop: 'var(--space-1)'
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  width: '18px', height: '18px',
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
                Submeter protocolo
              </>
            )}
          </button>
        </form>
      ) : (
        /* Mensagem de bloqueio */
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface-variant)',
          fontSize: 'var(--body-md)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '24px',
            color: 'var(--tertiary)',
            flexShrink: 0
          }}>
            info
          </span>
          <p>
            O teu protocolo está em curso ({current?.status_label}). Não podes submeter uma nova versão agora.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}