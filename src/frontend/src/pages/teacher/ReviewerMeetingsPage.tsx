// src/pages/reviewer/ReviewerMeetingsPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { protocolService, type Protocol } from '../../services/protocolService'
import { evaluationService, type EvaluationForm, type FormCriterion } from '../../services/evaluationService'
import { useAuth } from '../../context/AuthContext'
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
        label: 'Reunião Encerrada',
        className: 'is-deliberated',
        description: 'Houve deliberação. Aguardando decisão final na aba de Decisões Pendentes.',
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
        label: evaluationForm.final_decision === 'approved' ? 'Aprovado' : 'Reprovado',
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

// ── Componente Principal ──────────────────────────────
export default function ReviewerMeetingsPage() {
  const { protocolId } = useParams<{ protocolId: string }>()
  const { user } = useAuth()
  const id = Number(protocolId)

  // ── Protocol & Form state ──
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null)
  const [criterionReviews, setCriterionReviews] = useState<Record<number, string>>({})
  const [finalDecision, setFinalDecision] = useState<string | null>(null)

  // ── Deliberation state ──
  const [deliberationSummary, setDeliberationSummary] = useState('')
  const [isStartingDeliberation, setIsStartingDeliberation] = useState(false)
  const [isClosingMeeting, setIsClosingMeeting] = useState(false)
  const [closingResult, setClosingResult] = useState<'deliberated' | 'not_deliberated' | null>(null)

  // ── Shared state ──
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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
  }, [expandedPanel, splitPosition, onlyOfficeFullscreen])

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (id) loadMeetingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

      const formsData = await evaluationService.listForReviewer()
      const form = formsData.evaluation_forms?.find(f => f.protocol_id === id)
      
      if (!form) {
        setError('Ficha de avaliação não encontrada.')
        setLoading(false)
        return
      }

      const fullForm = await evaluationService.getForm(form.id)
      const formData = fullForm.evaluation_form
      
      if (!formData) {
        setError('Dados da ficha não encontrados.')
        setLoading(false)
        return
      }

      setEvaluationForm(formData)
      setFinalDecision(formData.final_decision || null)
      setDeliberationSummary(formData.conclusion_summary || '')
      setClosingResult(null)

      const allEvals = formData.reviewer_evaluations || []
      const reviews: Record<number, string> = {}
      allEvals.forEach(rev => {
        ;(rev.criterion_reviews || []).forEach(cr => {
          if (cr.evaluation_form_criterion_id && cr.comment) {
            if (!reviews[cr.evaluation_form_criterion_id]) {
              reviews[cr.evaluation_form_criterion_id] = cr.comment
            }
          }
        })
      })
      setCriterionReviews(reviews)

    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados da reunião.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStartDeliberation() {
    if (!evaluationForm) return
    setIsStartingDeliberation(true)
    setError(null)
    try {
      await evaluationService.startDeliberation(evaluationForm.id)
      setSuccess('Reunião de deliberação iniciada.')
      await loadMeetingData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsStartingDeliberation(false)
    }
  }

  async function handleCloseMeeting(result: 'deliberated' | 'not_deliberated') {
    if (!evaluationForm) return
    setIsClosingMeeting(true)
    setClosingResult(result)
    setError(null)
    try {
      const { message } = await evaluationService.closeMeeting(evaluationForm.id, result)
      setSuccess(message)
      await loadMeetingData()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsClosingMeeting(false)
      setClosingResult(null)
    }
  }

  async function openFile(url: string | null | undefined) {
    if (!url) return
    try { await evaluationService.openFile(url) } catch (e) {}
  }
  
  async function downloadFile(url: string | null | undefined) {
    if (!url) return
    try { await evaluationService.downloadFile(url) } catch (e) {}
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
    const state = getMeetingState(evaluationForm)
    const isInDeliberation = evaluationForm?.status === 'in_deliberation'
    const isScheduled = evaluationForm?.status === 'deliberation_scheduled'
    const isConcluded = evaluationForm?.status === 'concluded'
    const isDeliberated = evaluationForm?.status === 'deliberated'
    const isNotDeliberated = evaluationForm?.status === 'not_deliberated'
    
    const protocolCode = protocol.code || `ISC-P-${id}`
    const docFileName = protocol.latest_document?.file_name || `${protocolCode}.docx`

    const criteriaMap = (evaluationForm?.form_criteria || []).reduce<Record<string, FormCriterion[]>>((g, c) => {
      const k = c.group_name || 'Outros'
      if (!g[k]) g[k] = []
      g[k].push(c)
      return g
    }, {})

    const criteriaComments: Record<number, { reviewer_name: string; comment: string }[]> = {}
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
        <div className={`evaluation-split-view ${isDragging ? 'is-dragging' : ''}`} ref={containerRef}>
          
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

              {success && <div className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
              {error && <div className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}

              {/* ── Agendada ── */}
              {isScheduled && (
                <div className="deliberation-info-banner">
                  <span className="material-symbols-outlined">event</span>
                  <div>
                    <strong>Reunião Agendada</strong>
                    <p>{formatDate(evaluationForm.deliberation_date)} — {evaluationForm.deliberation_location || 'Local não definido'}</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleStartDeliberation} disabled={isStartingDeliberation}>
                    {isStartingDeliberation ? 'A iniciar...' : 'Iniciar Reunião'}
                  </button>
                </div>
              )}

              {/* ── Em Deliberação ── */}
              {isInDeliberation && (
                <div className="deliberation-active-banner">
                  <span className="material-symbols-outlined">groups</span>
                  <div>
                    <strong>Reunião em Andamento</strong>
                    <p>Documento partilhado para edição conjunta. Registe o resultado da deliberação.</p>
                  </div>
                </div>
              )}

              {/* ── Deliberado ── */}
              {isDeliberated && (
                <div className="deliberation-info-banner" style={{ borderColor: 'var(--primary)', background: 'var(--primary-container)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>task_alt</span>
                  <div>
                    <strong>Reunião Encerrada com Deliberação</strong>
                    <p>A ficha segue para a aba de Decisões Pendentes para decisão final.</p>
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
                    <strong>{finalDecision === 'approved' ? 'Protocolo Aprovado' : 'Protocolo Reprovado'}</strong>
                    <p>{evaluationForm?.conclusion_summary || 'Processo concluído.'}</p>
                  </div>
                </div>
              )}

              {/* ── CRITÉRIOS (Leitura) ── */}
              {evaluationForm && (
                <div className="eval-criteria-section">
                  <h3 className="criteria-section-title"><span className="material-symbols-outlined">checklist</span>Critérios de Avaliação</h3>
                  {Object.entries(criteriaMap).map(([group, criteria]) => (
                    <div key={group} className="criteria-group-block criteria-group-block--readonly">
                      <h4 className="criteria-group-title">{group}</h4>
                      {criteria.map(c => {
                        const my = criterionReviews[c.id] || ''
                        const allComments = criteriaComments[c.id] || []
                        return (
                          <div key={c.id} className="criterion-item criterion-item--readonly">
                            <div className="criterion-header">
                              <label className="criterion-name">{c.criterion_name}</label>
                              {my && (
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
                                    <span className="criterion-comment-author">{comment.reviewer_name}:</span>
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

                  {/* ── Encerrar Reunião (2 botões) ── */}
                  {isInDeliberation && (
                    <div className="eval-recommendation-section">
                      <h3>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>gavel</span>
                        Resultado da Deliberação
                      </h3>
                      <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
                        Registe o resultado final da reunião.
                      </p>
                      
                      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        {/* Botão Deliberado */}
                        <button
                          onClick={() => handleCloseMeeting('deliberated')}
                          disabled={isClosingMeeting}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: closingResult === 'deliberated'
                              ? 'var(--primary)'
                              : 'var(--primary-container)',
                            color: closingResult === 'deliberated'
                              ? 'var(--on-primary)'
                              : 'var(--on-primary-container)',
                            border: `2px solid var(--primary)`,
                            borderRadius: 'var(--radius-lg)',
                            fontFamily: 'var(--font-family)',
                            fontSize: 'var(--body-md)',
                            fontWeight: 'var(--font-semibold)',
                            cursor: isClosingMeeting ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isClosingMeeting && closingResult !== 'deliberated' ? 0.6 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!isClosingMeeting) {
                              e.currentTarget.style.background = 'var(--primary)'
                              e.currentTarget.style.color = 'var(--on-primary)'
                              e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isClosingMeeting) {
                              e.currentTarget.style.background = closingResult === 'deliberated'
                                ? 'var(--primary)'
                                : 'var(--primary-container)'
                              e.currentTarget.style.color = closingResult === 'deliberated'
                                ? 'var(--on-primary)'
                                : 'var(--on-primary-container)'
                              e.currentTarget.style.boxShadow = 'var(--elevation-1)'
                            }
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                            {closingResult === 'deliberated' && isClosingMeeting ? 'hourglass_top' : 'check_circle'}
                          </span>
                          <span>
                            {closingResult === 'deliberated' && isClosingMeeting ? 'A processar...' : 'Deliberado'}
                          </span>
                        </button>

                        {/* Botão Não Deliberado */}
                        <button
                          onClick={() => handleCloseMeeting('not_deliberated')}
                          disabled={isClosingMeeting}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: closingResult === 'not_deliberated'
                              ? 'var(--error)'
                              : 'var(--error-container)',
                            color: closingResult === 'not_deliberated'
                              ? 'var(--on-error)'
                              : 'var(--on-error-container)',
                            border: `2px solid var(--error)`,
                            borderRadius: 'var(--radius-lg)',
                            fontFamily: 'var(--font-family)',
                            fontSize: 'var(--body-md)',
                            fontWeight: 'var(--font-semibold)',
                            cursor: isClosingMeeting ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isClosingMeeting && closingResult !== 'not_deliberated' ? 0.6 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!isClosingMeeting) {
                              e.currentTarget.style.background = 'var(--error)'
                              e.currentTarget.style.color = 'var(--on-error)'
                              e.currentTarget.style.boxShadow = 'var(--elevation-2)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isClosingMeeting) {
                              e.currentTarget.style.background = closingResult === 'not_deliberated'
                                ? 'var(--error)'
                                : 'var(--error-container)'
                              e.currentTarget.style.color = closingResult === 'not_deliberated'
                                ? 'var(--on-error)'
                                : 'var(--on-error-container)'
                              e.currentTarget.style.boxShadow = 'var(--elevation-1)'
                            }
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                            {closingResult === 'not_deliberated' && isClosingMeeting ? 'hourglass_top' : 'cancel'}
                          </span>
                          <span>
                            {closingResult === 'not_deliberated' && isClosingMeeting ? 'A processar...' : 'Não Deliberado'}
                          </span>
                        </button>
                      </div>
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