import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PdfPreviewModal from '../../components/PdfPreviewModal'
import OnlyOfficeEditor from '../../components/OnlyOfficeEditor/OnlyOfficeEditor'
import { StudentWorkspaceNav } from '../../components/student/StudentWorkspaceNav'
import { protocolService, type Document, type Protocol, type ProtocolOpinion } from '../../services/protocolService'
import { topicService, type Topic } from '../../services/topicService'
import '../../components/student/studentWorkspace.css'

function formatDate(value?: string | null) {
  if (!value) return 'Data não disponível'

  return new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Maputo',
  }).format(new Date(value))
}

function documentLabel(document: Document) {
  return `Versão ${document.version} · ${document.status === 'active' ? 'Atual' : 'Histórico'}`
}

export default function DocumentsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [opinions, setOpinions] = useState<Record<number, ProtocolOpinion[]>>({})
  const [selectedProtocolId, setSelectedProtocolId] = useState<number | null>(null)
  const [preview, setPreview] = useState<{ url: string; title: string; filename: string } | null>(null)
  const [topicViewer, setTopicViewer] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [protocolResponse, topicResponse] = await Promise.all([
        protocolService.list(),
        topicService.list(),
      ])
      setProtocols(protocolResponse.protocols)
      setTopics(topicResponse.topics)
      setSelectedProtocolId(current => current && protocolResponse.protocols.some(protocol => protocol.id === current) ? current : protocolResponse.protocols[0]?.id ?? null)
      const entries = await Promise.all(protocolResponse.protocols.map(async protocol => {
        try {
          const result = await protocolService.listOpinions(protocol.id)
          return [protocol.id, result.opinions] as const
        } catch {
          return [protocol.id, []] as const
        }
      }))
      setOpinions(Object.fromEntries(entries))
    } catch (requestError) {
      setProtocols([])
      setTopics([])
      setOpinions({})
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os documentos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  const selectedProtocol = useMemo(
    () => protocols.find(protocol => protocol.id === selectedProtocolId) ?? null,
    [protocols, selectedProtocolId],
  )
  const documents = selectedProtocol?.documents ?? []
  const protocolOpinions = selectedProtocol ? opinions[selectedProtocol.id] ?? [] : []
  const topicDocuments = useMemo(
    () => topics.filter(topic => Boolean(topic.has_document)),
    [topics],
  )
  const topicDocument = selectedProtocol
    ? topics.find(topic => topic.id === selectedProtocol.topic_id && topic.has_document)
    : null

  async function download(url: string | null | undefined, filename: string) {
    if (!url) return
    try {
      await protocolService.downloadFile(url, filename)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Não foi possível descarregar o ficheiro.')
    }
  }

  if (loading) return <main className="student-workspace"><StudentWorkspaceNav /><div className="student-document-panel">A carregar documentos…</div></main>

  return (
    <main className="student-workspace" aria-labelledby="documents-title">
      <StudentWorkspaceNav />
      <header className="student-page-header">
        <div>
          <p className="student-page-header__eyebrow">Área do estudante</p>
          <h1 id="documents-title" className="student-page-header__title">Documentos e pareceres</h1>
          <p className="student-page-header__description">Consulta, descarrega e imprime os documentos dos teus protocolos.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void load()}><span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar</button>
      </header>

      {error && <div className="student-alert" role="alert" aria-live="assertive"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span></div>}

      {protocols.length === 0 ? topicDocuments.length === 0 ? (
        <div className="student-empty-state"><span className="material-symbols-outlined" aria-hidden="true">folder_open</span><strong>Não há documentos para apresentar</strong><span>Os documentos dos temas e protocolos aparecerão aqui após a submissão.</span></div>
      ) : (
        <section className="student-document-panel" aria-labelledby="topic-documents-heading">
          <header className="student-document-panel__header">
            <div>
              <span className="student-document-panel__eyebrow">Tema submetido</span>
              <h2 id="topic-documents-heading" className="student-document-panel__title">Documentos dos temas</h2>
            </div>
          </header>
          {topicDocuments.map(topic => (
            <TopicDocumentRow
              key={topic.id}
              topic={topic}
              onView={() => setTopicViewer(topic)}
              onDownload={() => void download(
                topicService.downloadDocument(topic.id),
                topic.document_name || `tema-${topic.id}.docx`,
              )}
            />
          ))}
        </section>
      ) : selectedProtocol && (
        <div className="student-document-list">
          <aside className="student-protocol-list" aria-label="Protocolos">
            {protocols.map(protocol => <button key={protocol.id} type="button" className={`student-protocol-list__item${protocol.id === selectedProtocol.id ? ' is-active' : ''}`} onClick={() => setSelectedProtocolId(protocol.id)}>
              <span className="student-protocol-list__code">{protocol.code}</span>
              <span className="student-protocol-list__title">{protocol.topic?.title || 'Protocolo sem tema associado'}</span>
            </button>)}
          </aside>

          <section className="student-document-panel" aria-live="polite">
            <header className="student-document-panel__header">
              <div><span className="student-document-panel__eyebrow">{selectedProtocol.code} · {selectedProtocol.status_label}</span><h2 className="student-document-panel__title">{selectedProtocol.topic?.title || 'Protocolo sem tema associado'}</h2></div>
              <span className="student-document-row__meta">{documents.length} ficheiro(s)</span>
            </header>

            <section className="student-document-section" aria-labelledby="protocol-documents-heading">
              <h3 id="protocol-documents-heading" className="student-document-section__label">Documentos do protocolo</h3>
              {documents.length === 0 ? <p className="student-document-row__meta">Ainda não há ficheiros submetidos neste protocolo.</p> : documents.map(document => <DocumentRow key={document.id} document={document} onPreview={() => document.download_url && setPreview({ url: document.download_url, title: document.file_name, filename: document.file_name })} onDownload={() => void download(document.download_url, document.file_name)} />)}
            </section>

            {topicDocument && (
              <section className="student-document-section" aria-labelledby="topic-document-heading">
                <h3 id="topic-document-heading" className="student-document-section__label">Documento do tema</h3>
                <TopicDocumentRow
                  topic={topicDocument}
                  onView={() => setTopicViewer(topicDocument)}
                  onDownload={() => void download(
                    topicService.downloadDocument(topicDocument.id),
                    topicDocument.document_name || `tema-${topicDocument.id}.docx`,
                  )}
                />
              </section>
            )}

            <section className="student-document-section" aria-labelledby="opinions-heading">
              <h3 id="opinions-heading" className="student-document-section__label">Pareceres emitidos</h3>
              {protocolOpinions.length === 0 ? <p className="student-document-row__meta">Ainda não há pareceres disponíveis.</p> : protocolOpinions.map(opinion => <article key={opinion.id} className="student-opinion-row"><div><strong>{opinion.organ} · {opinion.decision === 'approved' ? 'Aprovado' : 'Não aprovado'}</strong><p className="student-document-row__meta">Versão {opinion.version} · Emitido em {formatDate(opinion.issued_at)}</p></div><div className="student-document-row__actions">{opinion.is_signed && opinion.signed_download_url && <><button type="button" className="btn btn-small" onClick={() => setPreview({ url: opinion.signed_download_url!, title: `Parecer assinado ${selectedProtocol.code}`, filename: `parecer-assinado-${selectedProtocol.code}.pdf` })}><span className="material-symbols-outlined" aria-hidden="true">visibility</span>Ver</button><button type="button" className="btn btn-small" onClick={() => void download(opinion.signed_download_url, `parecer-assinado-${selectedProtocol.code}.pdf`)}><span className="material-symbols-outlined" aria-hidden="true">download</span>Baixar</button></>}</div></article>)}
            </section>
          </section>
        </div>
      )}

      {preview && <PdfPreviewModal url={preview.url} title={preview.title} filename={preview.filename} onClose={() => setPreview(null)} />}
      {topicViewer && (
        <TopicDocumentViewer
          topic={topicViewer}
          onClose={() => setTopicViewer(null)}
          onDownload={() => void download(
            topicService.downloadDocument(topicViewer.id),
            topicViewer.document_name || `tema-${topicViewer.id}.docx`,
          )}
        />
      )}
    </main>
  )
}

function TopicDocumentRow({ topic, onView, onDownload }: { topic: Topic; onView: () => void; onDownload: () => void }) {
  return (
    <article className="student-document-row">
      <div className="student-document-row__main">
        <span className="material-symbols-outlined" aria-hidden="true">article</span>
        <div>
          <div className="student-document-row__name">{topic.document_name || 'Documento do tema'}</div>
          <div className="student-document-row__meta">Formato DOCX · Submetido em {formatDate(topic.submitted_at)}</div>
        </div>
      </div>
      <div className="student-document-row__actions">
        <button type="button" className="btn btn-small" onClick={onView}>
          <span className="material-symbols-outlined" aria-hidden="true">visibility</span>
          Ver DOCX
        </button>
        <button type="button" className="btn btn-small" onClick={onDownload}>
          <span className="material-symbols-outlined" aria-hidden="true">download</span>
          Baixar
        </button>
      </div>
    </article>
  )
}

function TopicDocumentViewer({ topic, onClose, onDownload }: { topic: Topic; onClose: () => void; onDownload: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={dialogRef}
      className="student-topic-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Visualização do documento do tema"
      tabIndex={-1}
    >
      <header className="student-topic-viewer__header">
        <div>
          <strong>{topic.document_name || 'Documento do tema'}</strong>
          <p className="student-document-row__meta">Visualização em modo de leitura</p>
        </div>
        <div className="student-document-row__actions">
          <button type="button" className="btn btn-small" onClick={onDownload}>
            <span className="material-symbols-outlined" aria-hidden="true">download</span>
            Baixar
          </button>
          <button type="button" className="btn btn-small" onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
            Fechar
          </button>
        </div>
      </header>
      <div className="student-topic-viewer__content">
        <OnlyOfficeEditor topicId={topic.id} height="100%" />
      </div>
    </div>
  )
}

function DocumentRow({ document, onPreview, onDownload }: { document: Document; onPreview: () => void; onDownload: () => void }) {
  return <article className="student-document-row"><div className="student-document-row__main"><span className="material-symbols-outlined" aria-hidden="true">description</span><div><div className="student-document-row__name">{document.file_name}</div><div className="student-document-row__meta">{documentLabel(document)} · {formatDate(document.submitted_at)}</div></div></div><div className="student-document-row__actions"><button type="button" className="btn btn-small" onClick={onPreview}><span className="material-symbols-outlined" aria-hidden="true">visibility</span>Ver</button><button type="button" className="btn btn-small" onClick={onDownload}><span className="material-symbols-outlined" aria-hidden="true">download</span>Baixar</button></div></article>
}
