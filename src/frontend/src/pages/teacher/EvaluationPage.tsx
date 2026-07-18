import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  topicService,
  type Topic,
  type TopicReviewComment,
} from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { evaluationService, type EvaluationForm, type EvaluationOpinionResult, type FormCriterion } from '../../services/evaluationService'
import { useAuth } from '../../context/AuthContext'
import TopicJustification from '../../components/TopicJustification'
import '../../styles/global.css'
import './EvaluationPage.css'

function isTopicClosed(status?: string) {
  return status === 'topic_approved_nucleo' || status === 'topic_rejected_nucleo' || status === 'topic_rejected'
}

function decisionLabel(decision: 'approved' | 'rejected' | null | undefined) {
  if (decision === 'approved') return 'Aprovado'
  if (decision === 'rejected') return 'Não aprovado'
  return 'Pendente'
}

function organLabel(organ?: string) {
  const labels: Record<string, string> = {
    nucleo: 'Núcleo Científico',
    comite_cientifico: 'Comité Científico',
    comite_bioetica: 'Comité de Bioética',
  }

  return labels[organ || ''] || 'Órgão Científico'
}

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

  useEffect(() => {
    if (isProtocol && id) loadProtocolEvaluation()
    else if (id) loadTopicEvaluation()
  }, [id, isProtocol])

  // ═══════════════════════════════════════════════
  // TOPIC EVALUATION (existing)
  // ═══════════════════════════════════════════════
  async function loadTopicEvaluation() {
    setLoading(true)
    try {
      const topicsData = await topicService.listForReviewer()
      const currentTopic = topicsData.topics.find(t => t.id === id)

      if (!currentTopic) {
        throw new Error('Tema não encontrado entre as revisões atribuídas a si.')
      }

      setTopic(currentTopic)

      const currentDecision = currentTopic.my_assignment?.evaluation?.decision ?? null
      const isClosed = isTopicClosed(currentTopic.status)

      setMyDecision(currentDecision)
      setEvaluationDone(Boolean(currentDecision) || isClosed)
      setDecision('')

      if (currentDecision) {
        setSuccess(`A sua avaliação já foi registada: ${decisionLabel(currentDecision)}.`)
      } else if (isClosed) {
        setSuccess('Este tema já foi avaliado e o processo de revisão está concluído.')
      } else {
        setSuccess(null)
      }

      const response = await topicService.getComments(id)
      setComments(response.comments || [])

      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || evaluationDone) return
    setSubmitting(true)
    setError(null)
    try {
      await topicService.submitComment(id, newComment)
      setNewComment('')
      setSuccess('Comentário adicionado com sucesso!')
      await loadTopicEvaluation()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDecision() {
    if (!decision || evaluationDone) return
    setSubmitting(true)
    setError(null)
    try {
      await topicService.submitEvaluation(id, decision)
      setMyDecision(decision)
      setSuccess(`Tema ${decision === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
      setEvaluationDone(true)
      setDecision('')
      await loadTopicEvaluation()
      setTimeout(() => { navigate('/reviews') }, 2000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════
  // PROTOCOL EVALUATION (new)
  // ═══════════════════════════════════════════════
  async function loadProtocolEvaluation() {
    setLoading(true)
    try {
      const data = await protocolService.listForReviewer()
      const currentProtocol = data.protocols.find(p => p.id === id)

      if (!currentProtocol) {
        throw new Error('Protocolo não encontrado entre as revisões atribuídas a si.')
      }

      setProtocol(currentProtocol)

      const formsData = await evaluationService.listForReviewer()
      const form = formsData.evaluation_forms.find(f => f.protocol_id === id)

      if (!form) {
        throw new Error('Nenhuma ficha de avaliação encontrada para este protocolo.')
      }

      const fullForm = await evaluationService.getForm(form.id)
      setEvaluationForm(fullForm.evaluation_form)

      const allEvals = fullForm.evaluation_form.reviewer_evaluations || []
      const currentUserId = user?.id ? Number(user.id) : null
      const myEval = allEvals.find(
        re => currentUserId !== null && re.reviewer?.user?.id === currentUserId
      )
      const mySubmitStatus = myEval?.status === 'submitted'
      const allSubmitted = allEvals.length > 0 && allEvals.every(re => re.status === 'submitted')
      const concluded = fullForm.evaluation_form.status === 'concluded'

      setFormConcluded(concluded)
      setMyEvaluationSubmitted(mySubmitStatus)
      setAllReviewersSubmitted(allSubmitted)
      setProtocolDecision(fullForm.evaluation_form.final_decision || myEval?.recommendation || null)
      setRecommendation('')
      setOverallComment('')
      setFinalDecision('')
      setConclusionSummary(fullForm.evaluation_form.conclusion_summary || '')
      setCriterionReviews({})
      setOpinionResult(null)

      if (myEval?.criterion_reviews) {
        const reviews: Record<number, string> = {}
        myEval.criterion_reviews.forEach(cr => {
          if (cr.evaluation_form_criterion_id && cr.comment) {
            reviews[cr.evaluation_form_criterion_id] = cr.comment
          }
        })
        setCriterionReviews(reviews)
      }

      if (concluded) {
        setSuccess('Este protocolo já foi avaliado e o processo está concluído.')
      } else if (mySubmitStatus) {
        setSuccess('A sua avaliação já foi submetida. Aguarde a conclusão.')
      } else {
        setSuccess(null)
      }

      try {
        const { opinions } = await protocolService.listOpinions(id)
        const latestOpinion = opinions[0]
        if (latestOpinion) {
          setOpinionResult({
            id: latestOpinion.id,
            decision: latestOpinion.decision,
            issued_at: latestOpinion.issued_at,
            document_url: latestOpinion.document_url || undefined,
            download_url: latestOpinion.download_url || undefined,
            evaluation_form_download_url: latestOpinion.evaluation_form_download_url || undefined,
          })
        }
      } catch {
        setOpinionResult(null)
      }

      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveCriterionReview(formCriterionId: number) {
    if (!evaluationForm || myEvaluationSubmitted || formConcluded) return
    setError(null)
    try {
      const comment = criterionReviews[formCriterionId] || null
      await evaluationService.saveCriterionReview(evaluationForm.id, formCriterionId, comment)
      setSuccess('Comentário guardado!')
      setTimeout(() => setSuccess(null), 2000)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function openFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return

    try {
      await evaluationService.openFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function downloadFile(url: string | null | undefined, fallbackFilename?: string) {
    if (!url) return

    try {
      await evaluationService.downloadFile(url, fallbackFilename)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleSubmitEvaluation() {
    if (!evaluationForm || !recommendation || myEvaluationSubmitted || formConcluded) return
    setSubmitting(true)
    setError(null)
    try {
      await evaluationService.submit(
        evaluationForm.id,
        recommendation,
        overallComment || null
      )
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
    setSubmitting(true)
    setError(null)
    try {
      const result = await evaluationService.decide(
        evaluationForm.id,
        finalDecision,
        conclusionSummary || null
      )
      setSuccess(result.message)
      setFormConcluded(true)
      setProtocolDecision(finalDecision)
      if (result.opinion) {
        setOpinionResult(result.opinion)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════
  const topicClosed = isTopicClosed(topic?.status)
  const evaluationStatusMessage = topicClosed
    ? topic?.status === 'topic_approved_nucleo'
      ? 'Este tema foi aprovado pelo Núcleo Científico.'
      : 'Este tema foi rejeitado pelo Núcleo Científico.'
    : myDecision
      ? `A sua avaliação foi registada como "${decisionLabel(myDecision)}".`
      : ''

  const groupedCriteria = evaluationForm?.form_criteria?.reduce<Record<string, FormCriterion[]>>((groups, c) => {
    const group = c.group_name || 'Outros'
    if (!groups[group]) groups[group] = []
    groups[group].push(c)
    return groups
  }, {}) || {}

  const reviewerEvaluations = evaluationForm?.reviewer_evaluations || []
  const currentUserId = user?.id ? Number(user.id) : null
  const finalProtocolDecision = evaluationForm?.final_decision || protocolDecision
  const protocolEvaluationState = formConcluded
    ? 'Concluído'
    : myEvaluationSubmitted
      ? 'Submetido'
      : 'Pendente'

  if (loading) {
    return (
      <div style={{
        width: '100%',
        fontFamily: 'var(--font-family)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        fontSize: 'var(--body-lg)',
        color: 'var(--on-surface-variant)'
      }}>
        <span style={{
          width: '24px',
          height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite',
          marginRight: 'var(--space-2)'
        }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // TOPIC EVALUATION RENDER
  // ═══════════════════════════════════════════════
  if (!isProtocol && topic) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-background)',
        width: '100%'
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <Link
                to="/reviews"
                style={{
                  color: 'var(--on-surface-variant)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
              </Link>
              <h1 style={{
                fontSize: 'var(--headline-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-family)'
              }}>
                Avaliação do tema #{id}
              </h1>
            </div>
            <p style={{
              fontSize: 'var(--body-md)',
              color: 'var(--on-surface-variant)',
              fontFamily: 'var(--font-family)'
            }}>
              {topic.title}
            </p>
            {topic.status_label && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: 'var(--space-1)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--label-sm)',
                fontWeight: 'var(--font-medium)',
                background: topic.status === 'topic_approved_nucleo'
                  ? 'var(--primary-container)'
                  : topic.status === 'topic_rejected_nucleo'
                    ? 'var(--error-container)'
                    : 'var(--surface-container)',
                color: topic.status === 'topic_approved_nucleo'
                  ? 'var(--on-primary-container)'
                  : topic.status === 'topic_rejected_nucleo'
                    ? 'var(--on-error-container)'
                    : 'var(--on-surface-variant)'
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: 'var(--radius-full)',
                  background: topic.status === 'topic_approved_nucleo'
                    ? 'var(--primary)' : topic.status === 'topic_rejected_nucleo'
                      ? 'var(--error)' : 'var(--outline)'
                }} />
                {topic.status_label}
              </span>
            )}
          </div>
        </div>

        {topic && <TopicJustification justification={topic.justification} showEmpty />}

        {/* Mensagens */}
        {success && (
          <div role="status" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--tertiary-container)',
            color: 'var(--on-tertiary-container)',
            borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)',
            fontFamily: 'var(--font-family)', border: '1px solid var(--outline-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--error-container)', color: 'var(--on-error-container)',
            borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)',
            fontFamily: 'var(--font-family)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
            {error}
          </div>
        )}

        {evaluationDone && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--outline-variant)', fontSize: 'var(--body-md)',
            color: 'var(--on-surface-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>task_alt</span>
            <div>
              <strong style={{ fontSize: 'var(--body-lg)', color: 'var(--on-surface)' }}>Processo de avaliação concluído</strong>
              <p style={{ marginTop: '4px' }}>{evaluationStatusMessage}</p>
            </div>
          </div>
        )}

        {/* Comentários */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)', opacity: evaluationDone ? 0.8 : 1 }}>
          <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chat</span>
            Comentários ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--outline-variant)', fontSize: 'var(--body-md)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>forum</span>
              Nenhum comentário ainda.{!evaluationDone && ' Inicie a discussão abaixo.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '400px', overflow: 'auto' }}>
              {comments.map((comment: TopicReviewComment) => (
                <div key={comment.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', fontWeight: 'var(--font-medium)', background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {comment.user?.name || 'Anônimo'}
                    </span>
                    <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                      {new Date(comment.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {!evaluationDone && (
          <form onSubmit={addComment} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)' }}>
            <label htmlFor="comment" style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)', fontFamily: 'var(--font-family)' }}>
              Adicionar comentário
            </label>
            <textarea id="comment" value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="Escreva o seu comentário técnico-científico..." minLength={3} required rows={4}
              style={{ width: '100%', padding: '12px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical', transition: 'all 0.2s ease', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--outline-variant)'; e.target.style.boxShadow = 'none' }}
            />
            <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '10px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer', opacity: submitting || !newComment.trim() ? 0.6 : 1, transition: 'all 0.2s ease', width: 'fit-content' }}>
              {submitting ? (
                <><span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} /> A enviar...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span> Comentar</>
              )}
            </button>
          </form>
        )}

        {!evaluationDone && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)', border: decision ? `2px solid var(--${decision === 'approved' ? 'primary' : 'error'})` : '1px solid var(--outline-variant)' }}>
            <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>gavel</span>
              Decisão final
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: decision === 'approved' ? 'var(--primary-container)' : 'var(--surface-container-low)', color: decision === 'approved' ? 'var(--on-primary-container)' : 'var(--on-surface-variant)', border: decision === 'approved' ? '2px solid var(--primary)' : '1px solid var(--outline-variant)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', fontFamily: 'var(--font-family)', transition: 'all 0.2s' }}>
                <input type="radio" name="decision" checked={decision === 'approved'} onChange={() => setDecision('approved')} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>check_circle</span>
                Aprovado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: decision === 'rejected' ? 'var(--error-container)' : 'var(--surface-container-low)', color: decision === 'rejected' ? 'var(--on-error-container)' : 'var(--on-surface-variant)', border: decision === 'rejected' ? '2px solid var(--error)' : '1px solid var(--outline-variant)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', fontFamily: 'var(--font-family)', transition: 'all 0.2s' }}>
                <input type="radio" name="decision" checked={decision === 'rejected'} onChange={() => setDecision('rejected')} style={{ accentColor: 'var(--error)', cursor: 'pointer' }} />
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--error)' }}>cancel</span>
                Não Aprovado
              </label>
            </div>
            <button onClick={submitDecision} disabled={!decision || submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '14px var(--space-4)', fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-family)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: !decision || submitting ? 'not-allowed' : 'pointer', opacity: !decision || submitting ? 0.6 : 1, transition: 'all 0.2s ease', width: '100%', boxShadow: 'var(--elevation-1)', background: decision === 'approved' ? 'var(--primary)' : decision === 'rejected' ? 'var(--error)' : 'var(--outline)', color: 'var(--on-primary)' }}>
              {submitting ? (
                <><span style={{ width: '18px', height: '18px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} /> A processar...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>gavel</span> Confirmar decisão</>
              )}
            </button>
          </div>
        )}

        {evaluationDone && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
            <Link to="/reviews" className="btn" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '12px var(--space-4)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', background: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', transition: 'all 0.2s ease' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
              Voltar para lista de temas
            </Link>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // PROTOCOL EVALUATION RENDER
  // ═══════════════════════════════════════════════
  if (isProtocol && protocol) {
    return (
      <div className="evaluation-protocol-page">
        {/* Cabeçalho */}
        <header className="evaluation-protocol-header">
          <div>
            <div className="evaluation-title-row">
              <Link to="/reviews" className="evaluation-back" aria-label="Voltar para revisões">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
              </Link>
              <h1 className="evaluation-protocol-code">{protocol.code}</h1>
              <span className="evaluation-organ-badge">{organLabel(evaluationForm?.organ)}</span>
            </div>
            <div className="evaluation-status-line">
              <span className={`protocol-state-chip ${formConcluded ? 'is-complete' : ''} ${formConcluded && finalProtocolDecision === 'rejected' ? 'is-rejected' : ''}`}>
                {protocolEvaluationState}
              </span>
              <span><span className="status-dot" /> {protocol.status_label || protocol.version}</span>
            </div>
          </div>

          {/* Documento */}
          {protocol.latest_document && (
            <div className="evaluation-document-actions">
              <button
                type="button"
                onClick={() => openFile(protocol.latest_document?.download_url, protocol.latest_document?.file_name)}
                className="evaluation-document-button is-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
                Ver protocolo
              </button>
              {protocol.latest_document.download_url && (
                <button
                  type="button"
                  onClick={() => downloadFile(protocol.latest_document?.download_url, protocol.latest_document?.file_name)}
                  className="evaluation-document-button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
                  Baixar
                </button>
              )}
              {evaluationForm && (
                <button
                  type="button"
                  onClick={() => downloadFile(`/api/v1/evaluation-forms/${evaluationForm.id}/download`, `ficha-${protocol.code}.pdf`)}
                  className="evaluation-document-button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment</span>
                  Ficha de Avaliação
                </button>
              )}
            </div>
          )}
        </header>

        {/* Mensagens */}
        {success && (
          <div role="status" className="evaluation-notice is-submitted">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
            <div>
              <strong>{myEvaluationSubmitted ? 'Avaliação submetida' : 'Avaliação actualizada'}</strong>
              <div>{success}</div>
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="evaluation-notice is-error">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
            {error}
          </div>
        )}

        {/* Estado concluído */}
        {formConcluded && (
          <section className={`evaluation-outcome ${finalProtocolDecision === 'approved' ? 'is-approved' : ''}`}>
            <div className="evaluation-outcome-main">
              <span className="material-symbols-outlined evaluation-outcome-icon">
                {finalProtocolDecision === 'approved' ? 'check_circle' : finalProtocolDecision === 'rejected' ? 'cancel' : 'task_alt'}
              </span>
              <div>
                <h2>
                  {finalProtocolDecision === 'approved' ? 'Protocolo Aprovado' : finalProtocolDecision === 'rejected' ? 'Protocolo Reprovado' : 'Avaliação concluída'}
                </h2>
                <p>
                  {evaluationForm?.conclusion_summary || (finalProtocolDecision === 'approved'
                    ? 'Este protocolo foi aprovado e será encaminhado ao próximo órgão.'
                    : finalProtocolDecision === 'rejected'
                      ? 'Este protocolo foi reprovado pelo órgão científico.'
                      : 'O processo de revisão está concluído.')}
                </p>
              </div>
            </div>
            {(opinionResult?.download_url || opinionResult?.document_url) && (
              <div className="evaluation-outcome-actions">
                <button
                  type="button"
                  onClick={() => downloadFile(opinionResult.download_url || opinionResult.document_url, `parecer-${protocol.code}.pdf`)}
                  className="evaluation-outcome-button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
                  Baixar Parecer (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => openFile(opinionResult.download_url || opinionResult.document_url, `parecer-${protocol.code}.pdf`)}
                  className="evaluation-outcome-button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                  Abrir Parecer
                </button>
                {opinionResult.evaluation_form_download_url && (
                  <button
                    type="button"
                    onClick={() => downloadFile(opinionResult.evaluation_form_download_url, `ficha-${protocol.code}.pdf`)}
                    className="evaluation-outcome-button"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment</span>
                    Baixar Ficha
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {evaluationForm && (
          <section className="evaluation-panel reviewer-summary">
            <h2 className="evaluation-panel-title">
              <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>group</span>
              Estado dos Revisores
            </h2>
            <div className="reviewer-chips">
              {reviewerEvaluations.map((reviewerEvaluation, index) => {
                const isCurrentReviewer = currentUserId !== null && reviewerEvaluation.reviewer?.user?.id === currentUserId
                const submitted = reviewerEvaluation.status === 'submitted'
                const reviewerName = reviewerEvaluation.reviewer?.user?.name || `Revisor #${index + 1}`

                return (
                  <span key={reviewerEvaluation.id} className={`reviewer-chip ${submitted ? 'is-submitted' : ''}`}>
                    {reviewerName}{isCurrentReviewer ? ' (você)' : ''}: {submitted ? 'Submetido' : 'Pendente'}
                  </span>
                )
              })}
            </div>
          </section>
        )}

        {/* Critérios de avaliação */}
        {evaluationForm && (
          <section className="evaluation-panel evaluation-criteria-panel">
            {Object.entries(groupedCriteria).map(([groupName, criteria]) => (
              <section key={groupName} className="criteria-group">
                <h2 className="criteria-group-heading">
                  <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>checklist</span>
                  {groupName}
                </h2>
                {criteria.map(criterion => (
                  <div key={criterion.id} className="criterion-field">
                    <label htmlFor={`criterion-${criterion.id}`}>{criterion.criterion_name}</label>
                    <textarea
                      id={`criterion-${criterion.id}`}
                      value={criterionReviews[criterion.id] || ''}
                      onChange={e => setCriterionReviews(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                      onBlur={() => handleSaveCriterionReview(criterion.id)}
                      placeholder="Escreva o seu comentário..."
                      rows={3}
                      disabled={myEvaluationSubmitted || formConcluded}
                    />
                  </div>
                ))}
              </section>
            ))}
          </section>
        )}

        {/* Recomendação e submissão */}
        {evaluationForm && !formConcluded && !myEvaluationSubmitted && (
          <section className="evaluation-panel evaluation-panel--recommendation">
            <h2 className="evaluation-panel-title">
              <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>rate_review</span>
              Conclusão da avaliação
            </h2>
            <div>
              <label className="evaluation-field-label" htmlFor="overall-comment">Resumo / Conclusão</label>
              <textarea
                id="overall-comment"
                className="evaluation-textarea"
                value={overallComment}
                onChange={e => setOverallComment(e.target.value)}
                placeholder="Resumo da sua avaliação (opcional)..."
                rows={3}
              />
            </div>
            <div className="recommendation-options">
              <label className={`recommendation-choice ${recommendation === 'approved' ? 'is-selected-approved' : ''}`}>
                <input type="radio" name="recommendation" checked={recommendation === 'approved'} onChange={() => setRecommendation('approved')} />
                <span className="material-symbols-outlined is-approved">check_circle</span>
                Aprovar protocolo
              </label>
              <label className={`recommendation-choice ${recommendation === 'rejected' ? 'is-selected-rejected' : ''}`}>
                <input type="radio" name="recommendation" checked={recommendation === 'rejected'} onChange={() => setRecommendation('rejected')} />
                <span className="material-symbols-outlined is-rejected">cancel</span>
                Reprovar protocolo
              </label>
            </div>
            <button className="evaluation-submit-button" onClick={handleSubmitEvaluation} disabled={!recommendation || submitting}>
              {submitting ? (
                <><span className="material-symbols-outlined">progress_activity</span> A submeter...</>
              ) : (
                <><span className="material-symbols-outlined">send</span> Submeter avaliação</>
              )}
            </button>
          </section>
        )}

        {/* Decisão final (só depois de TODOS os revisores submeterem) */}
        {evaluationForm && !formConcluded && allReviewersSubmitted && (
          <section className="evaluation-panel evaluation-panel--decision">
            <h2 className="evaluation-panel-title">
              <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>gavel</span>
              Decisão final
            </h2>
            <p>Todos os revisores submeteram a sua avaliação. Pode agora tomar a decisão final.</p>
            <div>
              <label className="evaluation-field-label" htmlFor="conclusion-summary">Resumo / Conclusão</label>
              <textarea
                id="conclusion-summary"
                className="evaluation-textarea"
                value={conclusionSummary}
                onChange={e => setConclusionSummary(e.target.value)}
                placeholder="Resumo da conclusão da avaliação..."
                rows={3}
              />
            </div>
            <div className="final-decision-options">
              <label className={`final-decision-choice ${finalDecision === 'approved' ? 'is-selected-approved' : ''}`}>
                <input type="radio" name="final-decision" checked={finalDecision === 'approved'} onChange={() => setFinalDecision('approved')} />
                <span className="material-symbols-outlined is-approved">check_circle</span>
                Aprovar protocolo
              </label>
              <label className={`final-decision-choice ${finalDecision === 'rejected' ? 'is-selected-rejected' : ''}`}>
                <input type="radio" name="final-decision" checked={finalDecision === 'rejected'} onChange={() => setFinalDecision('rejected')} />
                <span className="material-symbols-outlined is-rejected">cancel</span>
                Reprovar protocolo
              </label>
            </div>
            <button className="final-confirm-button" onClick={handleDecide} disabled={!finalDecision || submitting}>
              <span className="material-symbols-outlined">gavel</span>
              {submitting ? 'A confirmar decisão...' : 'Confirmar decisão final'}
            </button>
          </section>
        )}

        {formConcluded && (
          <Link to="/reviews" className="back-to-reviews">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
              Voltar para lista de revisões
          </Link>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Estado vazio (sem dados)
  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-surface-variant)', textAlign: 'center', padding: 'var(--space-6)' }}>
      <p>Nenhum dado encontrado.</p>
      <Link to="/reviews" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'var(--font-semibold)' }}>
        Voltar para revisões
      </Link>
    </div>
  )
}
