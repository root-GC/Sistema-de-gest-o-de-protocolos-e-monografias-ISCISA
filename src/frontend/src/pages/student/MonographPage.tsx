// src/pages/MonographPage.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { monographService, type Monograph, type MonographOpinion } from '../../services/monographService'
import PdfPreviewModal from '../../components/PdfPreviewModal'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    monograph_submitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Submetida' },
    monograph_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    monograph_approved_supervisor: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovada (Supervisor)' },
    monograph_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitada (Supervisor)' },
    monograph_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em Revisão' },
    monograph_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovada' },
    monograph_rejected_nucleo: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitada (Núcleo)' },
    monograph_rejected_cc: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitada (CC)' },
    monograph_rejected_bioetica: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitada (Bioética)' },
    monograph_resubmitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Re-submetida' },
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
export default function MonographPage() {
  const { user } = useAuth()
  
  const [monographs, setMonographs] = useState<Monograph[]>([])
  const [opinionsByMonograph, setOpinionsByMonograph] = useState<Record<number, MonographOpinion[]>>({})
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string; filename: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const { monographs } = await monographService.list()
      setMonographs(monographs)

      const opinionEntries = await Promise.all(
        monographs.map(async monograph => {
          try {
            const { opinions } = await monographService.listOpinions(monograph.id)
            return [monograph.id, opinions] as const
          } catch {
            return [monograph.id, []] as const
          }
        })
      )

      setOpinionsByMonograph(Object.fromEntries(opinionEntries))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const current = monographs[0]
  const canSubmitNew = !current || [
    'monograph_rejected_supervisor',
    'monograph_rejected_nucleo',
    'monograph_rejected_cc',
    'monograph_rejected_bioetica',
  ].includes(current.status)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo - apenas .docx
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      if (!validTypes.includes(file.type)) {
        setError('Formato de arquivo não suportado. Use apenas .docx')
        return
      }
      
      if (file.size > 20 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 20MB')
        return
      }
      
      setFile(file)
      setError(null)
    }
  }

  function removeFile() {
    setFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await monographService.submit(file)
      setFile(null)
      setSuccess('Monografia submetida com sucesso!')
      await load()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const e = err as Error & { status?: number }
      if (e.status === 409) {
        setError('Já existe uma monografia activa.')
      } else {
        setError(e.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function openFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try {
      await monographService.openFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function downloadFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try {
      await monographService.downloadFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function previewPdf(url: string | null | undefined, title: string, filename: string) {
    if (!url) return
    setPdfPreview({ url, title, filename })
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
            A minha monografia
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Submeta e acompanhe a sua monografia científica.
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
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>book</span>
          {monographs.length} monografia{monographs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mensagem de sucesso */}
      {success && (
        <div role="status" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--primary-container)',
          color: 'var(--on-primary-container)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
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
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Lista de monografias */}
      {monographs.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)'
        }}>
          {monographs.map(m => {
            const s = getStatusStyle(m.status)
            const activeDocs = m.documents?.filter(d => d.status === 'active') || []
            const opinions = opinionsByMonograph[m.id] || []

            return (
              <div key={m.id} className="card" style={{
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)'
              }}>
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
                        {m.code}
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
                        {m.status_label || s.label}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 'var(--label-md)',
                      color: 'var(--on-surface-variant)'
                    }}>
                      Submissão nº{m.submission_number} • Versão {m.version}
                    </p>
                    {m.title && (
                      <p style={{
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--on-surface)',
                        marginTop: '8px'
                      }}>
                        {m.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Documentos */}
                {activeDocs.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)'
                  }}>
                    <p style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)'
                    }}>
                      Documentos anexos
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)'
                    }}>
                      {activeDocs.map(doc => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: '12px var(--space-3)',
                            background: 'var(--surface-container-low)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--outline-variant)',
                            fontSize: 'var(--body-md)',
                            color: 'var(--on-surface)',
                            fontWeight: 'var(--font-medium)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>description</span>
                          <div style={{ flex: 1 }}>
                            <button
                              type="button"
                              onClick={() => downloadFile(doc.download_url, doc.file_name)}
                              disabled={!doc.download_url}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                color: 'var(--primary)',
                                textAlign: 'left',
                                fontSize: 'var(--body-md)',
                                fontWeight: 'var(--font-semibold)',
                                cursor: doc.download_url ? 'pointer' : 'not-allowed',
                                textDecoration: 'underline',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                            </button>
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                              Versão {doc.version}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <button
                              type="button"
                              onClick={() => openFile(doc.download_url, doc.file_name)}
                              disabled={!doc.download_url}
                              className="btn"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px var(--space-2)',
                                fontSize: 'var(--label-sm)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--outline-variant)',
                                cursor: doc.download_url ? 'pointer' : 'not-allowed',
                                fontWeight: 'var(--font-medium)'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                              Ver
                            </button>
                            {doc.download_url && (
                              <button
                                type="button"
                                onClick={() => downloadFile(doc.download_url, doc.file_name)}
                                className="btn btn-primary"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px var(--space-2)',
                                  fontSize: 'var(--label-sm)',
                                  borderRadius: 'var(--radius-md)',
                                  cursor: 'pointer',
                                  fontWeight: 'var(--font-medium)'
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                                Baixar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pareceres */}
                {opinions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)'
                  }}>
                    <p style={{
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--on-surface-variant)'
                    }}>
                      Pareceres e fichas
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      {opinions.map(opinion => (
                        <div
                          key={opinion.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 'var(--space-2)',
                            padding: '10px var(--space-3)',
                            background: 'var(--surface-container-low)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--outline-variant)',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>
                              {opinion.organ} • {opinion.decision === 'approved' ? 'Aprovado' : 'Reprovado'}
                            </p>
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                              Versão {opinion.version}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            {opinion.download_url && (
                              <button type="button" onClick={() => previewPdf(opinion.download_url, `Parecer ${m.code}`, `parecer-${m.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                                Ver Parecer
                              </button>
                            )}
                            {opinion.download_url && (
                              <button type="button" onClick={() => downloadFile(opinion.download_url, `parecer-${m.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                                Baixar Parecer
                              </button>
                            )}
                            {opinion.evaluation_form_download_url && (
                              <button type="button" onClick={() => previewPdf(opinion.evaluation_form_download_url, `Ficha de Avaliação ${m.code}`, `ficha-${m.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                                Ver Ficha
                              </button>
                            )}
                            {opinion.evaluation_form_download_url && (
                              <button type="button" onClick={() => downloadFile(opinion.evaluation_form_download_url, `ficha-${m.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>
                                Baixar Ficha
                              </button>
                            )}
                          </div>
                        </div>
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
      {monographs.length === 0 && canSubmitNew && (
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
            book
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Nenhuma monografia submetida
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Submeta a sua monografia no formulário abaixo.
          </p>
        </div>
      )}

      {/* Formulário de submissão */}
      {canSubmitNew && (
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
            Submeter nova monografia
          </h2>

          {/* Campo: Upload de Documento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={{
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--on-surface-variant)'
            }}>
              Documento (.docx)
            </label>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              margin: '0 0 8px 0'
            }}>
              Anexe a sua monografia em formato .docx (máx. 20MB)
            </p>

            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                required
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              />
              {!file ? (
                <div style={{
                  border: '2px dashed var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  background: 'var(--surface-container-lowest)',
                  transition: 'all 0.2s ease'
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
                  <span className="material-symbols-outlined" style={{
                    fontSize: '48px',
                    color: 'var(--outline)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}>
                    cloud_upload
                  </span>
                  <p style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)',
                    fontWeight: 'var(--font-medium)'
                  }}>
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p style={{
                    fontSize: 'var(--label-md)',
                    color: 'var(--outline)',
                    marginTop: '4px'
                  }}>
                    Formato aceite: .docx
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px var(--space-3)',
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--outline-variant)',
                  gap: 'var(--space-3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '24px',
                      color: 'var(--primary)',
                      flexShrink: 0
                    }}>
                      check_circle
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0
                      }}>
                        {file.name}
                      </p>
                      <p style={{
                        fontSize: 'var(--label-sm)',
                        color: 'var(--on-surface-variant)',
                        margin: '2px 0 0 0'
                      }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      background: 'var(--error-container)',
                      color: 'var(--on-error-container)',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--error)'
                      e.currentTarget.style.color = 'var(--on-error)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--error-container)'
                      e.currentTarget.style.color = 'var(--on-error-container)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Botão Submeter */}
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
                Submeter monografia
              </>
            )}
          </button>
        </form>
      )}

      {/* Mensagem de bloqueio */}
      {!canSubmitNew && (
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
            A tua monografia está em curso ({current?.status_label}). Não podes submeter uma nova versão agora.
          </p>
        </div>
      )}

      {pdfPreview && (
        <PdfPreviewModal
          url={pdfPreview.url}
          title={pdfPreview.title}
          filename={pdfPreview.filename}
          onClose={() => setPdfPreview(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}