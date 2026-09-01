// src/pages/reviewer/FinalDecisionDetailPage.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { protocolService, type Protocol } from '../../services/protocolService'
import { evaluationService, type EvaluationForm, type EvaluationOrgan, type EvaluationOpinionResult, type FormCriterion } from '../../services/evaluationService'
import { useAuth } from '../../context/AuthContext'
import OnlyOfficeEditor from '../../components/OnlyOfficeEditor/OnlyOfficeEditor'
import '../../styles/global.css'

// ── Helpers ────────────────────────────────────────────
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr || '' }
}

function organForEvaluation(form?: Pick<EvaluationForm, 'organ'> | null): EvaluationOrgan {
  return form?.organ === 'comite_bioetica' ? 'comite-bioetica' : 'comite-cientifico'
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
export default function FinalDecisionDetailPage() {
  const { formId } = useParams<{ formId: string }>()
  const { user } = useAuth()
  const id = Number(formId)

  // ── Protocol & Form state ──
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [form, setForm] = useState<EvaluationForm | null>(null)
  const [criterionReviews, setCriterionReviews] = useState<Record<number, string>>({})

  // ── Decision state ──
  const [decision, setDecision] = useState<'approved' | 'not_approved' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [opinion, setOpinion] = useState<EvaluationOpinionResult | null>(null)

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

  function toggleOnlyOfficeFullscreen() { setOnlyOfficeFullscreen(prev => !prev) }

  function reloadOnlyOffice() {
    setOnlyOfficeKey(-1)
    setTimeout(() => { setOnlyOfficeKey(prev => Math.abs(prev) + 1) }, 150)
  }

  useEffect(() => {
    function k(e: KeyboardEvent) {
      if (e.key === 'Escape' && onlyOfficeFullscreen) setOnlyOfficeFullscreen(false)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onlyOfficeFullscreen])

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const { evaluation_form } = await evaluationService.getFormAcrossCommittees(id)
      setForm(evaluation_form)

      // Carregar protocolo
      if (evaluation_form.protocol_id) {
        try {
          const data = await protocolService.listForReviewer()
          const p = data.protocols?.find(p => p.id === evaluation_form.protocol_id)
          if (p) setProtocol(p)
        } catch {}
      }

      const reviews: Record<number, string> = {}
      if (isSharedCommitteeEvaluation(evaluation_form) && evaluation_form.criteria_comments) {
        evaluation_form.criteria_comments.forEach(item => {
          const first = item.reviews?.find(review => review.comment)
          if (item.form_criterion_id && first?.comment) {
            reviews[item.form_criterion_id] = first.comment
          }
        })
      } else {
        const allEvals = evaluation_form.reviewer_evaluations || []
        allEvals.forEach(rev => {
          ;(rev.criterion_reviews || []).forEach(cr => {
            if (cr.evaluation_form_criterion_id && cr.comment) {
              if (!reviews[cr.evaluation_form_criterion_id]) {
                reviews[cr.evaluation_form_criterion_id] = cr.comment
              } else {
                const existing = reviews[cr.evaluation_form_criterion_id]
                if (!existing.includes(cr.comment)) {
                  reviews[cr.evaluation_form_criterion_id] = existing + '\n---\n' + cr.comment
                }
              }
            }
          })
        })
      }
      setCriterionReviews(reviews)

    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveCriterionReview(fcId: number) {
    if (!form || form.status === 'concluded') return
    try {
      await evaluationService.saveCriterionReview(form.id, fcId, criterionReviews[fcId] || null, organForEvaluation(form))
    } catch (e: any) {
      // Silencioso no auto-save
    }
  }

  async function handleDecide() {
    if (!decision) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await evaluationService.decide(id, decision, null, organForEvaluation(form))
      setOpinion(result.opinion || null)
      setForm(result.evaluation_form)
      setSuccess(result.message || 'Decisão registada com sucesso.')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function openFile(url: string | null | undefined) {
    if (!url) return
    try { await evaluationService.openFile(url) } catch (e) {}
  }

  async function downloadFile(url: string | null | undefined, name?: string) {
    if (!url) return
    try { await evaluationService.downloadFile(url, name) } catch (e) {}
  }

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading) return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <span className="page-loader__text">A carregar decisão...</span>
    </div>
  )

  // ═══════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════
  if (error && !form) return (
    <div className="page-loader">
      <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>error_outline</span>
      <p>{error}</p>
      <Link to="/reviewer/final-decisions" className="btn btn-outline" style={{ marginTop: 16 }}>Voltar</Link>
    </div>
  )

  if (!form) return null

  const alreadyDecided = form.status === 'concluded'
  const isSharedCommittee = isSharedCommitteeEvaluation(form)
  const canAccessForm = form.organ !== 'comite_bioetica' || Boolean(form.can_access_form)
  const canEdit = !alreadyDecided && !isSharedCommittee && canAccessForm
  const canDecide = !alreadyDecided && canAccessForm
  const protocolCode = form.protocol?.code || protocol?.code || `#${form.protocol_id}`
  const docFileName = protocol?.latest_document?.file_name || `${protocolCode}.docx`
  const evaluationFormDownloadUrl = `/api/v1/evaluation-forms/${form.id}/download`

  const criteriaMap = (form?.form_criteria || []).reduce<Record<string, FormCriterion[]>>((g, c) => {
    const k = c.group_name || 'Outros'
    if (!g[k]) g[k] = []
    g[k].push(c)
    return g
  }, {})

  const criteriaComments: Record<number, { reviewer_name: string; comment: string; is_mine: boolean }[]> = {}
  if (isSharedCommittee && form.criteria_comments) {
    form.criteria_comments.forEach(item => {
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
    ;(form?.reviewer_evaluations || []).forEach(rev => {
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

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
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
                <span className="material-symbols-outlined">close_fullscreen</span><span>Sair</span>
              </button>
            </div>
          </div>
          <div className="onlyoffice-fullscreen-content">
            {protocol?.latest_document && onlyOfficeKey >= 0 ? (
              <OnlyOfficeEditor key={onlyOfficeKey} protocolId={protocol.id} height="100%" />
            ) : (
              <div className="onlyoffice-loading"><div className="onlyoffice-loading-content"><div className="onlyoffice-spinner" /><span>Recarregando editor...</span></div></div>
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
              <button className="doc-toolbar-btn" onClick={() => openFile(protocol?.latest_document?.download_url)} title="Abrir em nova aba">
                <span className="material-symbols-outlined">open_in_new</span>
              </button>
            </div>
          </div>

          <div className="doc-content-area">
            {!protocol?.latest_document ? (
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
              <button className="doc-bottom-btn doc-bottom-btn--download" onClick={() => downloadFile(protocol?.latest_document?.download_url)}>
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

        {/* RIGHT: FICHA DE AVALIAÇÃO + DECISÃO */}
        <section className="evaluation-form-pane" style={{
          width: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0%' : `${100 - splitPosition}%`,
          minWidth: expandedPanel === 'form' ? '100%' : expandedPanel === 'document' ? '0px' : `${MIN_PANEL_WIDTH}px`,
          opacity: expandedPanel === 'document' ? 0 : 1,
          pointerEvents: expandedPanel === 'document' ? 'none' : 'auto',
        }}>
          <div className="evaluation-form-header">
            <span className="material-symbols-outlined">fact_check</span>
            <span className="evaluation-form-header-title">Ficha de Avaliação</span>
            <button className="doc-toolbar-btn" onClick={toggleFormFullscreen}>
              <span className="material-symbols-outlined">{expandedPanel === 'form' ? 'collapse_content' : 'expand_content'}</span>
            </button>
          </div>

          <div className="evaluation-form-content">
            {/* Info Card */}
            <div className="eval-info-card">
              <div className="eval-info-header">
                <span className="eval-info-label">Decisão Final</span>
                <span className={`eval-info-badge ${alreadyDecided ? (form.final_decision === 'approved' ? 'is-concluded' : 'is-rejected') : 'is-pending'}`}>
                  {alreadyDecided ? (form.final_decision === 'approved' ? 'Aprovado' : 'Não Aprovado') : 'Pendente'}
                </span>
              </div>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'var(--label-sm)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--primary)',
                background: 'var(--primary-container)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                marginTop: 'var(--space-1)',
              }}>
                {protocolCode}
              </span>
              <h4 style={{ marginTop: 'var(--space-1)' }}>{form.protocol?.topic?.title || 'Sem título'}</h4>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                {form.protocol?.student?.name && (
                  <><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: 4 }}>person</span>
                  {form.protocol.student.name}</>
                )}
                {form.deliberation_date && ` • Deliberação: ${formatDate(form.deliberation_date)}`}
              </p>
            </div>

            {error && <div className="eval-notice eval-notice--error"><span className="material-symbols-outlined">error</span>{error}</div>}
            {success && <div className="eval-notice eval-notice--success"><span className="material-symbols-outlined">check_circle</span>{success}</div>}

            {/* ── Já decidido ── */}
            {alreadyDecided && (
              <div className={`eval-outcome-banner ${form.final_decision === 'approved' ? 'is-approved' : 'is-rejected'}`}>
                <span className="material-symbols-outlined">{form.final_decision === 'approved' ? 'check_circle' : 'cancel'}</span>
                <div>
                  <strong>{form.final_decision === 'approved' ? 'Protocolo Aprovado' : 'Protocolo Não Aprovado'}</strong>
                  <p>{form.conclusion_summary || 'Processo concluído.'}</p>
                  {(opinion?.download_url || evaluationFormDownloadUrl) && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      {opinion?.download_url && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadFile(opinion.download_url, `parecer-${protocolCode}.pdf`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', marginRight: 'var(--space-1)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                          Descarregar Parecer
                        </button>
                      )}
                      <button type="button" className="btn btn-small" onClick={() => downloadFile(evaluationFormDownloadUrl, `ficha-${protocolCode}.pdf`)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment</span>
                        Descarregar Ficha
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Decisões dos Revisores ── */}
              {form.reviewer_evaluations && form.reviewer_evaluations.length > 0 && (
                <div className="eval-reviewer-status">
                  <h3><span className="material-symbols-outlined">group</span>Decisões dos Revisores</h3>
                  <div className="reviewer-chips-list">
                    {form.reviewer_evaluations.map((re, i) => (
                    <span
                      key={re.id}
                      className={`reviewer-chip ${re.decision === 'approved' ? 'is-submitted' : ''}`}
                      style={re.decision === 'not_approved' ? { background: 'var(--error-container)', color: 'var(--on-error-container)' } : {}}
                    >
                      {re.reviewer?.user?.name || `Revisor #${i + 1}`}
                      {re.is_primary && ' · Principal'}
                      {re.decision === 'approved' && ': ✓ Aprovou'}
                      {re.decision === 'not_approved' && ': ✗ Não Aprovou'}
                      {!re.decision && ': ○ Pendente'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── CRITÉRIOS (EDITÁVEIS antes da decisão) ── */}
            {form && (
              <div className="eval-criteria-section">
                <h3 className="criteria-section-title">
                  <span className="material-symbols-outlined">checklist</span>
                  {isSharedCommittee ? `Ficha Única do ${committeeLabel(form)}` : 'Critérios de Avaliação'}
                  {canEdit && (
                    <span style={{ fontSize: 'var(--label-sm)', color: 'var(--tertiary)', fontWeight: 'var(--font-medium)', marginLeft: 'auto' }}>
                      Editável
                    </span>
                  )}
                </h3>
                {Object.entries(criteriaMap).map(([group, criteria]) => (
                  <div key={group} className={`criteria-group-block ${!canEdit ? 'criteria-group-block--readonly' : ''}`}>
                    <h4 className="criteria-group-title">{group}</h4>
                    {criteria.map(c => {
                      const my = criterionReviews[c.id] || ''
                      const allComments = criteriaComments[c.id] || []
                      return (
                        <div key={c.id} className={`criterion-item ${!canEdit ? 'criterion-item--readonly' : ''}`}>
                          <div className="criterion-header">
                            <label className="criterion-name">{c.criterion_name}</label>
                            {canEdit && (
                              <div className="criterion-rating">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <button
                                    key={s}
                                    className={`rating-dot ${my?.startsWith(`Nota ${s}`) ? 'is-active' : ''}`}
                                    onClick={() => {
                                      const currentComment = my.replace(/^Nota \d\/5 - /, '') || ''
                                      setCriterionReviews(prev => ({
                                        ...prev,
                                        [c.id]: `Nota ${s}/5 - ${currentComment}`
                                      }))
                                    }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!canEdit && my && (
                              <div className="criterion-rating">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <span
                                    key={s}
                                    className={`rating-dot rating-dot--readonly ${my?.startsWith(`Nota ${s}`) ? 'is-active' : ''}`}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Comentários dos revisores (sempre visíveis) */}
                          {allComments.length > 0 && (
                            <div className="criterion-comments">
                              {allComments.map((comment, idx) => (
                                <div key={idx} className={`criterion-comment ${comment.is_mine ? 'is-mine' : 'is-other'}`}>
                                  {comment.reviewer_name && (
                                    <span className="criterion-comment-author">
                                      {comment.reviewer_name}{comment.is_mine ? ' (você)' : ''}:
                                    </span>
                                  )}
                                  <span className="criterion-comment-text">
                                    {comment.comment?.replace(/^Nota \d\/5 - /, '') || comment.comment}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Textarea editável (apenas antes da decisão) */}
                          {canEdit && (
                            <textarea
                              value={my?.replace(/^Nota \d\/5 - /, '') || ''}
                              onChange={e => setCriterionReviews(prev => ({
                                ...prev,
                                [c.id]: e.target.value
                              }))}
                              onBlur={() => handleSaveCriterionReview(c.id)}
                              placeholder="Rever e editar observações..."
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

                {/* ── Decisão Final (apenas botões) ── */}
                {!canAccessForm && (
                  <div className="eval-notice eval-notice--warning">
                    <span className="material-symbols-outlined">lock</span>
                    O preenchimento da ficha do Comité de Bioética está disponível apenas para o revisor principal.
                  </div>
                )}

                {canDecide && (
                  <div className="eval-recommendation-section">
                    <h3>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>gavel</span>
                      Decisão Final
                    </h3>
                    <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
                      Reveja os critérios acima e registe a decisão final.
                    </p>

                    <div className="recommendation-choices">
                      <label className={`recommendation-choice ${decision === 'approved' ? 'is-approved' : ''}`}>
                        <input type="radio" name="final-decision" checked={decision === 'approved'} onChange={() => setDecision('approved')} />
                        <span className="material-symbols-outlined">check_circle</span>
                        Aprovado
                      </label>
                      <label className={`recommendation-choice ${decision === 'not_approved' ? 'is-rejected' : ''}`}>
                        <input type="radio" name="final-decision" checked={decision === 'not_approved'} onChange={() => setDecision('not_approved')} />
                        <span className="material-symbols-outlined">cancel</span>
                        Não Aprovado
                      </label>
                    </div>

                    <button
                      className="btn btn-primary btn-block btn-lg"
                      onClick={handleDecide}
                      disabled={!decision || submitting}
                    >
                      {submitting ? 'A enviar decisão...' : 'Confirmar Decisão Final'}
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
