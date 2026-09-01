// src/pages/reviewer/EvaluationPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  topicService,
  type Topic,
  type TopicReviewComment,
} from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { evaluationService, type EvaluationForm, type EvaluationOrgan, type FormCriterion } from '../../services/evaluationService'
import { useAuth } from '../../context/AuthContext'
import OnlyOfficeEditor from '../../components/OnlyOfficeEditor/OnlyOfficeEditor'
import { ReviewerProtocolAttachmentsDialog } from '../../components/protocol/ReviewerProtocolAttachmentsDialog'
import { ProtocolReviewContext } from '../../components/protocol/ProtocolReviewContext'
import { DocumentReviewWorkspace } from '../../components/teacher/DocumentReviewWorkspace'
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
  if (topic.status === 'topic_rejected_nucleo') return 'Este tema não foi aprovado pelo Núcleo Científico.'
  return ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function organForEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): EvaluationOrgan {
  return form?.organ === 'comite_bioetica' ? 'comite-bioetica' : 'comite-cientifico'
}

function isCcEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): boolean {
  return form?.organ === 'comite_cientifico'
}

function isBioeticaEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): boolean {
  return form?.organ === 'comite_bioetica'
}

function isSharedCommitteeEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): boolean {
  return isCcEvaluation(form) || isBioeticaEvaluation(form)
}

function committeeLabel(form?: Pick<EvaluationForm, 'organ'> | null): string {
  if (isBioeticaEvaluation(form)) return 'Comité de Bioética'
  if (isCcEvaluation(form)) return 'Comité Científico'
  return 'órgão'
}

function isReviewerDone(status?: string, isEvaluated?: boolean): boolean {
  return status === 'submitted' || Boolean(isEvaluated)
}

function preliminaryDecisionLabel(decision?: string | null): string {
  if (decision === 'approved') return 'Aprovado'
  if (decision === 'not_approved') return 'Não aprovado'
  return 'Sem opinião'
}

function getEvaluationState(evaluationForm: EvaluationForm | null, mySubmitted: boolean, isScientificCommittee = false): {
  label: string
  className: string
  description: string
} {
  if (!evaluationForm) return { label: 'Carregando...', className: 'is-pending', description: '' }
  const status = evaluationForm.status
  switch (status) {
    case 'pending_review':
    case 'in_review':
      return {
        label: mySubmitted ? 'Aguardando outro revisor' : 'Em avaliação',
        className: mySubmitted ? 'is-submitted' : 'is-pending',
        description: isScientificCommittee
          ? (mySubmitted ? 'A sua revisão foi marcada como avaliada. Aguardando o outro revisor.' : 'Revise o documento no OnlyOffice e marque como avaliado.')
              : (mySubmitted ? 'A sua avaliação foi submetida. Aguardando o outro revisor.' : 'Preencha os critérios e submeta a sua avaliação.'),
      }
    case 'deliberation_pending':
      return {
        label: 'Deliberação Pendente',
        className: 'is-deliberation-pending',
        description: isScientificCommittee
          ? 'Os revisores concluíram a revisão prévia. A secretaria precisa agendar a reunião de deliberação.'
          : 'Os revisores concluíram a avaliação. A secretaria precisa agendar uma reunião de deliberação.',
      }
    case 'deliberation_scheduled':
      return {
        label: 'Deliberação Agendada',
        className: 'is-deliberation-scheduled',
        description: `Reunião marcada para ${formatDate(evaluationForm.deliberation_date)} em ${evaluationForm.deliberation_location || 'local a definir'}.`,
      }
    case 'in_deliberation':
      return {
        label: 'Em Deliberação',
        className: 'is-deliberation-active',
        description: 'Reunião de deliberação em andamento. Os comentários são partilhados entre os revisores.',
      }
    case 'concluded':
      return {
        label: evaluationForm.final_decision === 'approved' ? 'Aprovado' : 'Não Aprovado',
        className: evaluationForm.final_decision === 'approved' ? 'is-concluded' : 'is-rejected',
        description: evaluationForm.conclusion_summary || 'Processo concluído.',
      }
    default:
      return { label: status, className: 'is-pending', description: '' }
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'data não definida'
  try {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

type ExpandedPanel = 'both' | 'document' | 'form'

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
  const { user, hasPermission } = useAuth()
  const isProtocol = !!protocolId
  const id = Number(protocolId || topicId)

  // ── Topic state ──
  const [topic, setTopic] = useState<Topic | null>(null)
  const [comments, setComments] = useState<TopicReviewComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [evaluationDone, setEvaluationDone] = useState(false)

  // ── Protocol state ──
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null)
  const [criterionReviews, setCriterionReviews] = useState<Record<number, string>>({})
  const [recommendation, setRecommendation] = useState<'approved' | 'rejected' | ''>('')
  const [overallComment, setOverallComment] = useState('')
  const [formConcluded, setFormConcluded] = useState(false)
  const [myEvaluationSubmitted, setMyEvaluationSubmitted] = useState(false)
  const [isSecretary, setIsSecretary] = useState(false)

  // ── Deliberation state ──
  const [deliberationDecision, setDeliberationDecision] = useState<'approved' | 'not_approved' | ''>('')
  const [deliberationSummary, setDeliberationSummary] = useState('')
  const [isSubmittingDeliberation, setIsSubmittingDeliberation] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [deliberationDate, setDeliberationDate] = useState('')
  const [deliberationLocation, setDeliberationLocation] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)

  // ── Shared state ──
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── OnlyOffice state ──
  const [onlyOfficeFullscreen, setOnlyOfficeFullscreen] = useState(false)
  const [onlyOfficeKey, setOnlyOfficeKey] = useState(0)
  const [showAttachments, setShowAttachments] = useState(false)

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
  function toggleDocumentFullscreen() {
    if (expandedPanel === 'document') { setExpandedPanel('both'); setSplitPosition(savedSplitPosition.current) }
    else { savedSplitPosition.current = splitPosition; setExpandedPanel('document') }
  }
  function toggleFormFullscreen() {
    if (expandedPanel === 'form') { setExpandedPanel('both'); setSplitPosition(savedSplitPosition.current) }
    else { savedSplitPosition.current = splitPosition; setExpandedPanel('form') }
  }
  function toggleOnlyOfficeFullscreen() { setOnlyOfficeFullscreen(prev => !prev) }
  function reloadOnlyOffice() {
    setOnlyOfficeKey(-1)
    setTimeout(() => { setOnlyOfficeKey(prev => Math.abs(prev) + 1) }, 150)
  }

  useEffect(() => {
    function k(e: KeyboardEvent) {
      if (e.key === 'Escape' && onlyOfficeFullscreen) { setOnlyOfficeFullscreen(false) }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); toggleDocumentFullscreen() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '\\') { e.preventDefault(); toggleFormFullscreen() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '0') { e.preventDefault(); setSplitPosition(DEFAULT_SPLIT); setExpandedPanel('both') }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [expandedPanel, splitPosition, onlyOfficeFullscreen])

  // ═══════════════════════════════════════════════
  // IMPORT / UPLOAD
  // ═══════════════════════════════════════════════
  function processFile(file: File) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!['.docx', '.doc', '.pdf'].includes(ext)) { setError('Formato não suportado.'); return }
    if (file.size > 50 * 1024 * 1024) { setError('Máximo 50MB.'); return }
    setIsUploading(true)
    try {
      const url = URL.createObjectURL(file)
      if (importedDocument?.url) URL.revokeObjectURL(importedDocument.url)
      setImportedDocument({ file, name: file.name, size: file.size, url, uploadedAt: new Date() })
      setSuccess(`"${file.name}" importado!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch { setError('Erro ao importar.') }
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

  async function loadTopicEvaluation() {
    setLoading(true)
    try {
      const d = await topicService.listForReviewer()
      const t = d.topics.find(t => t.id === id)
      if (!t) throw new Error('Tema não encontrado.')
      setTopic(t)
      const dec = t.my_assignment?.evaluation?.decision ?? null
      setEvaluationDone(Boolean(dec) || isTopicClosed(t.status))
      if (dec) setSuccess(`Avaliação: ${decisionLabel(dec)}.`)
      const r = await topicService.getComments(id)
      setComments(r.comments || [])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  async function addComment() {
    if (!newComment.trim() || evaluationDone) return
    setSubmitting(true)
    try { await topicService.submitComment(id, newComment); setNewComment(''); await loadTopicEvaluation() } catch (e: any) { setError(e.message) } finally { setSubmitting(false) }
  }

  async function submitDecision() {
    if (!decision || evaluationDone) return
    if (decision === 'rejected' && comments.length === 0) {
      setError('Registe pelo menos um comentário antes de não aprovar o tema.')
      return
    }
    setSubmitting(true)
    try {
      const myLatestComment = [...comments].reverse().find(comment => comment.user?.id === Number(user?.id))
      await topicService.submitEvaluation(id, decision, myLatestComment?.id ?? null)
      setEvaluationDone(true)
      await loadTopicEvaluation()
    } catch (e: any) { setError(e.message) } finally { setSubmitting(false) }
  }

  async function loadProtocolEvaluation() {
    setLoading(true)
    try {
      // 1. Buscar protocolo
      const d = await protocolService.listForReviewer()
      const p = d.protocols.find(p => p.id === id)
      if (!p) { setError('Protocolo não encontrado.'); setLoading(false); return }
      setProtocol(p)

      // 2. Buscar ficha de avaliação
      const formsData = await evaluationService.listForReviewerAcrossCommittees()
      const assignmentOrgan = p.my_assignment?.organ?.type === 'scientific_committee'
        ? 'comite_cientifico'
        : p.my_assignment?.organ?.type === 'bioethics_committee'
          ? 'comite_bioetica'
          : null
      if (!assignmentOrgan) {
        setError('Este protocolo não pertence a um comité de avaliação activo.')
        setLoading(false)
        return
      }
      const form = formsData.evaluation_forms.find(f => f.protocol_id === id && f.organ === assignmentOrgan && f.form_type === 'evaluation')
      if (!form) { setError('Ficha de avaliação não encontrada.'); setLoading(false); return }

      // 3. Buscar ficha completa
      const full = await evaluationService.getForm(form.id, organForEvaluation(form))
      const formData = full.evaluation_form
      setEvaluationForm(formData)

      // 4. Determinar estados
      const evals = formData.reviewer_evaluations || []
      const uid = user?.id ? Number(user.id) : null
      const me = evals.find(re => uid !== null && re.reviewer?.user?.id === uid)
      const concluded = formData.status === 'concluded'
      const isDeliberation = formData.status === 'deliberation_pending' || formData.status === 'deliberation_scheduled' || formData.status === 'in_deliberation'
      const mySubmitted = isReviewerDone(me?.status, me?.is_evaluated)

      setFormConcluded(concluded)
      setMyEvaluationSubmitted(mySubmitted || isDeliberation) // Em deliberação, considera como submetido
      setIsSecretary(hasPermission('protocol.assign'))

      // 5. Resetar campos
      setRecommendation('')
      setOverallComment('')
      setCriterionReviews({})
      setDeliberationDecision('')
      setDeliberationSummary(formData.conclusion_summary || '')
      setShowScheduleForm(false)

      // 6. Carregar comentários do revisor atual
      if (isSharedCommitteeEvaluation(formData)) {
        const revs: Record<number, string> = {}
        evals.forEach(re => {
          ;(re.criterion_reviews || []).forEach(cr => {
            if (cr.evaluation_form_criterion_id && cr.comment && !revs[cr.evaluation_form_criterion_id]) {
              revs[cr.evaluation_form_criterion_id] = cr.comment
            }
          })
        })
        ;(formData.criteria_comments || []).forEach(item => {
          const first = item.reviews?.find(review => review.comment)
          if (item.form_criterion_id && first?.comment) {
            revs[item.form_criterion_id] = first.comment
          }
        })
        setCriterionReviews(revs)
      } else if (me?.criterion_reviews) {
        const revs: Record<number, string> = {}
        me.criterion_reviews.forEach(cr => {
          if (cr.evaluation_form_criterion_id) revs[cr.evaluation_form_criterion_id] = cr.comment || ''
        })
        setCriterionReviews(revs)
      }

      // 7. Se em deliberação, merge com comentários do outro revisor
      if (formData.status === 'in_deliberation') {
        const otherEval = evals.find(re => re.reviewer?.user?.id !== uid)
        if (otherEval?.criterion_reviews) {
          setCriterionReviews(prev => {
            const merged = { ...prev }
            otherEval.criterion_reviews?.forEach(cr => {
              if (cr.evaluation_form_criterion_id && cr.comment && !merged[cr.evaluation_form_criterion_id]) {
                merged[cr.evaluation_form_criterion_id] = cr.comment
              }
            })
            return merged
          })
        }
      }

      setError(null)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  async function handleSaveCriterionReview(fcId: number) {
    if (!evaluationForm) return
    if (myEvaluationSubmitted && evaluationForm.status !== 'in_deliberation') return
    if (formConcluded) return
    try {
      await evaluationService.saveCriterionReview(evaluationForm.id, fcId, criterionReviews[fcId] || null, organForEvaluation(evaluationForm))
    } catch (e: any) { /* silencioso no auto-save */ }
  }

  async function openFile(url?: string | null, name?: string) { if (url) try { await evaluationService.openFile(url, name) } catch {} }
  async function downloadFile(url?: string | null, name?: string) { if (url) try { await evaluationService.downloadFile(url, name) } catch {} }

  async function handleSubmitEvaluation() {
    if (!evaluationForm || !recommendation || myEvaluationSubmitted || formConcluded) return
    setSubmitting(true)
    setError(null)
    try {
      if (importedDocument?.file) await protocolService.uploadReviewedDocument(id, importedDocument.file)
      const apiDecision = recommendation === 'approved' ? 'approved' : 'not_approved'
      const result = isSharedCommitteeEvaluation(evaluationForm)
        ? await evaluationService.markEvaluated(evaluationForm.id, apiDecision, overallComment || null, organForEvaluation(evaluationForm))
        : await evaluationService.submit(evaluationForm.id, apiDecision, overallComment || null, organForEvaluation(evaluationForm))
      setSuccess(result.message)
      // Recarregar tudo
      await loadProtocolEvaluation()
    } catch (e: any) { setError(e.message) } finally { setSubmitting(false) }
  }

  // ── Deliberation actions ──
  async function handleScheduleDeliberation(e: React.FormEvent) {
    e.preventDefault()
    if (!evaluationForm || !deliberationDate || !deliberationLocation) return
    setIsScheduling(true)
    try {
      await evaluationService.scheduleDeliberation(evaluationForm.id, deliberationDate, deliberationLocation, organForEvaluation(evaluationForm))
      setSuccess('Deliberação agendada com sucesso.')
      setShowScheduleForm(false)
      setDeliberationDate('')
      setDeliberationLocation('')
      await loadProtocolEvaluation()
    } catch (e: any) { setError(e.message) } finally { setIsScheduling(false) }
  }

  async function handleSubmitDeliberation() {
    if (!evaluationForm || !deliberationDecision) return
    setIsSubmittingDeliberation(true)
    try {
      const result = await evaluationService.submitDeliberation(evaluationForm.id, deliberationDecision, deliberationSummary || null, organForEvaluation(evaluationForm))
      setSuccess(result.message)
      await loadProtocolEvaluation()
    } catch (e: any) { setError(e.message) } finally { setIsSubmittingDeliberation(false) }
  }

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading) return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <span className="page-loader__text">A carregar avaliação...</span>
    </div>
  )

  // ═══════════════════════════════════════════════
  // TOPIC EVALUATION
  // ═══════════════════════════════════════════════
  if (!isProtocol && topic) {
    return <DocumentReviewWorkspace
      document={topic.has_document ? { kind: 'topic', id: topic.id, name: topic.document_name } : null}
      title={topic.title}
      statusLabel={topic.status_label || evaluationStatusMessage(topic) || 'Em revisão'}
      statusTone={topic.status.includes('rejected') ? 'rejected' : topic.status.includes('approved') ? 'approved' : 'pending'}
      comments={comments.map(comment => ({ id: comment.id, content: comment.content, createdAt: comment.created_at, author: comment.user?.name || 'Revisor do Núcleo' }))}
      commentValue={newComment}
      onCommentChange={setNewComment}
      onAddComment={addComment}
      commentSubmitting={submitting}
      decision={decision}
      onDecisionChange={setDecision}
      onConfirmDecision={submitDecision}
      decisionSubmitting={submitting}
      decisionDone={evaluationDone}
      onDownload={async () => { if (topic.has_document) await protocolService.downloadFile(topicService.downloadDocument(topic.id), topic.document_name || 'tema.docx') }}
      backLabel="Voltar para revisões"
      onBack={() => window.history.back()}
    />
  }

  // ═══════════════════════════════════════════════
  // PROTOCOL EVALUATION (SPLIT-VIEW)
  // ═══════════════════════════════════════════════
  if (isProtocol && protocol) {
    const finalProtocolDecision = evaluationForm?.final_decision
    const isBioeticaForm = isBioeticaEvaluation(evaluationForm)
    const isSharedCommitteeForm = isSharedCommitteeEvaluation(evaluationForm)
    const isPrimaryReviewer = Boolean(evaluationForm?.is_primary_reviewer)
    const canAccessForm = !isBioeticaForm || Boolean(evaluationForm?.can_access_form)
    const state = getEvaluationState(evaluationForm, myEvaluationSubmitted, isSharedCommitteeForm)
    const isInDeliberation = evaluationForm?.status === 'in_deliberation'
    const isDeliberationScheduled = evaluationForm?.status === 'deliberation_scheduled'
    const isDeliberationPending = evaluationForm?.status === 'deliberation_pending'
    const canEdit = !formConcluded && canAccessForm && (!myEvaluationSubmitted || isInDeliberation)
    const canShowCriteria = !!evaluationForm && canAccessForm && (!isSharedCommitteeForm || isInDeliberation || evaluationForm.status === 'deliberated' || formConcluded)
    const shouldShowInitialSubmission = !!evaluationForm && !formConcluded && !myEvaluationSubmitted && !isInDeliberation
    const canStartOrSubmitDeliberation = !isBioeticaForm || isPrimaryReviewer
    const protocolCode = protocol.code || `ISC-P-${id}`
    const docFileName = protocol.latest_document?.file_name || `${protocolCode}.docx`

    const criteriaMap = (evaluationForm?.form_criteria || []).reduce<Record<string, FormCriterion[]>>((g, c) => {
      const k = c.group_name || 'Outros'
      if (!g[k]) g[k] = []
      g[k].push(c)
      return g
    }, {})

    const criteriaComments: Record<number, { reviewer_name: string; comment: string; is_mine: boolean }[]> = {}
    if (isSharedCommitteeForm && evaluationForm?.criteria_comments) {
      evaluationForm.criteria_comments.forEach(item => {
        if (!item.form_criterion_id) return
        item.reviews?.forEach(review => {
          if (!review.comment) return
          if (!criteriaComments[item.form_criterion_id!]) criteriaComments[item.form_criterion_id!] = []
          criteriaComments[item.form_criterion_id!].push({
            reviewer_name: review.reviewer_name || '',
            comment: review.comment,
            is_mine: false,
          })
        })
      })
    } else {
      ;(evaluationForm?.reviewer_evaluations || []).forEach(rev => {
        const reviewerName = rev.reviewer?.user?.name || 'Revisor'
        const isMine = !!(user?.id && rev.reviewer?.user?.id === Number(user.id))
        ;(rev.criterion_reviews || []).forEach(cr => {
          if (cr.evaluation_form_criterion_id && cr.comment) {
            if (!criteriaComments[cr.evaluation_form_criterion_id]) criteriaComments[cr.evaluation_form_criterion_id] = []
            const exists = criteriaComments[cr.evaluation_form_criterion_id].some(c => c.reviewer_name === reviewerName)
            if (!exists) criteriaComments[cr.evaluation_form_criterion_id].push({ reviewer_name: reviewerName, comment: cr.comment, is_mine: isMine })
          }
        })
      })
    }

    return (
      <>
        <ProtocolReviewContext protocolId={protocol.id} />
        <ReviewerProtocolAttachmentsDialog protocol={protocol} open={showAttachments} onClose={() => setShowAttachments(false)} />

        {/* ── ONLYOFFICE FULLSCREEN OVERLAY ── */}
        {onlyOfficeFullscreen && (
          <div className="onlyoffice-fullscreen-overlay">
            <div className="onlyoffice-fullscreen-toolbar">
              <div className="onlyoffice-fullscreen-toolbar-left"><span className="onlyoffice-fullscreen-title">{docFileName}</span></div>
              <div className="onlyoffice-fullscreen-toolbar-right">
                <button type="button" className="onlyoffice-fullscreen-btn" onClick={reloadOnlyOffice} aria-label="Recarregar editor" title="Recarregar editor"><span className="material-symbols-outlined" aria-hidden="true">refresh</span></button>
                <button type="button" className="onlyoffice-fullscreen-close" onClick={toggleOnlyOfficeFullscreen} title="Sair (Esc)"><span className="material-symbols-outlined" aria-hidden="true">close_fullscreen</span><span>Sair</span></button>
              </div>
            </div>
            <div className="onlyoffice-fullscreen-content">
              {protocol.latest_document && onlyOfficeKey >= 0 ? (
                <OnlyOfficeEditor key={onlyOfficeKey} protocolId={protocol.id} height="100%" />
              ) : (
                <div className="onlyoffice-loading"><div className="onlyoffice-loading-content"><div className="onlyoffice-spinner" /><span>Recarregando editor...</span></div></div>
              )}
            </div>
          </div>
        )}

        {/* ── SPLIT VIEW ── */}
        <div className={`teacher-workspace evaluation-split-view ${isDragging ? 'is-dragging' : ''}`} ref={containerRef}>
          {/* LEFT: DOCUMENT VIEWER */}
          <section className="doc-viewer-pane" style={{ width: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0%' : `${splitPosition}%`, minWidth: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0px' : `${MIN_PANEL_WIDTH}px`, opacity: expandedPanel === 'form' ? 0 : 1, pointerEvents: expandedPanel === 'form' ? 'none' : 'auto' }}>
            <div className="doc-toolbar">
              <div className="doc-toolbar-left">
                <button type="button" className="panel-toggle-btn" onClick={toggleDocumentFullscreen} aria-label={expandedPanel === 'document' ? 'Restaurar vista dividida' : 'Expandir documento'}><span className="material-symbols-outlined" aria-hidden="true">{expandedPanel === 'document' ? 'collapse_content' : 'expand_content'}</span></button>
                <span className="doc-filename">{docFileName}</span><span className="doc-file-type-badge">DOCX</span>
              </div>
              <div className="doc-toolbar-right">
                <button type="button" className="doc-toolbar-btn" onClick={() => setShowAttachments(true)} aria-label="Ver anexos do protocolo" title="Ver anexos"><span className="material-symbols-outlined" aria-hidden="true">attach_file</span></button>
                <button type="button" className="doc-toolbar-btn" onClick={reloadOnlyOffice} aria-label="Recarregar editor" title="Recarregar editor"><span className="material-symbols-outlined" aria-hidden="true">refresh</span></button>
                <button type="button" className="doc-toolbar-btn" onClick={toggleOnlyOfficeFullscreen} aria-label="Abrir editor em tela cheia" title="Tela cheia"><span className="material-symbols-outlined" aria-hidden="true">fullscreen</span></button>
                <button type="button" className="doc-toolbar-btn" onClick={() => openFile(protocol.latest_document?.download_url)} aria-label="Abrir documento em nova aba" title="Abrir em nova aba"><span className="material-symbols-outlined" aria-hidden="true">open_in_new</span></button>
              </div>
            </div>
            <div className={`doc-content-area ${isDraggingOver ? 'doc-content-area--drag-over' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} ref={dropZoneRef}>
              {isDraggingOver && <div className="doc-drop-overlay"><span className="material-symbols-outlined">cloud_upload</span><p>Solte o arquivo aqui</p></div>}
              {!protocol.latest_document ? (
                <div className="doc-state-empty"><span className="material-symbols-outlined">description</span><p>Nenhum documento</p></div>
              ) : onlyOfficeKey >= 0 ? (
                <OnlyOfficeEditor key={onlyOfficeKey} protocolId={protocol.id} height="100%" />
              ) : (
                <div className="onlyoffice-loading"><div className="onlyoffice-loading-content"><div className="onlyoffice-spinner" /><span>Recarregando editor...</span></div></div>
              )}
            </div>
            <div className="doc-bottom-bar">
              <div className="doc-bottom-bar-left"><span className="material-symbols-outlined">description</span><span className="doc-bottom-filename">{docFileName}</span></div>
              <div className="doc-bottom-bar-right">
                <button className="doc-bottom-btn doc-bottom-btn--download" onClick={() => downloadFile(protocol.latest_document?.download_url)}><span className="material-symbols-outlined">download</span><span>Download</span></button>
                <div className="doc-bottom-divider" />
                <input ref={fileInputRef} type="file" accept=".docx,.doc,.pdf" onChange={handleFileSelected} style={{ display: 'none' }} />
                {importedDocument ? (
                  <div className="doc-imported-preview">
                    <div className="doc-imported-preview-icon"><span className="material-symbols-outlined">description</span></div>
                    <div className="doc-imported-preview-info"><span className="doc-imported-preview-name">{importedDocument.name}</span><span className="doc-imported-preview-size">{formatFileSize(importedDocument.size)}</span></div>
                    <div className="doc-imported-preview-actions">
                      <button className="doc-imported-preview-replace" onClick={handleImportClick}><span className="material-symbols-outlined">swap_horiz</span></button>
                      <button className="doc-imported-preview-remove" onClick={handleRemoveImported}><span className="material-symbols-outlined">close</span></button>
                    </div>
                  </div>
                ) : (
                  <button className="doc-bottom-btn doc-bottom-btn--import" onClick={handleImportClick} disabled={isUploading || formConcluded || (myEvaluationSubmitted && !isInDeliberation)}><span className="material-symbols-outlined">upload_file</span><span>Importar</span></button>
                )}
                {importedDocument && <span className="doc-imported-badge"><span className="material-symbols-outlined">check_circle</span>Pronto</span>}
              </div>
            </div>
          </section>

          {/* DIVIDER */}
          {expandedPanel === 'both' && (
            <div ref={dividerRef} className={`split-pane-divider ${isDragging ? 'is-dragging' : ''}`} onMouseDown={handleMouseDown}><div className="split-pane-divider-handle"><span className="material-symbols-outlined">drag_indicator</span></div></div>
          )}

          {/* RIGHT: FICHA DE AVALIAÇÃO */}
          <section className="evaluation-form-pane" style={{ width: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0%' : `${100 - splitPosition}%`, minWidth: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0px' : `${MIN_PANEL_WIDTH}px`, opacity: expandedPanel === 'document' ? 0 : 1, pointerEvents: expandedPanel === 'document' ? 'none' : 'auto' }}>
            <div className="evaluation-form-header">
              <span className="material-symbols-outlined">fact_check</span>
              <span className="evaluation-form-header-title">Ficha de Avaliação</span>
              <button type="button" className="panel-toggle-btn panel-toggle-btn--form" onClick={toggleFormFullscreen} aria-label={expandedPanel === 'form' ? 'Restaurar vista dividida' : 'Expandir ficha de avaliação'}><span className="material-symbols-outlined" aria-hidden="true">{expandedPanel === 'form' ? 'collapse_content' : 'expand_content'}</span></button>
            </div>

            <div className="evaluation-form-content">
              {/* Info Card com Estado */}
              <div className="eval-info-card">
                <div className="eval-info-header">
                  <span className="eval-info-label">Estado</span>
                  <span className={`eval-info-badge ${state.className}`}>{state.label}</span>
                </div>
                <h4>Ficha de Avaliação</h4>
                <p>{protocolCode} — {protocol.topic?.title || protocol.version}</p>
                {state.description && (
                  <div className="eval-state-description"><span className="material-symbols-outlined">info</span><p>{state.description}</p></div>
                )}
              </div>

              {success && <div className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
              {error && <div className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}

              {/* ── Deliberação Pendente ── */}
              {isDeliberationPending && (
                <div className="deliberation-pending-banner">
                  <span className="material-symbols-outlined">hourglass_top</span>
                  <div>
                    <strong>Aguardando Deliberação</strong>
                    <p>{isSecretary ? 'Agende uma reunião de deliberação para os revisores.' : 'Os revisores divergiram. A secretaria irá agendar uma reunião.'}</p>
                  </div>
                  {isSecretary && !showScheduleForm && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowScheduleForm(true)}>Agendar</button>
                  )}
                </div>
              )}

              {/* ── Formulário de Agendamento (Secretaria) ── */}
              {showScheduleForm && (
                <div className="schedule-deliberation-form">
                  <h4>Agendar Deliberação</h4>
                  <form onSubmit={handleScheduleDeliberation}>
                    <div className="eval-field">
                      <label>Data e Hora</label>
                      <input type="datetime-local" value={deliberationDate} onChange={e => setDeliberationDate(e.target.value)} required className="form-input" />
                    </div>
                    <div className="eval-field">
                      <label>Local</label>
                      <input type="text" value={deliberationLocation} onChange={e => setDeliberationLocation(e.target.value)} placeholder="Ex: Sala de Reuniões 2" required className="form-input" />
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowScheduleForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={isScheduling}>{isScheduling ? 'A agendar...' : 'Confirmar'}</button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Deliberação Agendada ── */}
              {isDeliberationScheduled && evaluationForm && (
                <div className="deliberation-info-banner">
                  <span className="material-symbols-outlined">event</span>
                  <div>
                    <strong>Deliberação Agendada</strong>
                    <p>{formatDate(evaluationForm.deliberation_date)} — {evaluationForm.deliberation_location || 'Local não definido'}</p>
                  </div>
	                  <span className="badge badge-warning">A Secretaria inicia a reunião no horário marcado</span>
	                </div>
	              )}

              {/* ── Em Deliberação ── */}
              {isInDeliberation && (
                <div className="deliberation-active-banner">
                  <span className="material-symbols-outlined">groups</span>
                  <div>
                    <strong>Em Deliberação</strong>
                    <p>Os comentários são partilhados. Editem em conjunto e submetam a decisão final.</p>
                  </div>
                </div>
              )}

              {/* ── Resultado Final ── */}
              {formConcluded && (
                <div className={`eval-outcome-banner ${finalProtocolDecision === 'approved' ? 'is-approved' : 'is-rejected'}`}>
                  <span className="material-symbols-outlined">{finalProtocolDecision === 'approved' ? 'check_circle' : 'cancel'}</span>
                  <div>
                    <strong>{finalProtocolDecision === 'approved' ? 'Protocolo Aprovado' : 'Protocolo Não Aprovado'}</strong>
                    <p>{evaluationForm?.conclusion_summary || 'Processo concluído.'}</p>
                  </div>
                </div>
              )}

              {/* ── Estado dos Revisores ── */}
              {evaluationForm && !formConcluded && (
                <div className="eval-reviewer-status">
                  <h3><span className="material-symbols-outlined">group</span>Estado dos Revisores</h3>
                  <div className="reviewer-chips-list">
                    {(evaluationForm.reviewer_evaluations || []).map((re, i) => {
                      const isMe = user?.id && re.reviewer?.user?.id === Number(user.id)
                      const done = isReviewerDone(re.status, re.is_evaluated)
	                      const decisionText = isSharedCommitteeForm && re.preliminary_decision
	                        ? ` · ${preliminaryDecisionLabel(re.preliminary_decision)}`
	                        : ''
	                      const roleText = re.is_primary ? ' · Principal' : ''
	                      return (
	                        <span key={re.id} className={`reviewer-chip ${done ? 'is-submitted' : ''} ${isMe ? 'is-you' : ''}`}>
	                          {re.reviewer?.user?.name || `Revisor #${i + 1}`}{isMe ? ' (você)' : ''}{roleText}: {done ? (isSharedCommitteeForm ? '✓ Avaliado' : '✓ Submetido') : '○ Pendente'}{decisionText}
	                        </span>
	                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Revisão prévia do CC/Comité de Bioética ── */}
              {isSharedCommitteeForm && shouldShowInitialSubmission && (
	                <div className="eval-recommendation-section">
	                  <h3><span className="material-symbols-outlined">rate_review</span>Revisão prévia</h3>
	                  <div className="eval-state-description">
	                    <span className="material-symbols-outlined">edit_document</span>
	                    <p>Revise o documento no OnlyOffice com track changes e marque esta etapa como avaliada. A ficha do {committeeLabel(evaluationForm)} só fica disponível na deliberação{isBioeticaForm ? ' e apenas ao revisor principal.' : '.'}</p>
	                  </div>
                  <div className="eval-field">
                    <label>Observação da revisão</label>
                    <textarea value={overallComment} onChange={e => setOverallComment(e.target.value)} placeholder="Observação opcional..." rows={3} className="criterion-textarea" />
                  </div>
                  <div className="recommendation-choices">
                    <label className={`recommendation-choice ${recommendation === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="rec" checked={recommendation === 'approved'} onChange={() => setRecommendation('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovado</label>
                    <label className={`recommendation-choice ${recommendation === 'rejected' ? 'is-rejected' : ''}`}><input type="radio" name="rec" checked={recommendation === 'rejected'} onChange={() => setRecommendation('rejected')} /><span className="material-symbols-outlined">cancel</span>Não aprovado</label>
                  </div>
                  <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}>
                    {submitting ? 'A registar...' : 'Marcar como avaliado'}
                  </button>
                </div>
              )}

              {/* ── CRITÉRIOS ── */}
              {evaluationForm && canShowCriteria && (
                <div className="eval-criteria-section">
	                  <h3 className="criteria-section-title"><span className="material-symbols-outlined">checklist</span>{isSharedCommitteeForm ? `Ficha Única do ${committeeLabel(evaluationForm)}` : 'Critérios de Avaliação'}</h3>
                  {Object.entries(criteriaMap).map(([group, criteria]) => (
                    <div key={group} className="criteria-group-block">
                      <h4 className="criteria-group-title">{group}</h4>
                      {criteria.map(c => {
                        const my = criterionReviews[c.id] || ''
                        const allComments = criteriaComments[c.id] || []
                        return (
                          <div key={c.id} className="criterion-item">
                            <div className="criterion-header">
                              <label className="criterion-name">{c.criterion_name}</label>
                              {canEdit && (
                                <div className="criterion-rating">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} className={`rating-dot ${my?.startsWith(`Nota ${s}`) ? 'is-active' : ''}`}
                                      onClick={() => {
                                        const cc = my.replace(/^Nota \d\/5 - /, '') || ''
                                        setCriterionReviews(prev => ({ ...prev, [c.id]: `Nota ${s}/5 - ${cc}` }))
                                      }}>{s}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {canEdit && (
                              <textarea value={my?.replace(/^Nota \d\/5 - /, '') || ''}
                                onChange={e => setCriterionReviews(prev => ({ ...prev, [c.id]: e.target.value }))}
                                onBlur={() => handleSaveCriterionReview(c.id)}
                                placeholder="Observações..." rows={3} className="criterion-textarea" />
                            )}
                            {allComments.length > 0 && (
                              <div className="criterion-comments">
                                {allComments.map((comment, idx) => (
                                  <div key={idx} className={`criterion-comment ${comment.is_mine ? 'is-mine' : 'is-other'}`}>
                                    {comment.reviewer_name && (
                                      <span className="criterion-comment-author">{comment.reviewer_name}{comment.is_mine ? ' (você)' : ''}:</span>
                                    )}
                                    <span className="criterion-comment-text">{comment.comment?.replace(/^Nota \d\/5 - /, '') || comment.comment}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}

                  {/* ── Submeter Avaliação Individual ── */}
	                  {!isSharedCommitteeForm && shouldShowInitialSubmission && (
                    <div className="eval-recommendation-section">
                      <h3><span className="material-symbols-outlined">rate_review</span>Conclusão</h3>
                      <div className="eval-field"><label>Resumo</label><textarea value={overallComment} onChange={e => setOverallComment(e.target.value)} placeholder="Resumo geral..." rows={3} className="criterion-textarea" /></div>
                      <div className="recommendation-choices">
                        <label className={`recommendation-choice ${recommendation === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="rec" checked={recommendation === 'approved'} onChange={() => setRecommendation('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovar</label>
                        <label className={`recommendation-choice ${recommendation === 'rejected' ? 'is-rejected' : ''}`}><input type="radio" name="rec" checked={recommendation === 'rejected'} onChange={() => setRecommendation('rejected')} /><span className="material-symbols-outlined">cancel</span>Não Aprovar</label>
                      </div>
                      <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}>
                        {submitting ? 'A submeter...' : 'Submeter Avaliação'}
                      </button>
                    </div>
                  )}

                  {/* ── Submeter Deliberação ── */}
	                  {isInDeliberation && canStartOrSubmitDeliberation && (
	                    <div className="eval-recommendation-section">
	                      <h3><span className="material-symbols-outlined">gavel</span>{isSharedCommitteeForm ? 'Submissão da ficha de deliberação' : 'Decisão Final da Deliberação'}</h3>
                      <div className="eval-field"><label>Resumo da deliberação</label><textarea value={deliberationSummary} onChange={e => setDeliberationSummary(e.target.value)} placeholder="Resumo da discussão..." rows={3} className="criterion-textarea" /></div>
                      <div className="recommendation-choices">
                        <label className={`recommendation-choice ${deliberationDecision === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="delib-rec" checked={deliberationDecision === 'approved'} onChange={() => setDeliberationDecision('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovar</label>
                        <label className={`recommendation-choice ${deliberationDecision === 'not_approved' ? 'is-rejected' : ''}`}><input type="radio" name="delib-rec" checked={deliberationDecision === 'not_approved'} onChange={() => setDeliberationDecision('not_approved')} /><span className="material-symbols-outlined">cancel</span>Não Aprovar</label>
                      </div>
                      <button className="btn btn-primary btn-block btn-lg" onClick={handleSubmitDeliberation} disabled={!deliberationDecision || isSubmittingDeliberation}>
	                        {isSubmittingDeliberation ? 'A submeter...' : (isSharedCommitteeForm ? 'Submeter ficha' : 'Submeter Decisão Final')}
	                      </button>
	                    </div>
	                  )}
                </div>
              )}
              <div style={{ height: 40 }} />
            </div>
          </section>
        </div>
      </>
    )
  }

  return (
    <div className="page-loader">
      <p>Nenhum dado encontrado.</p>
      <Link to="/reviews" className="btn btn-outline">Voltar</Link>
    </div>
  )
}
