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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const mouseX = e.clientX - containerRect.left
      let newSplitPercent = (mouseX / containerWidth) * 100
      const leftPanelPx = (newSplitPercent / 100) * containerWidth
      const rightPanelPx = containerWidth - leftPanelPx
      if (leftPanelPx < MIN_PANEL_WIDTH) newSplitPercent = (MIN_PANEL_WIDTH / containerWidth) * 100
      else if (rightPanelPx < MIN_PANEL_WIDTH) newSplitPercent = ((containerWidth - MIN_PANEL_WIDTH) / containerWidth) * 100
      newSplitPercent = Math.max(20, Math.min(80, newSplitPercent))
      setSplitPosition(newSplitPercent)
    }
    function handleMouseUp() { setIsDragging(false) }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  // ═══════════════════════════════════════════════
  // PANEL TOGGLE
  // ═══════════════════════════════════════════════
  function toggleDocumentFullscreen() {
    if (expandedPanel === 'document') {
      setExpandedPanel('both')
      setSplitPosition(savedSplitPosition.current)
    } else {
      savedSplitPosition.current = splitPosition
      setExpandedPanel('document')
    }
  }

  function toggleFormFullscreen() {
    if (expandedPanel === 'form') {
      setExpandedPanel('both')
      setSplitPosition(savedSplitPosition.current)
    } else {
      savedSplitPosition.current = splitPosition
      setExpandedPanel('form')
    }
  }

  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); toggleDocumentFullscreen() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '\\') { e.preventDefault(); toggleFormFullscreen() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '0') { e.preventDefault(); setSplitPosition(DEFAULT_SPLIT); setExpandedPanel('both') }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [expandedPanel, splitPosition])

  // ═══════════════════════════════════════════════
  // IMPORT / UPLOAD + DRAG & DROP
  // ═══════════════════════════════════════════════
  function processFile(file: File) {
    const allowedExtensions = ['.docx', '.doc', '.pdf']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      setError('Formato não suportado. Use .docx, .doc ou .pdf')
      setTimeout(() => setError(null), 4000)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 50MB.')
      setTimeout(() => setError(null), 4000)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const objectUrl = URL.createObjectURL(file)
      if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url)

      setImportedDocument({
        file,
        name: file.name,
        size: file.size,
        url: objectUrl,
        uploadedAt: new Date(),
      })
      setSuccess(`Documento "${file.name}" importado com sucesso!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError('Erro ao importar arquivo.')
      setTimeout(() => setError(null), 4000)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  // Drag & Drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!formConcluded && !myEvaluationSubmitted) {
      setIsDraggingOver(true)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    if (formConcluded || myEvaluationSubmitted) return

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    processFile(file)
  }

  function handleRemoveImported() {
    if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url)
    setImportedDocument(null)
    setSuccess('Documento importado removido.')
    setTimeout(() => setSuccess(null), 2000)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url)
    }
  }, [])

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (isProtocol && id) loadProtocolEvaluation()
    else if (id) loadTopicEvaluation()
  }, [id, isProtocol])

  useEffect(() => {
    if (protocol?.latest_document?.download_url) {
      loadDocumentForViewer(protocol.latest_document.download_url)
    }
  }, [protocol])

  async function loadDocumentForViewer(downloadUrl: string) {
    setDocumentLoading(true)
    setDocumentError(null)
    try {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(downloadUrl)}&embedded=true`
      setDocumentUrl(viewerUrl)
    } catch (e) {
      setDocumentError((e as Error).message)
      setDocumentUrl(null)
    } finally {
      setDocumentLoading(false)
    }
  }

  // ... (loadTopicEvaluation, loadProtocolEvaluation, etc. - MANTIDAS IGUAIS)

  async function loadTopicEvaluation() {
    setLoading(true)
    try {
      const topicsData = await topicService.listForReviewer()
      const currentTopic = topicsData.topics.find(t => t.id === id)
      if (!currentTopic) throw new Error('Tema não encontrado.')
      setTopic(currentTopic)
      const currentDecision = currentTopic.my_assignment?.evaluation?.decision ?? null
      const isClosed = isTopicClosed(currentTopic.status)
      setMyDecision(currentDecision)
      setEvaluationDone(Boolean(currentDecision) || isClosed)
      setDecision('')
      if (currentDecision) setSuccess(`Avaliação já registada: ${decisionLabel(currentDecision)}.`)
      else if (isClosed) setSuccess('Processo de revisão concluído.')
      else setSuccess(null)
      const response = await topicService.getComments(id)
      setComments(response.comments || [])
      setError(null)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || evaluationDone) return
    setSubmitting(true); setError(null)
    try {
      await topicService.submitComment(id, newComment)
      setNewComment(''); setSuccess('Comentário adicionado!')
      await loadTopicEvaluation(); setTimeout(() => setSuccess(null), 3000)
    } catch (e) { setError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  async function submitDecision() {
    if (!decision || evaluationDone) return
    setSubmitting(true); setError(null)
    try {
      await topicService.submitEvaluation(id, decision)
      setMyDecision(decision); setSuccess(`Tema ${decision === 'approved' ? 'aprovado' : 'rejeitado'}!`)
      setEvaluationDone(true); setDecision('')
      await loadTopicEvaluation(); setTimeout(() => { navigate('/reviews') }, 2000)
    } catch (e) { setError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  async function loadProtocolEvaluation() {
    setLoading(true)
    try {
      const data = await protocolService.listForReviewer()
      const currentProtocol = data.protocols.find(p => p.id === id)
      if (!currentProtocol) throw new Error('Protocolo não encontrado.')
      setProtocol(currentProtocol)

      const formsData = await evaluationService.listForReviewer()
      const form = formsData.evaluation_forms.find(f => f.protocol_id === id)
      if (!form) throw new Error('Ficha de avaliação não encontrada.')

      const fullForm = await evaluationService.getForm(form.id)
      setEvaluationForm(fullForm.evaluation_form)

      const allEvals = fullForm.evaluation_form.reviewer_evaluations || []
      const currentUserId = user?.id ? Number(user.id) : null
      const myEval = allEvals.find(re => currentUserId !== null && re.reviewer?.user?.id === currentUserId)
      const mySubmitStatus = myEval?.status === 'submitted'
      const allSubmitted = allEvals.length > 0 && allEvals.every(re => re.status === 'submitted')
      const concluded = fullForm.evaluation_form.status === 'concluded'

      setFormConcluded(concluded)
      setMyEvaluationSubmitted(mySubmitStatus)
      setAllReviewersSubmitted(allSubmitted)
      setProtocolDecision(fullForm.evaluation_form.final_decision || myEval?.recommendation || null)
      setRecommendation(''); setOverallComment(''); setFinalDecision('')
      setConclusionSummary(fullForm.evaluation_form.conclusion_summary || '')
      setCriterionReviews({}); setOpinionResult(null)

      const otherEval = allEvals.find(re => currentUserId !== null && re.reviewer?.user?.id !== currentUserId)
      if (otherEval) {
        setOtherReviewerEval(otherEval)
        const otherReviews: Record<number, string> = {}
        if (otherEval.criterion_reviews) {
          otherEval.criterion_reviews.forEach(cr => {
            if (cr.evaluation_form_criterion_id && cr.comment) otherReviews[cr.evaluation_form_criterion_id] = cr.comment
          })
        }
        setOtherReviewerCriterionReviews(otherReviews)
      } else {
        setOtherReviewerEval(null); setOtherReviewerCriterionReviews({})
      }

      if (myEval?.criterion_reviews) {
        const reviews: Record<number, string> = {}
        myEval.criterion_reviews.forEach(cr => {
          if (cr.evaluation_form_criterion_id && cr.comment) reviews[cr.evaluation_form_criterion_id] = cr.comment
        })
        setCriterionReviews(reviews)
      }

      if (concluded) setSuccess('Protocolo já avaliado.')
      else if (mySubmitStatus) setSuccess('Avaliação submetida. Aguarde conclusão.')
      else setSuccess(null)

      try {
        const { opinions } = await protocolService.listOpinions(id)
        const latestOpinion = opinions[0]
        if (latestOpinion) {
          setOpinionResult({
            id: latestOpinion.id, decision: latestOpinion.decision, issued_at: latestOpinion.issued_at,
            document_url: latestOpinion.document_url || undefined,
            download_url: latestOpinion.download_url || undefined,
            evaluation_form_download_url: latestOpinion.evaluation_form_download_url || undefined,
          })
        }
      } catch { setOpinionResult(null) }

      setError(null)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  async function handleSaveCriterionReview(formCriterionId: number) {
    if (!evaluationForm || myEvaluationSubmitted || formConcluded) return
    setError(null)
    try {
      const comment = criterionReviews[formCriterionId] || null
      await evaluationService.saveCriterionReview(evaluationForm.id, formCriterionId, comment)
      setSuccess('Comentário guardado!'); setTimeout(() => setSuccess(null), 2000)
    } catch (e) { setError((e as Error).message) }
  }

  async function openFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try { await evaluationService.openFile(url, fallbackFilename) }
    catch (e) { setError((e as Error).message) }
  }

  async function downloadFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return
    try { await evaluationService.downloadFile(url, fallbackFilename) }
    catch (e) { setError((e as Error).message) }
  }

  async function handleSubmitEvaluation() {
    if (!evaluationForm || !recommendation || myEvaluationSubmitted || formConcluded) return
    setSubmitting(true)
    setError(null)
    try {
      if (importedDocument?.file) {
        await protocolService.uploadReviewedDocument(id, importedDocument.file)
      }
      await evaluationService.submit(evaluationForm.id, recommendation, overallComment || null)
      setSuccess('Avaliação submetida com sucesso!')
      setMyEvaluationSubmitted(true)
      await loadProtocolEvaluation()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDecide() {
    if (!evaluationForm || formConcluded || !finalDecision) return
    setSubmitting(true); setError(null)
    try {
      const result = await evaluationService.decide(evaluationForm.id, finalDecision, conclusionSummary || null)
      setSuccess(result.message); setFormConcluded(true)
      setProtocolDecision(finalDecision)
      if (result.opinion) setOpinionResult(result.opinion)
    } catch (e) { setError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ═══════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════
  function renderCriterionRow(criterion: FormCriterion, isReadOnly: boolean = false) {
    const myComment = criterionReviews[criterion.id] || ''
    const otherComment = otherReviewerCriterionReviews[criterion.id] || ''
    const showComparison = activeFormTab === 'comparison' && otherReviewerEval

    return (
      <div key={criterion.id} className="criterion-item">
        <div className="criterion-header">
          <label htmlFor={`criterion-${criterion.id}`}>{criterion.criterion_name}</label>
          <div className="criterion-rating">
            {[1, 2, 3, 4, 5].map(score => (
              <button key={score} type="button"
                className={`rating-dot ${myComment?.startsWith(`Nota ${score}`) ? 'is-active' : ''}`}
                onClick={() => {
                  if (myEvaluationSubmitted || formConcluded || isReadOnly) return
                  const currentComment = myComment?.replace(/^Nota \d\/5 - /, '') || ''
                  setCriterionReviews(prev => ({ ...prev, [criterion.id]: `Nota ${score}/5 - ${currentComment}` }))
                }}
                disabled={myEvaluationSubmitted || formConcluded || isReadOnly}
                title={`Nota ${score}`}
              >{score}</button>
            ))}
          </div>
        </div>
        <div className={showComparison ? 'criterion-comparison' : ''}>
          <div className="criterion-review-block">
            {showComparison && <div className="criterion-review-label criterion-review-label--mine"><span className="material-symbols-outlined">person</span>Minha avaliação</div>}
            <textarea
              id={`criterion-${criterion.id}`}
              value={myComment?.replace(/^Nota \d\/5 - /, '') || ''}
              onChange={e => setCriterionReviews(prev => ({ ...prev, [criterion.id]: e.target.value }))}
              onBlur={() => !isReadOnly && handleSaveCriterionReview(criterion.id)}
              placeholder="Observações sobre este critério..."
              rows={showComparison ? 2 : 3}
              disabled={myEvaluationSubmitted || formConcluded || isReadOnly}
            />
          </div>
          {showComparison && otherReviewerEval && (
            <div className="criterion-review-block criterion-review-block--other">
              <div className="criterion-review-label criterion-review-label--other">
                <span className="material-symbols-outlined">group</span>
                {otherReviewerEval.reviewer?.user?.name || 'Outro Revisor'}
                {otherReviewerEval.status === 'submitted' ? <span className="other-review-badge submitted">Submetido</span> : <span className="other-review-badge pending">Pendente</span>}
              </div>
              {otherComment ? (
                <div className="other-review-content">{otherComment.replace(/^Nota \d\/5 - /, '')}</div>
              ) : (
                <div className="other-review-empty"><span className="material-symbols-outlined">hourglass_empty</span><span>Aguardando...</span></div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading) {
    return <div className="page-loader"><div className="page-loader__spinner" /><span className="page-loader__text">A carregar avaliação...</span></div>
  }

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
              <span className={`badge ${topic.status === 'topic_approved_nucleo' ? 'badge-success' : topic.status === 'topic_rejected_nucleo' ? 'badge-error' : 'badge-warning'}`}>{topic.status_label}</span>
            )}
          </div>
        </header>
        {topic && <TopicJustification justification={topic.justification} showEmpty />}
        {success && <div role="status" className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
        {error && <div role="alert" className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}
        {evaluationDone && (
          <div className="evaluation-done-banner"><span className="material-symbols-outlined">task_alt</span><div><strong>Processo concluído</strong><p>{evaluationStatusMessage(topic)}</p></div></div>
        )}
        <section className="card">
          <h2 className="section-title"><span className="material-symbols-outlined">chat</span>Comentários ({comments.length})</h2>
          {comments.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">forum</span>Nenhum comentário ainda.</div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header"><span className="comment-author">{comment.user?.name || 'Anônimo'}</span><span className="comment-date">{new Date(comment.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        {!evaluationDone && (
          <form onSubmit={addComment} className="card">
            <label htmlFor="comment">Adicionar comentário</label>
            <textarea id="comment" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escreva o seu comentário..." rows={4} />
            <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()}>{submitting ? 'A enviar...' : 'Comentar'}</button>
          </form>
        )}
        {!evaluationDone && (
          <section className="card decision-card">
            <h2 className="section-title"><span className="material-symbols-outlined">gavel</span>Decisão final</h2>
            <div className="decision-options">
              <label className={`decision-option ${decision === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="decision" checked={decision === 'approved'} onChange={() => setDecision('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovado</label>
              <label className={`decision-option ${decision === 'rejected' ? 'is-rejected' : ''}`}><input type="radio" name="decision" checked={decision === 'rejected'} onChange={() => setDecision('rejected')} /><span className="material-symbols-outlined">cancel</span>Não Aprovado</label>
            </div>
            <button onClick={submitDecision} className="btn btn-primary btn-block" disabled={!decision || submitting}>{submitting ? 'A processar...' : 'Confirmar decisão'}</button>
          </section>
        )}
        {evaluationDone && <Link to="/reviews" className="btn btn-outline back-link"><span className="material-symbols-outlined">arrow_back</span>Voltar</Link>}
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
        
        {/* ═══════════════ LEFT: DOCUMENT VIEWER ═══════════════ */}
        <section className="doc-viewer-pane" style={{
          width: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0%' : `${splitPosition}%`,
          minWidth: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0px' : `${MIN_PANEL_WIDTH}px`,
          opacity: expandedPanel === 'form' ? 0 : 1,
          pointerEvents: expandedPanel === 'form' ? 'none' : 'auto',
        }}>
          
          {/* ── Toolbar Superior ── */}
          <div className="doc-toolbar">
            <div className="doc-toolbar-left">
              <button className="panel-toggle-btn" onClick={toggleDocumentFullscreen}
                title={expandedPanel === 'document' ? 'Restaurar (Ctrl+\\)' : 'Expandir (Ctrl+\\)'}>
                <span className="material-symbols-outlined">{expandedPanel === 'document' ? 'collapse_content' : 'expand_content'}</span>
              </button>
              <span className="doc-filename" title={docFileName}>{docFileName}</span>
              <span className="doc-file-type-badge">DOCX</span>
            </div>
            <div className="doc-toolbar-right">
              <button onClick={() => openFile(protocol.latest_document?.download_url, docFileName)} title="Abrir em nova aba">
                <span className="material-symbols-outlined">open_in_new</span>
              </button>
            </div>
          </div>

          {/* ── Área do Documento ── */}
          <div 
            className={`doc-content-area ${isDraggingOver ? 'doc-content-area--drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={dropZoneRef}
          >
            {/* Overlay de Drag & Drop */}
            {isDraggingOver && (
              <div className="doc-drop-overlay">
                <span className="material-symbols-outlined">cloud_upload</span>
                <p>Solte o arquivo aqui para importar</p>
                <span className="doc-drop-formats">.docx, .doc, .pdf (máx. 50MB)</span>
              </div>
            )}

            {documentLoading ? (
              <div className="doc-state-loading"><div className="doc-spinner" /><p>A carregar documento...</p></div>
            ) : documentError ? (
              <div className="doc-state-error">
                <span className="material-symbols-outlined">error_outline</span>
                <p>{documentError}</p>
              </div>
            ) : !documentUrl ? (
              <div className="doc-state-empty">
                <span className="material-symbols-outlined">description</span>
                <p>Nenhum documento disponível</p>
              </div>
            ) : (
              <div className="doc-viewer-iframe-wrapper">
                <iframe src={documentUrl} className="doc-viewer-iframe" title="Documento do Protocolo"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
              </div>
            )}
          </div>

          {/* ═══════════════ BARRA INFERIOR: DOWNLOAD + IMPORTAR ═══════════════ */}
          <div className="doc-bottom-bar">
            <div className="doc-bottom-bar-left">
              <span className="material-symbols-outlined">description</span>
              <span className="doc-bottom-filename">{docFileName}</span>
              <span className="doc-bottom-filesize">
                {protocol.latest_document?.version ? `v${protocol.latest_document.version}` : ''}
              </span>
            </div>

            <div className="doc-bottom-bar-right">
              {/* Botão Download */}
              <button 
                className="doc-bottom-btn doc-bottom-btn--download"
                onClick={() => downloadFile(protocol.latest_document?.download_url, docFileName)}
                title="Baixar documento original"
              >
                <span className="material-symbols-outlined">download</span>
                <span>Download</span>
              </button>

              {/* Separador */}
              <div className="doc-bottom-divider" />

              {/* Área de Importação */}
              <input ref={fileInputRef} type="file" accept=".docx,.doc,.pdf" onChange={handleFileSelected} style={{ display: 'none' }} />
              
              {importedDocument ? (
                /* Documento importado - mostra miniatura */
                <div className="doc-imported-preview">
                  <div className="doc-imported-preview-icon">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div className="doc-imported-preview-info">
                    <span className="doc-imported-preview-name">{importedDocument.name}</span>
                    <span className="doc-imported-preview-size">{formatFileSize(importedDocument.size)}</span>
                  </div>
                  <div className="doc-imported-preview-actions">
                    <button className="doc-imported-preview-replace" onClick={handleImportClick} title="Substituir">
                      <span className="material-symbols-outlined">swap_horiz</span>
                    </button>
                    <button className="doc-imported-preview-remove" onClick={handleRemoveImported} title="Remover">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Sem documento importado - mostra botão de importar */
                <button 
                  className="doc-bottom-btn doc-bottom-btn--import"
                  onClick={handleImportClick}
                  disabled={isUploading || formConcluded || myEvaluationSubmitted}
                  title="Importar documento revisado do computador"
                >
                  <span className="material-symbols-outlined">{isUploading ? 'hourglass_top' : 'upload_file'}</span>
                  <span>{isUploading ? 'Importando...' : 'Importar'}</span>
                </button>
              )}

              {/* Badge de estado */}
              {importedDocument && (
                <span className="doc-imported-badge">
                  <span className="material-symbols-outlined">check_circle</span>
                  Pronto para enviar
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════ DIVIDER ═══════════════ */}
        <div ref={dividerRef} className={`split-pane-divider ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown} title="Arraste para redimensionar">
          <div className="split-pane-divider-handle"><span className="material-symbols-outlined">drag_indicator</span></div>
        </div>

        {/* ═══════════════ RIGHT: FICHA DE AVALIAÇÃO ═══════════════ */}
        <section className="evaluation-form-pane" style={{
          width: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0%' : `${100 - splitPosition}%`,
          minWidth: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0px' : `${MIN_PANEL_WIDTH}px`,
          opacity: expandedPanel === 'document' ? 0 : 1,
          pointerEvents: expandedPanel === 'document' ? 'none' : 'auto',
        }}>
          
          {/* ── Header ── */}
          <div className="evaluation-form-header">
            <span className="material-symbols-outlined">fact_check</span>
            <div className="form-tabs">
              <button className={`form-tab ${activeFormTab === 'my-evaluation' ? 'is-active' : ''}`} onClick={() => setActiveFormTab('my-evaluation')}>
                <span className="material-symbols-outlined">edit_note</span>Minha Avaliação
              </button>
              {otherReviewerEval && (
                <button className={`form-tab ${activeFormTab === 'other-evaluation' ? 'is-active' : ''}`} onClick={() => setActiveFormTab('other-evaluation')}>
                  <span className="material-symbols-outlined">visibility</span>
                  {otherReviewerEval.reviewer?.user?.name || 'Outro Revisor'}
                  {otherReviewerEval.status === 'submitted' && <span className="tab-status-dot tab-status-dot--submitted" />}
                </button>
              )}
              {otherReviewerEval && (
                <button className={`form-tab ${activeFormTab === 'comparison' ? 'is-active' : ''}`} onClick={() => setActiveFormTab('comparison')}>
                  <span className="material-symbols-outlined">compare_arrows</span>Comparar
                </button>
              )}
            </div>
            <button className="panel-toggle-btn panel-toggle-btn--form" onClick={toggleFormFullscreen}
              title={expandedPanel === 'form' ? 'Restaurar (Ctrl+Shift+\\)' : 'Expandir (Ctrl+Shift+\\)'}>
              <span className="material-symbols-outlined">{expandedPanel === 'form' ? 'collapse_content' : 'expand_content'}</span>
            </button>
          </div>

          {/* ── Conteúdo ── */}
          <div className="evaluation-form-content">
            <div className="eval-info-card">
              <div className="eval-info-header">
                <span className="eval-info-label">Estado Atual</span>
                <span className={`eval-info-badge ${formConcluded ? 'is-concluded' : myEvaluationSubmitted ? 'is-submitted' : 'is-pending'}`}>{protocolEvaluationState}</span>
              </div>
              <h4>Ficha de Avaliação Científica</h4>
              <p>{protocolCode} — {protocol.topic?.title || protocol.version}</p>
            </div>

            {success && <div role="status" className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
            {error && <div role="alert" className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}

            {formConcluded && (
              <div className={`eval-outcome-banner ${finalProtocolDecision === 'approved' ? 'is-approved' : 'is-rejected'}`}>
                <span className="material-symbols-outlined">{finalProtocolDecision === 'approved' ? 'check_circle' : 'cancel'}</span>
                <div>
                  <strong>{finalProtocolDecision === 'approved' ? 'Protocolo Aprovado' : 'Protocolo Reprovado'}</strong>
                  <p>{evaluationForm?.conclusion_summary || 'Processo concluído.'}</p>
                </div>
              </div>
            )}

            {evaluationForm && (
              <div className="eval-reviewer-status">
                <h3><span className="material-symbols-outlined">group</span>Estado dos Revisores</h3>
                <div className="reviewer-chips-list">
                  {(evaluationForm.reviewer_evaluations || []).map((re, idx) => {
                    const isCurrentUser = user?.id && re.reviewer?.user?.id === Number(user.id)
                    return (
                      <span key={re.id} className={`reviewer-chip ${re.status === 'submitted' ? 'is-submitted' : ''} ${isCurrentUser ? 'is-you' : ''}`}>
                        {re.reviewer?.user?.name || `Revisor #${idx + 1}`}{isCurrentUser ? ' (você)' : ''}: {re.status === 'submitted' ? 'Submetido' : 'Pendente'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Critérios */}
            {activeFormTab === 'my-evaluation' && evaluationForm && (
              <>
                <div className="eval-criteria-section">
                  {Object.entries(
                    (evaluationForm.form_criteria || []).reduce<Record<string, FormCriterion[]>>((groups, c) => {
                      const group = c.group_name || 'Outros'
                      if (!groups[group]) groups[group] = []
                      groups[group].push(c)
                      return groups
                    }, {})
                  ).map(([groupName, criteria]) => (
                    <div key={groupName} className="criteria-group-block">
                      <h3 className="criteria-group-title"><span className="material-symbols-outlined">checklist</span>{groupName}</h3>
                      {criteria.map(criterion => renderCriterionRow(criterion, false))}
                    </div>
                  ))}
                </div>

                {!formConcluded && !myEvaluationSubmitted && (
                  <div className="eval-recommendation-section">
                    <h3><span className="material-symbols-outlined">rate_review</span>Conclusão</h3>
                    <div className="eval-field">
                      <label htmlFor="overall-comment">Resumo / Parecer</label>
                      <textarea id="overall-comment" value={overallComment} onChange={e => setOverallComment(e.target.value)} placeholder="Resumo da sua avaliação..." rows={3} />
                    </div>
                    <div className="recommendation-choices">
                      <label className={`recommendation-choice ${recommendation === 'approved' ? 'is-approved' : ''}`}>
                        <input type="radio" name="recommendation" checked={recommendation === 'approved'} onChange={() => setRecommendation('approved')} />
                        <span className="material-symbols-outlined">check_circle</span>Aprovar protocolo
                      </label>
                      <label className={`recommendation-choice ${recommendation === 'rejected' ? 'is-rejected' : ''}`}>
                        <input type="radio" name="recommendation" checked={recommendation === 'rejected'} onChange={() => setRecommendation('rejected')} />
                        <span className="material-symbols-outlined">cancel</span>Reprovar protocolo
                      </label>
                    </div>
                    <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}>
                      {submitting ? 'A submeter...' : importedDocument ? 'Enviar Avaliação + Documento' : 'Submeter Avaliação'}
                    </button>
                  </div>
                )}
              </>
            )}

            {evaluationForm && !formConcluded && allReviewersSubmitted && (
              <div className="eval-final-decision">
                <h3><span className="material-symbols-outlined">gavel</span>Decisão Final</h3>
                <p>Todos os revisores submeteram.</p>
                <div className="eval-field">
                  <label htmlFor="conclusion-summary">Resumo</label>
                  <textarea id="conclusion-summary" value={conclusionSummary} onChange={e => setConclusionSummary(e.target.value)} placeholder="Resumo..." rows={3} />
                </div>
                <div className="recommendation-choices">
                  <label className={`recommendation-choice ${finalDecision === 'approved' ? 'is-approved' : ''}`}>
                    <input type="radio" name="final-decision" checked={finalDecision === 'approved'} onChange={() => setFinalDecision('approved')} />
                    <span className="material-symbols-outlined">check_circle</span>Aprovar
                  </label>
                  <label className={`recommendation-choice ${finalDecision === 'rejected' ? 'is-rejected' : ''}`}>
                    <input type="radio" name="final-decision" checked={finalDecision === 'rejected'} onChange={() => setFinalDecision('rejected')} />
                    <span className="material-symbols-outlined">cancel</span>Reprovar
                  </label>
                </div>
                <button className="btn btn-primary btn-block btn-lg" onClick={handleDecide} disabled={!finalDecision || submitting}>
                  {submitting ? 'A confirmar...' : 'Confirmar Decisão Final'}
                </button>
              </div>
            )}

            <div style={{ height: '40px' }} />
          </div>

          {/* ── Footer ── */}
          {!formConcluded && evaluationForm && (
            <div className="eval-form-footer">
              <div className="eval-footer-left">
                <Link to="/reviews" className="btn btn-outline btn-sm"><span className="material-symbols-outlined">arrow_back</span>Voltar</Link>
              </div>
              <div className="eval-footer-right">
                {!myEvaluationSubmitted && (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() => setRecommendation('rejected')}><span className="material-symbols-outlined">cancel</span>Rejeitar</button>
                    <button className="btn btn-outline btn-sm"><span className="material-symbols-outlined">edit_note</span>Pedir Correções</button>
                    <button className="btn btn-primary" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}>
                      <span className="material-symbols-outlined">check_circle</span>
                      {importedDocument ? 'Enviar com Revisão' : 'Aprovar Protocolo'}
                    </button>
                  </>
                )}
                {allReviewersSubmitted && !formConcluded && (
                  <button className="btn btn-primary" onClick={handleDecide} disabled={!finalDecision || submitting}>
                    <span className="material-symbols-outlined">gavel</span>Decidir
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="page-loader"><p>Nenhum dado encontrado.</p><Link to="/reviews" className="btn btn-outline">Voltar</Link></div>
  )
}