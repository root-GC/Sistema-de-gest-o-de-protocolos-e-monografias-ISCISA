import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PdfPreviewModal from '../../components/PdfPreviewModal'
import OnlyOfficeEditor from '../../components/OnlyOfficeEditor/OnlyOfficeEditor'
import { downloadApiFile } from '../../services/apiClient'
import { scientificDirectionService, type DirectionDetail, type FileRow } from '../../services/scientificDirectionService'
import './scientificDirection.css'

function date(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-MZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Não registada' }
function canPreview(name: string) { return /\.(pdf|png|jpe?g)$/i.test(name) }

export default function ScientificDirectionProcessDetailPage() {
  const { organId, kind, processId } = useParams()
  const [process, setProcess] = useState<DirectionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<FileRow | null>(null)
  const [onlyOffice, setOnlyOffice] = useState(false)
  const organ = Number(organId)
  const id = Number(processId)
  const isTopic = kind === 'topics'

  useEffect(() => {
    if (!organ || !id) return
    const requestId = window.setTimeout(() => {
      setError(null)
      const request = isTopic ? scientificDirectionService.topic(organ, id) : scientificDirectionService.protocol(organ, id)
      void request.then(response => setProcess(response.process)).catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o dossiê.'))
    }, 0)
    return () => window.clearTimeout(requestId)
  }, [id, isTopic, organ])
  const download = async (file: FileRow) => { if (file.download_url) await downloadApiFile(file.download_url, file.name) }
  if (error) return <main className="direction-error" role="alert"><strong>Não foi possível carregar o dossiê.</strong><span>{error}</span></main>
  if (!process) return <main className="direction-loading" aria-live="polite">A carregar dossiê…</main>
  const mainFile = isTopic ? process.document : process.documents?.[0]
  const files = isTopic ? [] : process.requirements ?? []

  return <main className="direction-workspace" aria-labelledby="direction-process-title">
    <header className="direction-header"><div><Link className="direction-eyebrow" to={`/general-admin/organs/${organ}`}>Atividade do órgão</Link><h1 id="direction-process-title">{process.title}</h1><p>{process.code || process.course?.code || 'Tema'} · {process.student?.name || 'Estudante não identificado'} · {process.status_label}</p></div><Link className="btn btn-outline" to={`/general-admin/organs/${organ}`}><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Voltar à lista</Link></header>
    <section className="direction-detail-section"><h2>Documento principal</h2>{mainFile ? <FileItem file={mainFile} onPreview={setPreview} onDownload={download} onOnlyOffice={() => setOnlyOffice(true)} allowOnlyOffice /> : <p>Não há documento disponível.</p>}</section>
    {onlyOffice && <section className="direction-detail-section"><div className="direction-section__header"><h2>Consulta no OnlyOffice</h2><button type="button" className="btn btn-outline" onClick={() => setOnlyOffice(false)}>Fechar</button></div><div style={{ height: '680px' }}><OnlyOfficeEditor protocolId={isTopic ? undefined : id} topicId={isTopic ? id : undefined} height="100%" /></div></section>}
    <section className="direction-detail-section"><h2>Versões do documento</h2>{process.document_versions?.length ? process.document_versions.map(file => <FileItem key={file.id} file={file} onPreview={setPreview} onDownload={download} />) : <p>Não há versões registadas.</p>}</section>
    {!isTopic && <section className="direction-detail-section"><h2>Anexos</h2>{files.length ? files.map(file => <FileItem key={file.id} file={file} onPreview={setPreview} onDownload={download} />) : <p>Não há anexos registados.</p>}</section>}
    <section className="direction-detail-section"><h2>Revisores e revisões</h2>{process.assignments?.length ? process.assignments.map((item, index) => <div className="direction-review-row" key={`${item.reviewer}-${index}`}><div><strong>{item.reviewer || 'Revisor não identificado'}</strong><small>{item.organ ? `${item.organ} · ` : ''}Atribuído em {date(item.assigned_at)}{item.released ? ' · Atribuição libertada' : ''}</small>{item.comment && <small>{item.comment}</small>}</div><span className="direction-badge">{item.decision || (item.evaluated_at ? 'Avaliado' : 'Em revisão')}</span></div>) : <p>Não há revisores atribuídos.</p>}</section>
    {process.evaluations && <section className="direction-detail-section"><h2>Fichas e pareceres</h2>{process.evaluations.length ? process.evaluations.map(form => <article className="direction-evaluation" key={form.id}><div><strong>{form.organ} · {form.version}</strong><small>{form.status}{form.decision ? ` · ${form.decision}` : ''}{form.decided_at ? ` · ${date(form.decided_at)}` : ''}</small>{form.summary && <p>{form.summary}</p>}</div>{form.reviews.map((review, index) => <div className="direction-review-row" key={`${review.reviewer}-${index}`}><div><strong>{review.reviewer || 'Revisor'}</strong><small>{review.status}{review.decision ? ` · ${review.decision}` : ''}{review.submitted_at ? ` · ${date(review.submitted_at)}` : ''}</small>{review.comment && <p>{review.comment}</p>}{review.criteria.length > 0 && <ul className="direction-criteria">{review.criteria.map((criterion, item) => <li key={item}>{criterion.name || 'Critério'}{criterion.comment ? `: ${criterion.comment}` : ''}</li>)}</ul>}</div></div>)}{form.opinions.map((opinion, index) => <div className="direction-file-actions" key={index}>{opinion.download_url && <button type="button" className="btn btn-outline" onClick={() => void downloadApiFile(opinion.download_url!, 'parecer.pdf')}>Parecer</button>}{opinion.signed_download_url && <button type="button" className="btn btn-primary" onClick={() => void downloadApiFile(opinion.signed_download_url!, 'parecer-assinado.pdf')}>Parecer assinado</button>}</div>)}{form.meetings.map((meeting, index) => <small key={index}>Reunião {meeting.meeting_status || meeting.status} · {meeting.organ || ''} · {date(meeting.scheduled_at)}{meeting.location ? ` · ${meeting.location}` : ''}</small>)}</article>) : <p>Não há fichas de avaliação.</p>}</section>}
    {process.comments && <section className="direction-detail-section"><h2>Comentários</h2>{process.comments.length ? process.comments.map((comment, index) => <div className="direction-history-row" key={index}><div><strong>{comment.author || 'Utilizador'}</strong><small>{date(comment.created_at)}</small><p>{comment.content}</p></div></div>) : <p>Não há comentários registados.</p>}</section>}
    <section className="direction-detail-section"><h2>Histórico</h2>{process.history.length ? process.history.map(event => <div className="direction-history-row" key={event.id}><div><strong>{event.description || event.action}</strong><small>{event.organ || 'Sistema'} · {event.actor || 'Sistema'} · {date(event.occurred_at)}</small></div></div>) : <p>Não há histórico registado.</p>}</section>
    {preview && preview.download_url && <PdfPreviewModal url={preview.download_url} title={preview.name} filename={preview.name} onClose={() => setPreview(null)} />}
  </main>
}

function FileItem({ file, onPreview, onDownload, onOnlyOffice, allowOnlyOffice = false }: { file: FileRow; onPreview: (file: FileRow) => void; onDownload: (file: FileRow) => Promise<void>; onOnlyOffice?: () => void; allowOnlyOffice?: boolean }) {
  const unavailable = file.availability === 'missing' || !file.download_url
  return <div className="direction-file-row"><div><strong>{file.name}</strong><small>{file.version || (file.submission_number ? `Submissão ${file.submission_number}` : '')}{file.status ? ` · ${file.status}` : ''}{file.optional ? ' · Opcional' : ''}{unavailable ? ' · Indisponível' : ''}</small></div><div className="direction-file-actions">{allowOnlyOffice && /\.docx$/i.test(file.name) && <button type="button" className="btn btn-outline" onClick={onOnlyOffice}>Abrir no OnlyOffice</button>}{!unavailable && canPreview(file.name) && <button type="button" className="btn btn-outline" onClick={() => onPreview(file)}>Ver</button>}<button type="button" className="btn btn-outline" disabled={unavailable} onClick={() => void onDownload(file)}>Baixar</button></div></div>
}
