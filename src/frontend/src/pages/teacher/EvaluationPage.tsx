// src/pages/reviewer/EvaluationPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  topicService,
  type Topic,
  type TopicReviewComment,
} from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { evaluationService, type EvaluationForm, type EvaluationOpinionResult, type FormCriterion, type ReviewerEvaluation } from '../../services/evaluationService'
import { useAuth } from '../../context/AuthContext'
import TopicJustification from '../../components/TopicJustification'
import '../../styles/global.css'

// ── Helpers ────────────────────────────────────────────
function isTopicClosed(status?: string) {
  return status === 'topic_approved_nucleo' || status === 'topic_rejected_nucleo' || status === 'topic_rejected'
}

function decisionLabel(decision: 'approved' | 'rejected' | null | undefined) {
  if (decision === 'approved') return 'Aprovado'
  if (decision === 'rejected') return 'Não aprovado'
  return 'Pendente'
}

function evaluationStatusMessage(topic: Topic): string {
  if (topic.status === 'topic_approved_nucleo') return 'Este tema foi aprovado pelo Núcleo Científico.'
  if (topic.status === 'topic_rejected_nucleo') return 'Este tema foi rejeitado pelo Núcleo Científico.'
  return ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

type ExpandedPanel = 'both' | 'document' | 'form'
type FormTab = 'my-evaluation' | 'other-evaluation' | 'comparison'

const MIN_PANEL_WIDTH = 300
const DEFAULT_SPLIT = 50

interface ImportedDocument {
  file: File
  name: string
  size: number
  url: string
  uploadedAt: Date
}

// ── Componente Principal ──────────────────────────────
export default function EvaluationPage() {
  const { topicId, protocolId } = useParams<{ topicId: string; protocolId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isProtocol = !!protocolId
  const id = Number(protocolId || topicId)

  // ── Topic state ──
  const [topic, setTopic] = useState<Topic | null>(null)
  const [comments, setComments] = useState<TopicReviewComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [myDecision, setMyDecision] = useState<'approved' | 'rejected' | null>(null)
  const [evaluationDone, setEvaluationDone] = useState(false)

  // ── Protocol state ──
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null)
  const [criterionReviews, setCriterionReviews] = useState<Record<number, string>>({})
  const [recommendation, setRecommendation] = useState<'approved' | 'rejected' | ''>('')
  const [overallComment, setOverallComment] = useState('')
  const [formConcluded, setFormConcluded] = useState(false)
  const [myEvaluationSubmitted, setMyEvaluationSubmitted] = useState(false)
  const [allReviewersSubmitted, setAllReviewersSubmitted] = useState(false)
  const [protocolDecision, setProtocolDecision] = useState<string | null>(null)
  const [opinionResult, setOpinionResult] = useState<EvaluationOpinionResult | null>(null)
  const [finalDecision, setFinalDecision] = useState<'approved' | 'rejected' | ''>('')
  const [conclusionSummary, setConclusionSummary] = useState('')

  // ── Shared state ──
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Document Viewer state ──
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)

  // ── Imported Document state ──
  const [importedDocument, setImportedDocument] = useState<ImportedDocument | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // ── Panel state ──
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>('both')
  const [splitPosition, setSplitPosition] = useState(DEFAULT_SPLIT)
  const [isDragging, setIsDragging] = useState(false)

  // ── Form Tab state ──
  const [activeFormTab, setActiveFormTab] = useState<FormTab>('my-evaluation')

  // ── Other Reviewer state ──
  const [otherReviewerEval, setOtherReviewerEval] = useState<ReviewerEvaluation | null>(null)
  const [otherReviewerCriterionReviews, setOtherReviewerCriterionReviews] = useState<Record<number, string>>({})

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const savedSplitPosition = useRef(DEFAULT_SPLIT)

  // ═══════════════════════════════════════════════
  // DRAG TO RESIZE
  // ═══════════════════════════════════════════════
  const handleMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsDragging(true) }, [])

  useEffect(() => {
    if (!isDragging) return
    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const w = r.width; const mx = e.clientX - r.left
      let p = (mx / w) * 100
      if ((p / 100) * w < MIN_PANEL_WIDTH) p = (MIN_PANEL_WIDTH / w) * 100
      else if (((100 - p) / 100) * w < MIN_PANEL_WIDTH) p = ((w - MIN_PANEL_WIDTH) / w) * 100
      p = Math.max(20, Math.min(80, p))
      setSplitPosition(p)
    }
    function up() { setIsDragging(false) }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', up)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = '' }
  }, [isDragging])

  // ═══════════════════════════════════════════════
  // PANEL TOGGLE
  // ═══════════════════════════════════════════════
  function toggleDocumentFullscreen() { if (expandedPanel === 'document') { setExpandedPanel('both'); setSplitPosition(savedSplitPosition.current) } else { savedSplitPosition.current = splitPosition; setExpandedPanel('document') } }
  function toggleFormFullscreen() { if (expandedPanel === 'form') { setExpandedPanel('both'); setSplitPosition(savedSplitPosition.current) } else { savedSplitPosition.current = splitPosition; setExpandedPanel('form') } }

  useEffect(() => {
    function k(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); toggleDocumentFullscreen() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '\\') { e.preventDefault(); toggleFormFullscreen() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '0') { e.preventDefault(); setSplitPosition(DEFAULT_SPLIT); setExpandedPanel('both') }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [expandedPanel, splitPosition])

  // ═══════════════════════════════════════════════
  // IMPORT / UPLOAD
  // ═══════════════════════════════════════════════
  function processFile(file: File) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!['.docx', '.doc', '.pdf'].includes(ext)) { setError('Formato não suportado.'); return }
    if (file.size > 50 * 1024 * 1024) { setError('Máximo 50MB.'); return }
    setIsUploading(true)
    try { const url = URL.createObjectURL(file); if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url); setImportedDocument({ file, name: file.name, size: file.size, url, uploadedAt: new Date() }); setSuccess(`"${file.name}" importado!`); setTimeout(() => setSuccess(null), 3000) }
    catch { setError('Erro ao importar.') }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }
  function handleImportClick() { fileInputRef.current?.click() }
  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) { if (e.target.files?.[0]) processFile(e.target.files[0]) }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); if (!formConcluded && !myEvaluationSubmitted) setIsDraggingOver(true) }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); setIsDraggingOver(false) }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); setIsDraggingOver(false); if (!formConcluded && !myEvaluationSubmitted && e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]) }
  function handleRemoveImported() { if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url); setImportedDocument(null) }
  useEffect(() => { return () => { if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url) } }, [])

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  useEffect(() => { if (isProtocol && id) loadProtocolEvaluation(); else if (id) loadTopicEvaluation() }, [id, isProtocol])
  useEffect(() => { if (protocol?.latest_document?.download_url) loadDocumentForViewer(protocol.latest_document.download_url) }, [protocol])
  async function loadDocumentForViewer(url: string) { setDocumentLoading(true); try { setDocumentUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`) } catch { setDocumentError('Erro ao carregar.') } finally { setDocumentLoading(false) } }

  async function loadTopicEvaluation() { setLoading(true); try { const d = await topicService.listForReviewer(); const t = d.topics.find(t => t.id === id); if (!t) throw new Error('Tema não encontrado.'); setTopic(t); const dec = t.my_assignment?.evaluation?.decision ?? null; setMyDecision(dec); setEvaluationDone(Boolean(dec) || isTopicClosed(t.status)); if (dec) setSuccess(`Avaliação: ${decisionLabel(dec)}.`); const r = await topicService.getComments(id); setComments(r.comments || []) } catch (e: any) { setError(e.message) } finally { setLoading(false) } }
  async function addComment(e: React.FormEvent) { e.preventDefault(); if (!newComment.trim() || evaluationDone) return; setSubmitting(true); try { await topicService.submitComment(id, newComment); setNewComment(''); await loadTopicEvaluation() } catch (e: any) { setError(e.message) } finally { setSubmitting(false) } }
  async function submitDecision() { if (!decision || evaluationDone) return; setSubmitting(true); try { await topicService.submitEvaluation(id, decision); setEvaluationDone(true); await loadTopicEvaluation() } catch (e: any) { setError(e.message) } finally { setSubmitting(false) } }

  async function loadProtocolEvaluation() { setLoading(true); try { const d = await protocolService.listForReviewer(); const p = d.protocols.find(p => p.id === id); if (!p) { setError('Protocolo não encontrado.'); setLoading(false); return }; setProtocol(p); const formsData = await evaluationService.listForReviewer(); const form = formsData.evaluation_forms.find(f => f.protocol_id === id); if (!form) { setError('Ficha não encontrada.'); setLoading(false); return }; const full = await evaluationService.getForm(form.id); setEvaluationForm(full.evaluation_form); const evals = full.evaluation_form.reviewer_evaluations || []; const uid = user?.id ? Number(user.id) : null; const me = evals.find(re => uid !== null && re.reviewer?.user?.id === uid); const allSub = evals.length > 0 && evals.every(re => re.status === 'submitted'); const concluded = full.evaluation_form.status === 'concluded'; setFormConcluded(concluded); setMyEvaluationSubmitted(me?.status === 'submitted'); setAllReviewersSubmitted(allSub); setProtocolDecision(full.evaluation_form.final_decision || (me as any)?.recommendation || null); setRecommendation(''); setOverallComment(''); setFinalDecision(''); setConclusionSummary(full.evaluation_form.conclusion_summary || ''); setCriterionReviews({}); setOpinionResult(null); const other = evals.find(re => uid !== null && re.reviewer?.user?.id !== uid); if (other) { setOtherReviewerEval(other); const revs: Record<number, string> = {}; other.criterion_reviews?.forEach(cr => { if (cr.evaluation_form_criterion_id) revs[cr.evaluation_form_criterion_id] = cr.comment || '' }); setOtherReviewerCriterionReviews(revs) } else { setOtherReviewerEval(null); setOtherReviewerCriterionReviews({}) }; if (me?.criterion_reviews) { const revs: Record<number, string> = {}; me.criterion_reviews.forEach(cr => { if (cr.evaluation_form_criterion_id) revs[cr.evaluation_form_criterion_id] = cr.comment || '' }); setCriterionReviews(revs) }; try { const { opinions } = await protocolService.listOpinions(id); if (opinions[0]) setOpinionResult({ id: opinions[0].id, decision: opinions[0].decision, issued_at: opinions[0].issued_at, document_url: opinions[0].document_url || undefined, download_url: opinions[0].download_url || undefined, evaluation_form_download_url: opinions[0].evaluation_form_download_url || undefined }) } catch {} } catch (e: any) { setError(e.message) } finally { setLoading(false) } }
  async function handleSaveCriterionReview(fcId: number) { if (!evaluationForm || myEvaluationSubmitted || formConcluded) return; try { await evaluationService.saveCriterionReview(evaluationForm.id, fcId, criterionReviews[fcId] || null) } catch (e: any) { setError(e.message) } }
  async function openFile(url?: string | null, name?: string) { if (url) try { await evaluationService.openFile(url, name) } catch {} }
  async function downloadFile(url?: string | null, name?: string) { if (url) try { await evaluationService.downloadFile(url, name) } catch {} }

  async function handleSubmitEvaluation() { if (!evaluationForm || !recommendation || myEvaluationSubmitted || formConcluded) return; setSubmitting(true); try { if (importedDocument?.file) await protocolService.uploadReviewedDocument(id, importedDocument.file); const result = await evaluationService.submit(evaluationForm.id, recommendation === 'approved' ? 'approved' : 'not_approved', overallComment || null); setSuccess(result.message); setMyEvaluationSubmitted(true); await loadProtocolEvaluation() } catch (e: any) { setError(e.message) } finally { setSubmitting(false) } }
  async function handleDecide() { if (!evaluationForm || formConcluded || !finalDecision) return; setSubmitting(true); try { const r = await evaluationService.decide(evaluationForm.id, finalDecision, conclusionSummary || null); setSuccess(r.message); setFormConcluded(true); setProtocolDecision(finalDecision); if (r.opinion) setOpinionResult(r.opinion) } catch (e: any) { setError(e.message) } finally { setSubmitting(false) } }

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading) return <div className="page-loader"><div className="page-loader__spinner" /><span className="page-loader__text">A carregar avaliação...</span></div>

  // ═══════════════════════════════════════════════
  // TOPIC EVALUATION
  // ═══════════════════════════════════════════════
  if (!isProtocol && topic) {
    return (
      <div className="evaluation-topic-page">
        <header className="evaluation-topic-header">
          <div>
            <div className="evaluation-title-row">
              <Link to="/reviews" className="evaluation-back"><span className="material-symbols-outlined">arrow_back</span></Link>
              <h1>Avaliação do tema #{id}</h1>
            </div>
            <p className="evaluation-topic-title">{topic.title}</p>
            {topic.status_label && (
              <span className={`badge ${topic.status === 'topic_approved_nucleo' ? 'badge-success' : topic.status === 'topic_rejected_nucleo' ? 'badge-error' : 'badge-warning'}`}>
                {topic.status_label}
              </span>
            )}
          </div>
        </header>

        {topic && <TopicJustification justification={topic.justification} showEmpty />}

        {success && <div className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
        {error && <div className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}

        {evaluationDone && (
          <div className="evaluation-done-banner">
            <span className="material-symbols-outlined">task_alt</span>
            <div><strong>Processo concluído</strong><p>{evaluationStatusMessage(topic)}</p></div>
          </div>
        )}

        {/* COMENTÁRIOS */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 className="section-title"><span className="material-symbols-outlined">chat</span>Comentários ({comments.length})</h2>
          {comments.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">forum</span>Nenhum comentário ainda.</div>
          ) : (
            <div className="comments-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{c.user?.name || 'Anónimo'}</span>
                    <span className="comment-date">{new Date(c.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {!evaluationDone && (
            <form onSubmit={addComment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label htmlFor="comment" style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface)' }}>
                Adicionar comentário
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Escreva o seu comentário técnico-científico..."
                rows={4}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface-container-lowest)',
                  color: 'var(--on-surface)',
                  fontFamily: 'var(--font-family)', fontSize: '13px',
                  resize: 'vertical',
                }}
              />
              <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()} style={{ alignSelf: 'flex-end' }}>
                {submitting ? 'A enviar...' : 'Comentar'}
              </button>
            </form>
          )}
        </section>

        {/* DECISÃO FINAL */}
        {!evaluationDone && (
          <section className="card decision-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 className="section-title"><span className="material-symbols-outlined">gavel</span>Decisão final</h2>

            <div className="decision-options" style={{ width: '100%' }}>
              <label className={`decision-option ${decision === 'approved' ? 'is-approved' : ''}`} style={{ flex: 1 }}>
                <input type="radio" name="decision" checked={decision === 'approved'} onChange={() => setDecision('approved')} />
                <span className="material-symbols-outlined">check_circle</span>
                Aprovado
              </label>
              <label className={`decision-option ${decision === 'rejected' ? 'is-rejected' : ''}`} style={{ flex: 1 }}>
                <input type="radio" name="decision" checked={decision === 'rejected'} onChange={() => setDecision('rejected')} />
                <span className="material-symbols-outlined">cancel</span>
                Não Aprovado
              </label>
            </div>

            <button onClick={submitDecision} className="btn btn-primary btn-block" disabled={!decision || submitting}>
              {submitting ? 'A processar...' : 'Confirmar decisão'}
            </button>
          </section>
        )}

        {evaluationDone && (
          <Link to="/reviews" className="btn btn-outline back-link">
            <span className="material-symbols-outlined">arrow_back</span>Voltar para lista de temas
          </Link>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // PROTOCOL EVALUATION (SPLIT-VIEW)
  // ═══════════════════════════════════════════════
  if (isProtocol && protocol) {
    const finalProtocolDecision = evaluationForm?.final_decision || protocolDecision
    const protocolEvaluationState = formConcluded ? 'Concluído' : myEvaluationSubmitted ? 'Submetido' : 'Pendente'
    const protocolCode = protocol.code || `ISC-P-${id}`
    const docFileName = protocol.latest_document?.file_name || `${protocolCode}.docx`

    return (
      <div className={`evaluation-split-view ${isDragging ? 'is-dragging' : ''}`} ref={containerRef}>
        {/* LEFT: DOCUMENT VIEWER */}
        <section className="doc-viewer-pane" style={{ width: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0%' : `${splitPosition}%`, minWidth: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0px' : `${MIN_PANEL_WIDTH}px`, opacity: expandedPanel === 'form' ? 0 : 1, pointerEvents: expandedPanel === 'form' ? 'none' : 'auto' }}>
          <div className="doc-toolbar"><div className="doc-toolbar-left"><button className="panel-toggle-btn" onClick={toggleDocumentFullscreen}><span className="material-symbols-outlined">{expandedPanel === 'document' ? 'collapse_content' : 'expand_content'}</span></button><span className="doc-filename">{docFileName}</span><span className="doc-file-type-badge">DOCX</span></div><div className="doc-toolbar-right"><button onClick={() => openFile(protocol.latest_document?.download_url)}><span className="material-symbols-outlined">open_in_new</span></button></div></div>
          <div className={`doc-content-area ${isDraggingOver ? 'doc-content-area--drag-over' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} ref={dropZoneRef}>
            {isDraggingOver && <div className="doc-drop-overlay"><span className="material-symbols-outlined">cloud_upload</span><p>Solte o arquivo aqui</p></div>}
            {documentLoading ? <div className="doc-state-loading"><div className="doc-spinner" /><p>A carregar...</p></div> : documentError ? <div className="doc-state-error"><span className="material-symbols-outlined">error_outline</span><p>{documentError}</p></div> : !documentUrl ? <div className="doc-state-empty"><span className="material-symbols-outlined">description</span><p>Nenhum documento</p></div> : <div className="doc-viewer-iframe-wrapper"><iframe src={documentUrl} className="doc-viewer-iframe" title="Documento" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" /></div>}
          </div>
          <div className="doc-bottom-bar"><div className="doc-bottom-bar-left"><span className="material-symbols-outlined">description</span><span className="doc-bottom-filename">{docFileName}</span></div><div className="doc-bottom-bar-right"><button className="doc-bottom-btn doc-bottom-btn--download" onClick={() => downloadFile(protocol.latest_document?.download_url)}><span className="material-symbols-outlined">download</span><span>Download</span></button><div className="doc-bottom-divider" /><input ref={fileInputRef} type="file" accept=".docx,.doc,.pdf" onChange={handleFileSelected} style={{ display: 'none' }} />{importedDocument ? <div className="doc-imported-preview"><div className="doc-imported-preview-icon"><span className="material-symbols-outlined">description</span></div><div className="doc-imported-preview-info"><span className="doc-imported-preview-name">{importedDocument.name}</span><span className="doc-imported-preview-size">{formatFileSize(importedDocument.size)}</span></div><div className="doc-imported-preview-actions"><button className="doc-imported-preview-replace" onClick={handleImportClick}><span className="material-symbols-outlined">swap_horiz</span></button><button className="doc-imported-preview-remove" onClick={handleRemoveImported}><span className="material-symbols-outlined">close</span></button></div></div> : <button className="doc-bottom-btn doc-bottom-btn--import" onClick={handleImportClick} disabled={isUploading || formConcluded || myEvaluationSubmitted}><span className="material-symbols-outlined">upload_file</span><span>Importar</span></button>}{importedDocument && <span className="doc-imported-badge"><span className="material-symbols-outlined">check_circle</span>Pronto</span>}</div></div>
        </section>
        {/* DIVIDER */}
        <div ref={dividerRef} className={`split-pane-divider ${isDragging ? 'is-dragging' : ''}`} onMouseDown={handleMouseDown}><div className="split-pane-divider-handle"><span className="material-symbols-outlined">drag_indicator</span></div></div>
        {/* RIGHT: FICHA DE AVALIAÇÃO */}
        <section className="evaluation-form-pane" style={{ width: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0%' : `${100 - splitPosition}%`, minWidth: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0px' : `${MIN_PANEL_WIDTH}px`, opacity: expandedPanel === 'document' ? 0 : 1, pointerEvents: expandedPanel === 'document' ? 'none' : 'auto' }}>
          <div className="evaluation-form-header"><span className="material-symbols-outlined">fact_check</span><div className="form-tabs"><button className={`form-tab ${activeFormTab === 'my-evaluation' ? 'is-active' : ''}`} onClick={() => setActiveFormTab('my-evaluation')}><span className="material-symbols-outlined">edit_note</span>Minha Avaliação</button>{otherReviewerEval && <button className={`form-tab ${activeFormTab === 'other-evaluation' ? 'is-active' : ''}`} onClick={() => setActiveFormTab('other-evaluation')}><span className="material-symbols-outlined">visibility</span>{otherReviewerEval.reviewer?.user?.name || 'Outro Revisor'}</button>}{otherReviewerEval && <button className={`form-tab ${activeFormTab === 'comparison' ? 'is-active' : ''}`} onClick={() => setActiveFormTab('comparison')}><span className="material-symbols-outlined">compare_arrows</span>Comparar</button>}</div><button className="panel-toggle-btn panel-toggle-btn--form" onClick={toggleFormFullscreen}><span className="material-symbols-outlined">{expandedPanel === 'form' ? 'collapse_content' : 'expand_content'}</span></button></div>
          <div className="evaluation-form-content">
            <div className="eval-info-card"><div className="eval-info-header"><span className="eval-info-label">Estado</span><span className={`eval-info-badge ${formConcluded ? 'is-concluded' : myEvaluationSubmitted ? 'is-submitted' : 'is-pending'}`}>{protocolEvaluationState}</span></div><h4>Ficha de Avaliação</h4><p>{protocolCode} — {protocol.topic?.title || protocol.version}</p></div>
            {success && <div className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
            {error && <div className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}
            {formConcluded && <div className={`eval-outcome-banner ${finalProtocolDecision === 'approved' ? 'is-approved' : 'is-rejected'}`}><span className="material-symbols-outlined">{finalProtocolDecision === 'approved' ? 'check_circle' : 'cancel'}</span><div><strong>{finalProtocolDecision === 'approved' ? 'Protocolo Aprovado' : 'Protocolo Reprovado'}</strong><p>{evaluationForm?.conclusion_summary || 'Processo concluído.'}</p></div></div>}
            {evaluationForm && <div className="eval-reviewer-status"><h3><span className="material-symbols-outlined">group</span>Estado dos Revisores</h3><div className="reviewer-chips-list">{(evaluationForm.reviewer_evaluations || []).map((re, i) => { const isMe = user?.id && re.reviewer?.user?.id === Number(user.id); return <span key={re.id} className={`reviewer-chip ${re.status === 'submitted' ? 'is-submitted' : ''} ${isMe ? 'is-you' : ''}`}>{re.reviewer?.user?.name || `Revisor #${i+1}`}{isMe ? ' (você)' : ''}: {re.status === 'submitted' ? 'Submetido' : 'Pendente'}</span> })}</div></div>}
            {activeFormTab === 'my-evaluation' && evaluationForm && (
              <>
                <div className="eval-criteria-section">{Object.entries((evaluationForm.form_criteria || []).reduce<Record<string, FormCriterion[]>>((g, c) => { const k = c.group_name || 'Outros'; if (!g[k]) g[k] = []; g[k].push(c); return g }, {})).map(([group, criteria]) => <div key={group} className="criteria-group-block"><h3 className="criteria-group-title"><span className="material-symbols-outlined">checklist</span>{group}</h3>{criteria.map(c => { const my = criterionReviews[c.id] || ''; return <div key={c.id} className="criterion-item"><div className="criterion-header"><label>{c.criterion_name}</label><div className="criterion-rating">{[1,2,3,4,5].map(s => <button key={s} className={`rating-dot ${my?.startsWith(`Nota ${s}`) ? 'is-active' : ''}`} onClick={() => { if (myEvaluationSubmitted || formConcluded) return; setCriterionReviews(prev => ({ ...prev, [c.id]: `Nota ${s}/5 - ${(my?.replace(/^Nota \d\/5 - /, '') || '')}` })) }} disabled={myEvaluationSubmitted || formConcluded}>{s}</button>)}</div></div><textarea value={my?.replace(/^Nota \d\/5 - /, '') || ''} onChange={e => setCriterionReviews(prev => ({ ...prev, [c.id]: e.target.value }))} onBlur={() => handleSaveCriterionReview(c.id)} placeholder="Observações..." rows={3} disabled={myEvaluationSubmitted || formConcluded} /></div> })}</div>)}</div>
                {!formConcluded && !myEvaluationSubmitted && (
                  <div className="eval-recommendation-section"><h3><span className="material-symbols-outlined">rate_review</span>Conclusão</h3><div className="eval-field"><label>Resumo</label><textarea value={overallComment} onChange={e => setOverallComment(e.target.value)} placeholder="Resumo..." rows={3} /></div><div className="recommendation-choices"><label className={`recommendation-choice ${recommendation === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="rec" checked={recommendation === 'approved'} onChange={() => setRecommendation('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovar</label><label className={`recommendation-choice ${recommendation === 'rejected' ? 'is-rejected' : ''}`}><input type="radio" name="rec" checked={recommendation === 'rejected'} onChange={() => setRecommendation('rejected')} /><span className="material-symbols-outlined">cancel</span>Reprovar</label></div><button className="btn btn-primary btn-block btn-lg" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}>{submitting ? 'A submeter...' : importedDocument ? 'Enviar + Documento' : 'Submeter Avaliação'}</button></div>
                )}
              </>
            )}
            <div style={{ height: 40 }} />
          </div>
          {!formConcluded && evaluationForm && <div className="eval-form-footer"><div className="eval-footer-left"><Link to="/reviews" className="btn btn-outline btn-sm"><span className="material-symbols-outlined">arrow_back</span>Voltar</Link></div><div className="eval-footer-right">{!myEvaluationSubmitted && <><button className="btn btn-outline btn-sm" onClick={() => setRecommendation('rejected')}><span className="material-symbols-outlined">cancel</span>Rejeitar</button><button className="btn btn-outline btn-sm"><span className="material-symbols-outlined">edit_note</span>Correções</button><button className="btn btn-primary" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}><span className="material-symbols-outlined">check_circle</span>{importedDocument ? 'Enviar' : 'Aprovar'}</button></>}</div></div>}
        </section>
      </div>
    )
  }

  return <div className="page-loader"><p>Nenhum dado encontrado.</p><Link to="/reviews" className="btn btn-outline">Voltar</Link></div>
}