// src/pages/supervisor/SupervisorProtocolDetailPage.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { protocolService, type Protocol, type Document, type ProtocolOpinion } from '../../services/protocolService'
import TopicJustification from '../../components/TopicJustification'
import '../../styles/global.css'

export default function SupervisorProtocolDetailPage() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [opinions, setOpinions] = useState<ProtocolOpinion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (protocolId) load()
  }, [protocolId])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await protocolService.getById(Number(protocolId))
      setProtocol(data.protocol)
      try {
        const opinionsData = await protocolService.listOpinions(Number(protocolId))
        setOpinions(opinionsData.opinions || [])
      } catch {
        setOpinions([])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
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
    if (error) {
      return (
        <div>
          <div style={{
            padding: 'var(--space-4)',
            textAlign: 'center',
            color: 'var(--on-error-container)',
            background: 'var(--error-container)',
            borderRadius: 'var(--radius-lg)',
            margin: 'var(--space-4)',
            fontSize: 'var(--body-md)',
            fontFamily: 'var(--font-family)'
          }}>
            {error}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
            <Link to="/supervisor" style={{
              color: 'var(--primary)',
              fontFamily: 'var(--font-family)'
            }}>
              Voltar para lista de protocolos
            </Link>
          </div>
        </div>
      )
    }
    return <div>Protocolo não encontrado.</div>
  }

  const activeDocs = protocol.documents?.filter(d => d.status === 'active') || []
  const requiredDocs = protocol.protocol_document_requirements || []
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
          <>
            <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
              Tema: {protocol.topic.title}
            </p>
            <TopicJustification
              justification={protocol.topic.justification}
              showEmpty
              compact
              style={{ marginTop: 'var(--space-2)', maxWidth: '720px' }}
            />
          </>
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
                  <p style={{ fontWeight: 'var(--font-semibold)' }}>{doc.file_name}</p>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                    Versão {doc.version_label || `V${doc.version}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button
                    type="button"
                    onClick={() => openFile(doc.download_url, doc.file_name)}
                    disabled={!doc.download_url}
                    className="btn btn-small"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: 'var(--radius-md)', border: 'none', cursor: doc.download_url ? 'pointer' : 'not-allowed' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                    Ver
                  </button>
                  {doc.download_url && (
                    <button
                      type="button"
                      onClick={() => downloadFile(doc.download_url, doc.file_name)}
                      className="btn btn-small"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px var(--space-2)', fontSize: 'var(--label-sm)', background: 'var(--surface-container)', color: 'var(--on-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                      Baixar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {requiredDocs.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: 0 }}>
              Anexos obrigatórios do Comité Científico
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
              {requiredDocs.map(doc => {
                const approved = doc.aprovado === true
                const rejected = doc.aprovado === false

                return (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: '12px var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: approved ? 'var(--primary)' : rejected ? 'var(--error)' : 'var(--tertiary)' }}>
                      {approved ? 'check_circle' : rejected ? 'error' : 'pending_actions'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>{doc.nome}</p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>{doc.status_label || 'Pendente de validação'}</p>
                      {doc.file_name && (
                        <button type="button" onClick={() => downloadFile(doc.download_url, doc.file_name || undefined)} disabled={!doc.download_url} style={{ marginTop: '4px', padding: 0, border: 'none', background: 'transparent', color: 'var(--primary)', cursor: doc.download_url ? 'pointer' : 'not-allowed', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', textDecoration: 'underline', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                          {doc.file_name}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {opinions.length > 0 && (
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
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>fact_check</span>
            Pareceres e fichas de avaliação
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {opinions.map(opinion => (
              <div
                key={opinion.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                  padding: '12px var(--space-3)',
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
                    <button type="button" onClick={() => downloadFile(opinion.download_url, `parecer-${protocol.code}.pdf`)} className="btn btn-small">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                      Parecer
                    </button>
                  )}
                  {opinion.evaluation_form_download_url && (
                    <button type="button" onClick={() => downloadFile(opinion.evaluation_form_download_url, `ficha-${protocol.code}.pdf`)} className="btn btn-small">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>
                      Ficha
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
