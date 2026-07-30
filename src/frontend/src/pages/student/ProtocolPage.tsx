// src/pages/student/ProtocolPage.tsx
import { useEffect, useState } from 'react'
import { protocolService, type Protocol, type ProtocolOpinion } from '../../services/protocolService'
import { topicService, type ApprovedTopic } from '../../services/topicService'
import { TopicJustificationToggle } from '../../components/TopicJustification'
import PdfPreviewModal from '../../components/PdfPreviewModal'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    protocol_approved_supervisor: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado (Supervisor)' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado (Supervisor)' },
    protocol_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado (Núcleo)' },
    protocol_rejected_nucleo: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado (Núcleo)' },
    protocol_pending_comite_cientifico: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Encaminhado ao CC' },
    protocol_rejected_cc: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado (CC)' },
    protocol_rejected_bioetica: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado (Bioética)' },
    protocol_resubmitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Re-submetido' },
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
  const [opinionsByProtocol, setOpinionsByProtocol] = useState<Record<number, ProtocolOpinion[]>>({})
  const [pdfPreview, setPdfPreview] = useState<{ url: string; title: string; filename: string } | null>(null)
  const [approvedTopics, setApprovedTopics] = useState<ApprovedTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [protocolType, setProtocolType] = useState('protocol')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 🆕 Submissão ao Comité Científico
  const [ccFile, setCcFile] = useState<File | null>(null)
  const [submittingCc, setSubmittingCc] = useState(false)

  useEffect(() => {
    load()
    loadApprovedTopics()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const { protocols } = await protocolService.list()
      setProtocols(protocols)

      const opinionEntries = await Promise.all(
        protocols.map(async protocol => {
          try {
            const { opinions } = await protocolService.listOpinions(protocol.id)
            return [protocol.id, opinions] as const
          } catch {
            return [protocol.id, []] as const
          }
        })
      )

      setOpinionsByProtocol(Object.fromEntries(opinionEntries))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadApprovedTopics() {
    setLoadingTopics(true)
    try {
      const response = await topicService.getMyApprovedTopics()
      const topics = response.data || []
      setApprovedTopics(topics)
    } catch (e) {
      console.error('Erro ao carregar temas aprovados:', e)
      setApprovedTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }

  const current = protocols[0]
  const canSubmitNew = !current || [
    'protocol_rejected_supervisor',
    'protocol_rejected_nucleo',
    'protocol_rejected_cc',
    'protocol_rejected_bioetica',
  ].includes(current.status)

  // 🆕 Pode submeter ao CC quando está pending_comite_cientifico
  const canSubmitToCC = current?.status === 'protocol_pending_comite_cientifico'

  const selectedTopic = approvedTopics.find(t => t.id === Number(selectedTopicId))
  const topicHasProtocol = selectedTopic?.has_protocol || false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !selectedTopicId) return

    if (topicHasProtocol) {
      setError('Este tema já possui um protocolo ativo.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await protocolService.submit(Number(selectedTopicId), protocolType, file)
      setFile(null)
      setSelectedTopicId('')
      setSuccess('Protocolo submetido com sucesso!')
      await load()
      await loadApprovedTopics()
      setTimeout(() => setSuccess(null), 3000)
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

  // 🆕 Submeter ao Comité Científico
  async function handleSubmitToCC(e: React.FormEvent) {
    e.preventDefault()
    if (!ccFile || !current) return

    setSubmittingCc(true)
    setError(null)
    setSuccess(null)
    try {
      await protocolService.submitToComiteCientifico(current.id, ccFile)
      setCcFile(null)
      setSuccess('Documento submetido ao Comité Científico com sucesso!')
      await load()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmittingCc(false)
    }
  }

  async function openFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try {
      await protocolService.openFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function downloadFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try {
      await protocolService.downloadFile(url, fallbackFilename)
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)'
      }}>
        <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>
            O meu protocolo
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Submeta e acompanhe o seu protocolo de investigação.
          </p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
          {protocols.length} protocolo{protocols.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mensagem de sucesso */}
      {success && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--primary-container)', color: 'var(--on-primary-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
          {success}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Lista de protocolos */}
      {protocols.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          {protocols.map(p => {
            const s = getStatusStyle(p.status)
            const activeDocs = p.documents?.filter(d => d.status === 'active') || []
            const opinions = opinionsByProtocol[p.id] || []

            return (
              <div key={p.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', color: 'var(--on-surface)', fontFamily: 'var(--font-family)' }}>
                        {p.code}
                      </h3>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
                        {p.status_label || s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                      Submissão nº{p.submission_number} • Versão {p.version}
                    </p>
                    {p.topic && (
                      <>
                        <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                          Tema: {p.topic.title}
                        </p>
                        <TopicJustificationToggle justification={p.topic.justification} showEmpty compact style={{ marginTop: 'var(--space-2)' }} />
                      </>
                    )}
                  </div>
                </div>

                {p.justification && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--tertiary)', flexShrink: 0, marginTop: '2px' }}>info</span>
                    <span>{p.justification}</span>
                  </div>
                )}

                {activeDocs.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Documentos anexos
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {activeDocs.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '12px var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--body-md)', color: 'var(--on-surface)', fontWeight: 'var(--font-medium)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>description</span>
                          <div style={{ flex: 1 }}>
                            <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name)} disabled={!doc.download_url} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, color: 'var(--primary)', textAlign: 'left', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', cursor: doc.download_url ? 'pointer' : 'not-allowed', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                            </button>
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Versão {doc.version}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <button type="button" onClick={() => openFile(doc.download_url, doc.file_name)} disabled={!doc.download_url} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', cursor: doc.download_url ? 'pointer' : 'not-allowed', fontWeight: 'var(--font-medium)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>Ver
                            </button>
                            {doc.download_url && (
                              <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-medium)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Baixar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {opinions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pareceres e fichas
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      {opinions.map(opinion => (
                        <div key={opinion.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: '10px var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>
                              {opinion.organ} • {opinion.decision === 'approved' ? 'Aprovado' : 'Reprovado'}
                            </p>
                            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>Versão {opinion.version}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            {opinion.download_url && (
                              <button type="button" onClick={() => previewPdf(opinion.download_url, `Parecer ${p.code}`, `parecer-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>Ver Parecer
                              </button>
                            )}
                            {opinion.download_url && (
                              <button type="button" onClick={() => downloadFile(opinion.download_url, `parecer-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>Baixar Parecer
                              </button>
                            )}
                            {opinion.evaluation_form_download_url && (
                              <button type="button" onClick={() => previewPdf(opinion.evaluation_form_download_url, `Ficha de Avaliação ${p.code}`, `ficha-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>Ver Ficha
                              </button>
                            )}
                            {opinion.evaluation_form_download_url && (
                              <button type="button" onClick={() => downloadFile(opinion.evaluation_form_download_url, `ficha-${p.code}.pdf`)} className="btn btn-small">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>Baixar Ficha
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🆕 Submissão ao Comité Científico */}
                {canSubmitToCC && p.id === current?.id && (
                  <form onSubmit={handleSubmitToCC} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--tertiary-container)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--tertiary)', flexShrink: 0 }}>info</span>
                      <div>
                        <strong style={{ color: 'var(--on-tertiary-container)' }}>Submeter ao Comité Científico</strong>
                        <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-tertiary-container)', marginTop: '4px' }}>
                          O teu protocolo foi aprovado pelo Núcleo Científico. Submete o documento final para avaliação pelo Comité Científico.
                        </p>
                      </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        id="ccFile"
                        type="file"
                        accept=".docx,.pdf"
                        onChange={e => setCcFile(e.target.files?.[0] ?? null)}
                        required
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px dashed var(--tertiary)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', color: ccFile ? 'var(--on-surface)' : 'var(--on-surface-variant)', transition: 'all 0.2s ease', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--tertiary)'; e.currentTarget.style.background = 'rgba(115,92,0,0.02)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--tertiary)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--tertiary)' }}>
                          {ccFile ? 'check_circle' : 'upload'}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ccFile ? `${ccFile.name} (${formatFileSize(ccFile.size)})` : 'Selecionar documento para o Comité Científico...'}
                        </span>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submittingCc || !ccFile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '14px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: submittingCc || !ccFile ? 'not-allowed' : 'pointer', opacity: submittingCc || !ccFile ? 0.7 : 1, transition: 'all 0.2s ease' }}>
                      {submittingCc ? (
                        <>
                          <span style={{ width: '18px', height: '18px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
                          A enviar...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                          Submeter ao Comité Científico
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Estado vazio */}
      {protocols.length === 0 && canSubmitNew && (
        <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>description</span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>Nenhum protocolo submetido</p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>Selecione um tema aprovado abaixo para submeter o seu protocolo.</p>
        </div>
      )}

      {/* Formulário de submissão inicial */}
      {canSubmitNew && (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
          {/* ... (formulário existente mantém-se igual) ... */}
          <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>Submeter novo protocolo</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label htmlFor="topicId" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Tema aprovado</label>
            <select id="topicId" value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)} required disabled={loadingTopics || approvedTopics.length === 0} style={{ width: '100%', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: approvedTopics.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxSizing: 'border-box', appearance: 'auto' }}>
              <option value="">{loadingTopics ? 'A carregar temas...' : approvedTopics.length === 0 ? 'Nenhum tema aprovado disponível' : 'Selecione um tema'}</option>
              {approvedTopics.map(topic => (
                <option key={topic.id} value={topic.id} disabled={topic.has_protocol}>{topic.title}{topic.has_protocol ? ' (já tem protocolo)' : ''}</option>
              ))}
            </select>
            {selectedTopic && <TopicJustificationToggle justification={selectedTopic.justification} showEmpty compact style={{ marginTop: 'var(--space-1)' }} />}
            {selectedTopic && topicHasProtocol && (
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>Este tema já possui um protocolo ativo.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="protocolType" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Tipo</label>
              <select id="protocolType" value={protocolType} onChange={e => setProtocolType(e.target.value)} style={{ width: '100%', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease', boxSizing: 'border-box', appearance: 'auto' }}>
                <option value="protocol">Protocolo</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="file" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Documento (.docx)</label>
              <div style={{ position: 'relative' }}>
                <input id="file" type="file" accept=".docx" onChange={e => setFile(e.target.files?.[0] ?? null)} required style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px dashed var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', color: file ? 'var(--on-surface)' : 'var(--on-surface-variant)', transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(0,105,51,0.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.background = 'var(--surface-container-lowest)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>{file ? 'check_circle' : 'upload'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? `${file.name} (${formatFileSize(file.size)})` : 'Selecionar ficheiro...'}</span>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting || !file || !selectedTopicId || topicHasProtocol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '14px var(--space-3)', fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: submitting || !file || !selectedTopicId || topicHasProtocol ? 'not-allowed' : 'pointer', opacity: submitting || !file || !selectedTopicId || topicHasProtocol ? 0.7 : 1, transition: 'all 0.2s ease', boxShadow: 'var(--elevation-1)', marginTop: 'var(--space-1)' }}>
            {submitting ? (
              <><span style={{ width: '18px', height: '18px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />A enviar...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>Submeter protocolo</>
            )}
          </button>
        </form>
      )}

      {/* Mensagem de bloqueio */}
      {!canSubmitNew && !canSubmitToCC && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--tertiary)', flexShrink: 0 }}>info</span>
          <p>O teu protocolo está em curso ({current?.status_label}). Não podes submeter uma nova versão agora.</p>
        </div>
      )}

      {pdfPreview && (
        <PdfPreviewModal url={pdfPreview.url} title={pdfPreview.title} filename={pdfPreview.filename} onClose={() => setPdfPreview(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}