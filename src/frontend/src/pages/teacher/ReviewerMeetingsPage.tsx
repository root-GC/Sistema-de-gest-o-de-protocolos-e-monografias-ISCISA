// src/pages/reviewer/ReviewerMeetingsPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { protocolService, type Protocol } from '../../services/protocolService'
import { evaluationService, type EvaluationForm, type EvaluationOrgan, type FormCriterion } from '../../services/evaluationService'
import { deliberationService, type DeliberationMeeting, type DeliberationMeetingItem } from '../../services/deliberationService'
import OnlyOfficeEditor from '../../components/OnlyOfficeEditor/OnlyOfficeEditor'
import '../../styles/global.css'

// ── Helpers ────────────────────────────────────────────
function getMeetingState(evaluationForm: EvaluationForm | null): {
  label: string
  className: string
  description: string
} {
  if (!evaluationForm) return { label: 'Carregando...', className: 'is-pending', description: '' }
  
  const status = evaluationForm.status
  
  switch (status) {
    case 'deliberation_scheduled':
      return {
        label: 'Agendada',
        className: 'is-deliberation-scheduled',
        description: `Reunião marcada para ${formatDate(evaluationForm.deliberation_date)} em ${evaluationForm.deliberation_location || 'local a definir'}.`,
      }
    
    case 'in_deliberation':
      return {
        label: 'Em Deliberação',
        className: 'is-deliberation-active',
        description: 'Reunião em andamento. Registe o resultado da deliberação.',
      }
    
    case 'deliberated':
      return {
        label: 'Deliberado',
        className: 'is-deliberated',
        description: '',
      }
    
    case 'not_deliberated':
      return {
        label: 'Sem Consenso',
        className: 'is-not-deliberated',
        description: 'A reunião não chegou a consenso. Aguardando a secretaria agendar nova reunião.',
      }
    
    case 'deliberation_pending':
      return {
        label: 'Por Agendar',
        className: 'is-pending',
        description: 'Aguardando a secretaria agendar a reunião de deliberação.',
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

function organForEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): EvaluationOrgan {
  return form?.organ === 'comite_bioetica' ? 'comite-bioetica' : 'comite-cientifico'
}

function isBioeticaEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): boolean {
  return form?.organ === 'comite_bioetica'
}

function isSharedCommitteeEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): boolean {
  return form?.organ === 'comite_cientifico' || form?.organ === 'comite_bioetica'
}

function committeeLabel(form?: Pick<EvaluationForm, 'organ'> | null): string {
  if (form?.organ === 'comite_bioetica') return 'Comité de Bioética'
  if (form?.organ === 'comite_cientifico') return 'Comité Científico'
  return 'órgão'
}

type ExpandedPanel = 'both' | 'document' | 'form'

const MIN_PANEL_WIDTH = 300
const DEFAULT_SPLIT = 50

// ── Componente Principal ──────────────────────────────
export default function ReviewerMeetingsPage() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const [searchParams] = useSearchParams()
  const id = Number(protocolId)
  const requestedMeetingId = Number(searchParams.get('meeting'))
  const requestedItemId = Number(searchParams.get('item'))

  // ── Protocol & Form state ──
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null)
  const [meeting, setMeeting] = useState<DeliberationMeeting | null>(null)
  const [meetingItem, setMeetingItem] = useState<DeliberationMeetingItem | null>(null)
  const [criterionReviews, setCriterionReviews] = useState<Record<number, string>>({})
  const [finalDecision, setFinalDecision] = useState<string | null>(null)
  const [deliberationDecision, setDeliberationDecision] = useState<'approved' | 'not_approved' | ''>('')
  const [deliberationSummary, setDeliberationSummary] = useState('')
  const [submittingDecision, setSubmittingDecision] = useState(false)

  // ── Shared state ──
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // ── OnlyOffice state ──
  const [onlyOfficeFullscreen, setOnlyOfficeFullscreen] = useState(false)
  const [onlyOfficeKey, setOnlyOfficeKey] = useState(0)

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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      const w = r.width
      const mx = e.clientX - r.left
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
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  // ═══════════════════════════════════════════════
  // PANEL TOGGLE
  // ═══════════════════════════════════════════════
  const toggleDocumentFullscreen = useCallback(() => {
    if (expandedPanel === 'document') {
      setExpandedPanel('both')
      setSplitPosition(savedSplitPosition.current)
    } else {
      savedSplitPosition.current = splitPosition
      setExpandedPanel('document')
    }
  }, [expandedPanel, splitPosition])

  const toggleFormFullscreen = useCallback(() => {
    if (expandedPanel === 'form') {
      setExpandedPanel('both')
      setSplitPosition(savedSplitPosition.current)
    } else {
      savedSplitPosition.current = splitPosition
      setExpandedPanel('form')
    }
  }, [expandedPanel, splitPosition])

  function toggleOnlyOfficeFullscreen() {
    setOnlyOfficeFullscreen(prev => !prev)
  }

  function reloadOnlyOffice() {
    setOnlyOfficeKey(-1)
    setTimeout(() => { setOnlyOfficeKey(prev => Math.abs(prev) + 1) }, 150)
  }

  // Keyboard shortcuts
  useEffect(() => {
    function k(e: KeyboardEvent) {
      if (e.key === 'Escape' && onlyOfficeFullscreen) {
        setOnlyOfficeFullscreen(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        toggleDocumentFullscreen()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '\\') {
        e.preventDefault()
        toggleFormFullscreen()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '0') {
        e.preventDefault()
        setSplitPosition(DEFAULT_SPLIT)
        setExpandedPanel('both')
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onlyOfficeFullscreen, toggleDocumentFullscreen, toggleFormFullscreen])

  async function loadMeetingData() {
    setLoading(true)
    setError(null)
    
    try {
      const data = await protocolService.listForReviewer()
      const currentProtocol = data.protocols?.find(p => p.id === id)
      
      if (!currentProtocol) {
        setError('Protocolo não encontrado.')
        setLoading(false)
        return
      }
      
      setProtocol(currentProtocol)

      const currentMeeting = requestedMeetingId
        ? (await deliberationService.getMeeting(requestedMeetingId)).meeting
        : (await deliberationService.listMeetings()).meetings.find(candidate =>
            candidate.items.some(item => item.protocol.id === id)
          )
      const currentItem = currentMeeting?.items.find(item =>
        requestedItemId ? item.id === requestedItemId : item.protocol.id === id
      )

      if (!currentMeeting || !currentItem) {
        setError('Reunião de deliberação não encontrada.')
        setLoading(false)
        return
      }

      setMeeting(currentMeeting)
      setMeetingItem(currentItem)

      const formOrgan: EvaluationOrgan = currentItem.form_organ === 'comite_bioetica'
        ? 'comite-bioetica'
        : 'comite-cientifico'

      const fullForm = await evaluationService.getForm(currentItem.evaluation_form_id, formOrgan)
      const formData = fullForm.evaluation_form
      
      if (!formData) {
        setError('Dados da ficha não encontrados.')
        setLoading(false)
        return
      }

      setEvaluationForm(formData)
      setFinalDecision(formData.final_decision || null)
      setDeliberationDecision('')
      setDeliberationSummary(formData.conclusion_summary || '')
      const reviews: Record<number, string> = {}
      if (isSharedCommitteeEvaluation(formData) && formData.criteria_comments) {
        formData.criteria_comments.forEach(item => {
          const first = item.reviews?.find(review => review.comment)
          if (item.form_criterion_id && first?.comment) {
            reviews[item.form_criterion_id] = first.comment
          }
        })
      } else {
        const allEvals = formData.reviewer_evaluations || []
        allEvals.forEach(rev => {
          ;(rev.criterion_reviews || []).forEach(cr => {
            if (cr.evaluation_form_criterion_id && cr.comment) {
              if (!reviews[cr.evaluation_form_criterion_id]) {
                reviews[cr.evaluation_form_criterion_id] = cr.comment
              }
            }
          })
        })
      }
      setCriterionReviews(reviews)

    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erro ao carregar dados da reunião.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      if (id) void loadMeetingData()
    }, 0)

    return () => window.clearTimeout(requestId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, requestedMeetingId, requestedItemId])

  async function openFile(url: string | null | undefined) {
    if (!url) return
    try { await evaluationService.openFile(url) } catch { setError('Não foi possível abrir o documento.') }
  }
  
  async function downloadFile(url: string | null | undefined) {
    if (!url) return
    try { await evaluationService.downloadFile(url) } catch { setError('Não foi possível descarregar o documento.') }
  }

  async function handleSaveCriterionReview(fcId: number) {
    if (!evaluationForm || !['in_deliberation', 'deliberated'].includes(evaluationForm.status)) return
    try {
      await evaluationService.saveCriterionReview(evaluationForm.id, fcId, criterionReviews[fcId] || null, organForEvaluation(evaluationForm))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível guardar o critério.')
    }
  }

  async function handleSubmitDecision() {
    if (!evaluationForm || !deliberationDecision) return
    setSubmittingDecision(true)
    setError(null)
    try {
      await evaluationService.decide(
        evaluationForm.id,
        deliberationDecision,
        deliberationSummary || null,
        organForEvaluation(evaluationForm),
      )
      await loadMeetingData()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível registar a decisão final.')
    } finally {
      setSubmittingDecision(false)
    }
  }

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading) return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <span className="page-loader__text">A carregar reunião de deliberação...</span>
    </div>
  )

  // ═══════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════
  if (error && !evaluationForm) return (
    <div className="page-loader">
      <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>error_outline</span>
      <p>{error}</p>
      <Link to="/reviewer/meetings" className="btn btn-outline" style={{ marginTop: 16 }}>Voltar</Link>
    </div>
  )

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  if (protocol && evaluationForm) {
    const state = meetingItem?.status === 'scheduled'
      ? { label: 'Agendada', className: 'is-deliberation-scheduled', description: `Reunião marcada para ${formatDate(meeting?.scheduled_at)} em ${meeting?.location || 'local a definir'}.` }
      : meetingItem?.status === 'in_progress'
        ? { label: 'Em Deliberação', className: 'is-deliberation-active', description: 'Reunião em andamento. A ficha está disponível para preparação.' }
        : meetingItem?.status === 'deliberated'
          ? { label: 'Deliberado', className: 'is-deliberated', description: '' }
          : meetingItem?.status === 'not_deliberated'
            ? { label: 'Sem Consenso', className: 'is-not-deliberated', description: 'O protocolo regressou ao fim da fila.' }
            : getMeetingState(evaluationForm)
    const isInDeliberation = meetingItem?.status === 'in_progress'
    const isScheduled = meetingItem?.status === 'scheduled'
    const isConcluded = evaluationForm?.status === 'concluded'
    const isDeliberated = meetingItem?.status === 'deliberated'
    const isNotDeliberated = meetingItem?.status === 'not_deliberated'
    const isBioeticaForm = isBioeticaEvaluation(evaluationForm)
    const canAccessForm = !isBioeticaForm || Boolean(evaluationForm.can_access_form)
    const canEditCriteria = (isInDeliberation || isDeliberated) && !isConcluded && canAccessForm
    
    const protocolCode = protocol.code || `ISC-P-${id}`
    const docFileName = protocol.latest_document?.file_name || `${protocolCode}.docx`

    const criteriaMap = (evaluationForm?.form_criteria || []).reduce<Record<string, FormCriterion[]>>((g, c) => {
      const k = c.group_name || 'Outros'
      if (!g[k]) g[k] = []
      g[k].push(c)
      return g
    }, {})

    const criteriaComments: Record<number, { reviewer_name: string; comment: string }[]> = {}
    if (isSharedCommitteeEvaluation(evaluationForm) && evaluationForm.criteria_comments) {
      evaluationForm.criteria_comments.forEach(item => {
        if (!item.form_criterion_id) return
        item.reviews?.forEach(review => {
          if (!review.comment) return
          if (!criteriaComments[item.form_criterion_id!]) criteriaComments[item.form_criterion_id!] = []
          criteriaComments[item.form_criterion_id!].push({
            reviewer_name: review.reviewer_name || '',
            comment: review.comment,
          })
        })
      })
    } else {
      ;(evaluationForm?.reviewer_evaluations || []).forEach(rev => {
        const reviewerName = rev.reviewer?.user?.name || 'Revisor'
        ;(rev.criterion_reviews || []).forEach(cr => {
          if (cr.evaluation_form_criterion_id && cr.comment) {
            if (!criteriaComments[cr.evaluation_form_criterion_id]) criteriaComments[cr.evaluation_form_criterion_id] = []
            const exists = criteriaComments[cr.evaluation_form_criterion_id].some(c => c.reviewer_name === reviewerName)
            if (!exists) criteriaComments[cr.evaluation_form_criterion_id].push({ reviewer_name: reviewerName, comment: cr.comment })
          }
        })
      })
    }

    return (
      <>
        {/* ── ONLYOFFICE FULLSCREEN OVERLAY ── */}
        {onlyOfficeFullscreen && (
          <div className="onlyoffice-fullscreen-overlay">
            <div className="onlyoffice-fullscreen-toolbar">
              <div className="onlyoffice-fullscreen-toolbar-left">
                <span className="onlyoffice-fullscreen-title">{docFileName}</span>
              </div>
              <div className="onlyoffice-fullscreen-toolbar-right">
                <button className="onlyoffice-fullscreen-btn" onClick={reloadOnlyOffice} title="Recarregar editor">
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <button className="onlyoffice-fullscreen-close" onClick={toggleOnlyOfficeFullscreen} title="Sair (Esc)">
                  <span className="material-symbols-outlined">close_fullscreen</span>
                  <span>Sair</span>
                </button>
              </div>
            </div>
            <div className="onlyoffice-fullscreen-content">
              {protocol.latest_document && onlyOfficeKey >= 0 ? (
                <OnlyOfficeEditor key={onlyOfficeKey} protocolId={protocol.id} height="100%" />
              ) : (
                <div className="onlyoffice-loading">
                  <div className="onlyoffice-loading-content">
                    <div className="onlyoffice-spinner" />
                    <span>Recarregando editor...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SPLIT VIEW ── */}
        <div className={`teacher-workspace evaluation-split-view ${isDragging ? 'is-dragging' : ''}`} ref={containerRef}>
          
          {/* LEFT: ONLYOFFICE EDITOR */}
          <section className="doc-viewer-pane" style={{
            width: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0%' : `${splitPosition}%`,
            minWidth: expandedPanel === 'document' ? '100%' : expandedPanel === 'form' ? '0px' : `${MIN_PANEL_WIDTH}px`,
            opacity: expandedPanel === 'form' ? 0 : 1,
            pointerEvents: expandedPanel === 'form' ? 'none' : 'auto',
          }}>
            <div className="doc-toolbar">
              <div className="doc-toolbar-left">
                <button className="doc-toolbar-btn" onClick={toggleDocumentFullscreen}>
                  <span className="material-symbols-outlined">{expandedPanel === 'document' ? 'collapse_content' : 'expand_content'}</span>
                </button>
                <span className="doc-filename">{docFileName}</span>
                <span className="doc-file-type-badge">DOCX</span>
              </div>
              <div className="doc-toolbar-right">
                <button className="doc-toolbar-btn" onClick={reloadOnlyOffice} title="Recarregar editor">
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <button className="doc-toolbar-btn" onClick={toggleOnlyOfficeFullscreen} title="Tela cheia">
                  <span className="material-symbols-outlined">fullscreen</span>
                </button>
                <button className="doc-toolbar-btn" onClick={() => openFile(protocol.latest_document?.download_url)} title="Abrir em nova aba">
                  <span className="material-symbols-outlined">open_in_new</span>
                </button>
              </div>
            </div>

            <div className="doc-content-area">
              {!protocol.latest_document ? (
                <div className="doc-state-empty"><span className="material-symbols-outlined">description</span><p>Nenhum documento disponível</p></div>
              ) : onlyOfficeKey >= 0 ? (
                <OnlyOfficeEditor key={onlyOfficeKey} protocolId={protocol.id} height="100%" />
              ) : (
                <div className="onlyoffice-loading"><div className="onlyoffice-loading-content"><div className="onlyoffice-spinner" /><span>Recarregando editor...</span></div></div>
              )}
            </div>

            <div className="doc-bottom-bar">
              <div className="doc-bottom-bar-left">
                <span className="material-symbols-outlined">description</span>
                <span className="doc-bottom-filename">{docFileName}</span>
              </div>
              <div className="doc-bottom-bar-right">
                <button className="doc-bottom-btn doc-bottom-btn--download" onClick={() => downloadFile(protocol.latest_document?.download_url)}>
                  <span className="material-symbols-outlined">download</span><span>Download</span>
                </button>
              </div>
            </div>
          </section>

          {/* DIVIDER */}
          {expandedPanel === 'both' && (
            <div ref={dividerRef} className={`split-pane-divider ${isDragging ? 'is-dragging' : ''}`} onMouseDown={handleMouseDown}>
              <div className="split-pane-divider-handle"><span className="material-symbols-outlined">drag_indicator</span></div>
            </div>
          )}

          {/* RIGHT: REUNIÃO DE DELIBERAÇÃO */}
          <section className="evaluation-form-pane" style={{
            width: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0%' : `${100 - splitPosition}%`,
            minWidth: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0px' : `${MIN_PANEL_WIDTH}px`,
            opacity: expandedPanel === 'document' ? 0 : 1,
            pointerEvents: expandedPanel === 'document' ? 'none' : 'auto',
          }}>
            <div className="evaluation-form-header">
              <span className="material-symbols-outlined">groups</span>
              <span className="evaluation-form-header-title">Reunião de Deliberação</span>
              <button className="doc-toolbar-btn" onClick={toggleFormFullscreen}>
                <span className="material-symbols-outlined">{expandedPanel === 'form' ? 'collapse_content' : 'expand_content'}</span>
              </button>
            </div>

            <div className="evaluation-form-content">
              {/* Info Card com Estado */}
              <div className="eval-info-card">
                <div className="eval-info-header">
                  <span className="eval-info-label">Estado da Reunião</span>
                  <span className={`eval-info-badge ${state.className}`}>{state.label}</span>
                </div>
                <h4>{protocolCode}</h4>
                <p>{protocol.topic?.title || protocol.version}</p>
                {state.description && (
                  <div className="eval-state-description"><span className="material-symbols-outlined">info</span><p>{state.description}</p></div>
                )}
              </div>

              {error && <div className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}

              {/* ── Agendada ── */}
              {isScheduled && (
                <div className="deliberation-info-banner">
                  <span className="material-symbols-outlined">event</span>
                  <div>
                    <strong>Reunião Agendada</strong>
                    <p>{formatDate(meeting?.scheduled_at)} — {meeting?.location || 'Local não definido'}</p>
                  </div>
                  <span className="badge badge-warning">A Secretaria inicia a reunião no horário marcado</span>
                </div>
              )}

              {/* ── Em Deliberação ── */}
              {isInDeliberation && (
                <div className="deliberation-active-banner">
                  <span className="material-symbols-outlined">groups</span>
                  <div>
                    <strong>Reunião em Andamento</strong>
                    <p>Documento e ficha disponíveis para preparação. A Secretaria registará o resultado da reunião.</p>
                  </div>
                </div>
              )}

              {/* ── Sem Consenso ── */}
              {isNotDeliberated && (
                <div className="deliberation-pending-banner">
                  <span className="material-symbols-outlined">warning</span>
                  <div>
                    <strong>Reunião sem Consenso</strong>
                    <p>A reunião não chegou a consenso. Aguardando a secretaria agendar nova reunião.</p>
                  </div>
                </div>
              )}

              {/* ── Resultado Final ── */}
              {isConcluded && (
                <div className={`eval-outcome-banner ${finalDecision === 'approved' ? 'is-approved' : 'is-rejected'}`}>
                  <span className="material-symbols-outlined">{finalDecision === 'approved' ? 'check_circle' : 'cancel'}</span>
                  <div>
                    <strong>{finalDecision === 'approved' ? 'Protocolo Aprovado' : 'Protocolo Não Aprovado'}</strong>
                    <p>{evaluationForm?.conclusion_summary || 'Processo concluído.'}</p>
                  </div>
                </div>
              )}

              {/* ── Ficha única ── */}
              {evaluationForm && canAccessForm && (
                <div className="eval-criteria-section">
                  <h3 className="criteria-section-title">
                    <span className="material-symbols-outlined">checklist</span>
                    {isSharedCommitteeEvaluation(evaluationForm) ? `Ficha Única do ${committeeLabel(evaluationForm)}` : 'Critérios de Avaliação'}
                    {canEditCriteria && (
                      <span style={{ fontSize: 'var(--label-sm)', color: 'var(--tertiary)', fontWeight: 'var(--font-medium)', marginLeft: 'auto' }}>
                        Editável
                      </span>
                    )}
                  </h3>
                  {Object.entries(criteriaMap).map(([group, criteria]) => (
                    <div key={group} className={`criteria-group-block ${!canEditCriteria ? 'criteria-group-block--readonly' : ''}`}>
                      <h4 className="criteria-group-title">{group}</h4>
                      {criteria.map(c => {
                        const my = criterionReviews[c.id] || ''
                        const allComments = criteriaComments[c.id] || []
                        return (
                          <div key={c.id} className={`criterion-item ${!canEditCriteria ? 'criterion-item--readonly' : ''}`}>
                            <div className="criterion-header">
                              <label className="criterion-name">{c.criterion_name}</label>
                              {canEditCriteria && (
                                <div className="criterion-rating">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                      key={s}
                                      className={`rating-dot ${my?.startsWith(`Nota ${s}`) ? 'is-active' : ''}`}
                                      onClick={() => {
                                        const currentComment = my.replace(/^Nota \d\/5 - /, '') || ''
                                        setCriterionReviews(prev => ({ ...prev, [c.id]: `Nota ${s}/5 - ${currentComment}` }))
                                      }}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {!canEditCriteria && my && (
                                <div className="criterion-rating">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} className={`rating-dot rating-dot--readonly ${my?.startsWith(`Nota ${s}`) ? 'is-active' : ''}`}>
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {allComments.length > 0 && (
                              <div className="criterion-comments">
                                {allComments.map((comment, idx) => (
                                  <div key={idx} className="criterion-comment">
                                    {comment.reviewer_name && (
                                      <span className="criterion-comment-author">{comment.reviewer_name}:</span>
                                    )}
                                    <span className="criterion-comment-text">{comment.comment?.replace(/^Nota \d\/5 - /, '') || comment.comment}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {canEditCriteria && (
                              <textarea
                                value={my?.replace(/^Nota \d\/5 - /, '') || ''}
                                onChange={e => setCriterionReviews(prev => ({ ...prev, [c.id]: e.target.value }))}
                                onBlur={() => handleSaveCriterionReview(c.id)}
                                placeholder="Observações da ficha única..."
                                rows={3}
                                className="criterion-textarea"
                                style={{ marginTop: 'var(--space-1)' }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}

                  {isDeliberated && !isConcluded && canAccessForm && (
                    <div className="eval-recommendation-section">
                      <h3><span className="material-symbols-outlined">gavel</span>Decisão final</h3>
                      <div className="eval-field"><label htmlFor="meeting-decision-summary">Resumo da decisão</label><textarea id="meeting-decision-summary" value={deliberationSummary} onChange={event => setDeliberationSummary(event.target.value)} rows={3} className="criterion-textarea" /></div>
                      <div className="recommendation-choices">
                        <label className={`recommendation-choice ${deliberationDecision === 'approved' ? 'is-approved' : ''}`}><input type="radio" name="meeting-decision" checked={deliberationDecision === 'approved'} onChange={() => setDeliberationDecision('approved')} /><span className="material-symbols-outlined">check_circle</span>Aprovar</label>
                        <label className={`recommendation-choice ${deliberationDecision === 'not_approved' ? 'is-rejected' : ''}`}><input type="radio" name="meeting-decision" checked={deliberationDecision === 'not_approved'} onChange={() => setDeliberationDecision('not_approved')} /><span className="material-symbols-outlined">cancel</span>Não aprovar</label>
                      </div>
                      <button className="btn btn-primary btn-block btn-lg" type="button" onClick={() => void handleSubmitDecision()} disabled={!deliberationDecision || submittingDecision}>{submittingDecision ? 'A registar...' : 'Registar decisão final'}</button>
                    </div>
                  )}

                </div>
              )}
              {evaluationForm && !canAccessForm && (
                <div className="eval-notice eval-notice--warning">
                  <span className="material-symbols-outlined">lock</span>
                  Esta ficha não está disponível para o seu perfil de revisor.
                </div>
              )}
              <div style={{ height: 40 }} />
            </div>
          </section>
        </div>
      </>
    )
  }

  // ═══════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════
  return (
    <div className="page-loader">
      <p>Dados não encontrados.</p>
      <Link to="/reviewer/meetings" className="btn btn-outline">Voltar</Link>
    </div>
  )
}
