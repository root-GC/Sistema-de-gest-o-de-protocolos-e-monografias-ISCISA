import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RequiredDocumentsReviewPanel } from '../../components/protocol/RequiredDocumentsReviewPanel'
import { useAuth, type SecretaryProfile } from '../../context/AuthContext'
import { protocolService, type Protocol, type ProtocolHistory } from '../../services/protocolService'
import { topicService, type Topic, type TopicHistory } from '../../services/topicService'
import './secretary/secretaryWorkspace.css'

type TriageType = 'topics' | 'protocols'
type QueueStatus = 'all' | 'pending' | 'reviewing' | 'complete'
type HistoryEntry = ProtocolHistory | TopicHistory

interface AssignmentSummary {
  id: string
  reviewerName: string
  reviewerEmail?: string | null
  assignedAt?: string | null
  statusLabel: string
  decisionLabel?: string | null
  evaluatedAt?: string | null
  roleLabel?: string | null
  evaluationStatus?: string | null
  evaluationDecision?: string | null
}

interface QueueItem {
  id: number
  kind: TriageType
  code: string
  title: string
  status: string
  statusLabel: string
  submittedAt?: string | null
  context?: string | null
  history?: HistoryEntry[]
  assignments?: AssignmentSummary[]
  canAssign?: boolean
  finalDecision?: string | null
  decidedAt?: string | null
}

interface Reviewer {
  id: number
  name: string
  email?: string | null
  area?: string | null
  workload?: number | null
}

const typeConfig: Record<TriageType, { label: string; icon: string; empty: string }> = {
  topics: { label: 'Temas', icon: 'lightbulb', empty: 'Não há temas nesta fila.' },
  protocols: { label: 'Protocolos', icon: 'description', empty: 'Não há protocolos nesta fila.' },
}

const statusConfig: Record<QueueStatus, string> = {
  all: 'Todos',
  pending: 'Para atribuir',
  reviewing: 'Em revisão',
  complete: 'Concluídos',
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem data de submissão'
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function queueStatus(status: string): QueueStatus {
  if (status.includes('pending') || status.includes('documents_pending') || status === 'protocol_submitted') return 'pending'
  if (status.includes('review') || status.includes('assigned')) return 'reviewing'
  return 'complete'
}

function organLabel(organType?: string) {
  switch (organType) {
    case 'scientific_committee': return 'Comité Científico'
    case 'bioethics_committee': return 'Comité de Bioética'
    case 'nucleus': return 'Núcleo Científico'
    default: return 'Órgão da Secretaria'
  }
}

function decisionLabel(decision?: string | null) {
  switch (decision) {
    case 'approved':
      return 'Aprovado'
    case 'rejected':
    case 'not_approved':
      return 'Não aprovado'
    default:
      return null
  }
}

function assignmentStatusLabel(status?: string | null) {
  if (status === 'completed' || status === 'done') return 'Concluído'
  if (status === 'cancelled' || status === 'canceled') return 'Cancelado'
  return 'Em revisão'
}

function reviewerEvaluationLabel(status?: string | null, decision?: string | null) {
  if (status === 'submitted') return decisionLabel(decision) ? `Avaliado · ${decisionLabel(decision)}` : 'Avaliado'
  if (status === 'in_progress') return 'Em avaliação'
  return 'Pendente'
}

function durationLabel(start?: string | null, end?: string | null) {
  if (!start) return 'Tempo não registado'
  const startedAt = new Date(start).getTime()
  const finishedAt = end ? new Date(end).getTime() : Date.now()
  if (Number.isNaN(startedAt) || Number.isNaN(finishedAt)) return 'Tempo não registado'
  const days = Math.max(0, Math.ceil((finishedAt - startedAt) / 86_400_000))
  return `${days} dia${days === 1 ? '' : 's'}`
}

function mapTopicAssignments(assignments?: Topic['review_assignments']): AssignmentSummary[] {
  return assignments?.map(assignment => ({
    id: String(assignment.id),
    reviewerName: assignment.reviewer?.name || 'Revisor sem nome',
    reviewerEmail: assignment.reviewer?.email,
    assignedAt: assignment.assigned_at ?? null,
    statusLabel: assignment.evaluation?.decision ? 'Concluído' : 'Em revisão',
    decisionLabel: decisionLabel(assignment.evaluation?.decision),
    evaluatedAt: assignment.evaluation?.evaluated_at ?? null,
  })) ?? []
}

function mapProtocolAssignments(assignments?: Protocol['review_assignments'], evaluationReviewers?: Protocol['committee_evaluation'] extends infer T ? T extends { reviewers: infer R } ? R : never : never): AssignmentSummary[] {
  return assignments?.flatMap(assignment => {
    const common = {
      assignedAt: assignment.assigned_at ?? null,
      statusLabel: assignmentStatusLabel(assignment.status),
    }

    const reviewerEvaluation = (reviewerId?: number | null) => evaluationReviewers?.find(evaluation => evaluation.reviewer_id === reviewerId)

    return [
      assignment.reviewer_one ? {
        id: `${assignment.id}-one`,
        reviewerName: assignment.reviewer_one.name || assignment.reviewer_one.user?.name || 'Revisor sem nome',
        reviewerEmail: assignment.reviewer_one.email || assignment.reviewer_one.user?.email,
        roleLabel: assignment.is_primary ? 'Principal' : 'Revisor',
        evaluationStatus: reviewerEvaluation(assignment.reviewer_one.id)?.status,
        evaluationDecision: reviewerEvaluation(assignment.reviewer_one.id)?.decision,
        decisionLabel: decisionLabel(reviewerEvaluation(assignment.reviewer_one.id)?.decision),
        evaluatedAt: reviewerEvaluation(assignment.reviewer_one.id)?.submitted_at,
        ...common,
      } : null,
      assignment.reviewer_two ? {
        id: `${assignment.id}-two`,
        reviewerName: assignment.reviewer_two.name || assignment.reviewer_two.user?.name || 'Revisor sem nome',
        reviewerEmail: assignment.reviewer_two.email || assignment.reviewer_two.user?.email,
        roleLabel: 'Revisor',
        evaluationStatus: reviewerEvaluation(assignment.reviewer_two.id)?.status,
        evaluationDecision: reviewerEvaluation(assignment.reviewer_two.id)?.decision,
        decisionLabel: decisionLabel(reviewerEvaluation(assignment.reviewer_two.id)?.decision),
        evaluatedAt: reviewerEvaluation(assignment.reviewer_two.id)?.submitted_at,
        ...common,
      } : null,
    ].filter(Boolean) as AssignmentSummary[]
  }) ?? []
}

function phaseForSubmission(item: QueueItem, protocol?: Protocol | null) {
  const evaluation = protocol?.committee_evaluation
  const finalDecision = evaluation?.final_decision || protocol?.organ_tracking?.latest_opinion?.decision
  const completedAt = evaluation?.decided_at || protocol?.organ_tracking?.latest_opinion?.issued_at

  if (finalDecision) return { label: 'Concluído', text: `${decisionLabel(finalDecision) || 'Decisão registada'} em ${formatDate(completedAt)}.`, tone: 'complete' }
  if (evaluation?.status === 'deliberated') return { label: 'Deliberado', text: 'Aguardando a submissão da decisão final pelos revisores.', tone: 'reviewing' }
  if (item.canAssign) return { label: 'Atribuição de revisores', text: 'Seleciona os revisores elegíveis para iniciar a avaliação.', tone: 'pending' }
  if (item.assignments?.length) return { label: 'Em avaliação', text: 'Acompanha o estado individual e o tempo de cada revisor.', tone: 'reviewing' }
  return { label: item.statusLabel, text: 'A submissão aguarda o próximo passo neste órgão.', tone: queueStatus(item.status) }
}

export default function SecretaryProtocolsPage() {
  const { activeProfile } = useAuth()
  const secretary = activeProfile as SecretaryProfile | null
  const organType = secretary?.organ?.type
  const [searchParams, setSearchParams] = useSearchParams()
  const [topics, setTopics] = useState<Topic[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loadingReviewers, setLoadingReviewers] = useState(false)
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<number[]>([])
  const [primaryReviewerId, setPrimaryReviewerId] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [reviewingRequirementId, setReviewingRequirementId] = useState<number | null>(null)
  const [requirementRejectionReasons, setRequirementRejectionReasons] = useState<Record<number, string>>({})
  const [historyModalItem, setHistoryModalItem] = useState<QueueItem | null>(null)

  const availableTypes = useMemo<TriageType[]>(
    () => organType === 'nucleus' ? ['topics'] : ['protocols'],
    [organType],
  )
  const requestedType = searchParams.get('type') as TriageType | null
  const activeType = requestedType && availableTypes.includes(requestedType) ? requestedType : availableTypes[0]
  const requestedStatus = searchParams.get('status') as QueueStatus | null
  const activeStatus = requestedStatus && Object.hasOwn(statusConfig, requestedStatus) ? requestedStatus : 'all'
  const selectedId = Number(searchParams.get('item')) || null

  const updateSearch = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const protocolApi = useMemo(() => {
    if (organType === 'scientific_committee') {
      return { list: protocolService.listForSecretaryCC, reviewers: protocolService.getEligibleReviewersCC }
    }
    if (organType === 'bioethics_committee') {
      return { list: protocolService.listForSecretaryBioetica, reviewers: protocolService.getEligibleReviewersBioetica }
    }
    return {
      list: () => Promise.reject(new Error('O Núcleo Científico não trata protocolos.')),
      reviewers: () => Promise.reject(new Error('O Núcleo Científico não atribui revisores a protocolos.')),
    }
  }, [organType])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (organType === 'nucleus') {
        const topicResponse = await topicService.listForSecretary()
        setTopics(topicResponse.topics)
        setProtocols([])
        return
      }

      const protocolResponse = await protocolApi.list()
      setProtocols(protocolResponse.protocols)
      setTopics([])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar a fila. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }, [organType, protocolApi])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])

  useEffect(() => {
    if (!requestedType || !availableTypes.includes(requestedType)) updateSearch({ type: availableTypes[0], item: null })
  }, [availableTypes, requestedType, updateSearch])

  const items = useMemo<QueueItem[]>(() => {
    if (activeType === 'topics') {
      return topics.map(topic => ({
        id: topic.id,
        kind: 'topics',
        code: topic.course?.code ?? `Tema #${topic.id}`,
        title: topic.title,
        status: topic.status,
        statusLabel: topic.status_label || topic.status,
        submittedAt: topic.submitted_at,
        context: topic.scientific_area?.name ?? topic.course?.name,
        history: topic.histories ?? [],
        assignments: mapTopicAssignments(topic.review_assignments),
        canAssign: topic.status === 'topic_pending_nucleo',
      }))
    }
    return protocols.map(protocol => {
      const canAssignProtocol = !protocol.read_only_for_organ && (
        (organType === 'scientific_committee' && protocol.status === 'protocol_pending_comite_cientifico') ||
        (organType === 'bioethics_committee' && protocol.status === 'protocol_pending_comite_bioetica')
      )

      return {
        id: protocol.id,
        kind: 'protocols',
        code: protocol.code || `Protocolo #${protocol.id}`,
        title: protocol.topic?.title || 'Protocolo sem tema associado',
        status: protocol.status,
        statusLabel: protocol.organ_tracking?.status_label || protocol.status_label || protocol.status,
        submittedAt: protocol.submitted_at,
        context: protocol.student?.name ?? protocol.organ_tracking?.organ_name ?? null,
        history: protocol.organ_tracking?.history ?? protocol.histories ?? [],
        assignments: mapProtocolAssignments(protocol.review_assignments, protocol.committee_evaluation?.reviewers),
        canAssign: canAssignProtocol,
        finalDecision: protocol.committee_evaluation?.final_decision ?? protocol.organ_tracking?.latest_opinion?.decision ?? null,
        decidedAt: protocol.committee_evaluation?.decided_at ?? protocol.organ_tracking?.latest_opinion?.issued_at ?? null,
      }
    })
  }, [activeType, organType, protocols, topics])

  const visibleItems = useMemo(() => {
    if (activeStatus === 'all') return items

    if (activeStatus === 'complete') {
      return items.filter(item => item.kind === 'protocols'
        ? item.finalDecision === 'approved'
        : item.assignments?.some(assignment => assignment.decisionLabel === 'Aprovado'))
    }

    return items.filter(item => queueStatus(item.status) === activeStatus)
  }, [activeStatus, items])
  const selectedItem = items.find(item => item.id === selectedId) ?? null
  const isBioethics = organType === 'bioethics_committee'
  const selectedProtocol = selectedItem?.kind === 'protocols'
    ? protocols.find(protocol => protocol.id === selectedItem.id) ?? null
    : null
  const documentOrgan = isBioethics ? 'comite_bioetica' : 'comite_cientifico'
  const documentValidationStatus = isBioethics ? 'protocol_documents_pending_cibs' : 'protocol_documents_pending_cc'
  const isDocumentValidation = selectedProtocol?.status === documentValidationStatus && !selectedProtocol.read_only_for_organ
  const selectedPhase = selectedItem ? phaseForSubmission(selectedItem, selectedProtocol) : null

  const loadReviewers = useCallback(async (item: QueueItem) => {
    setLoadingReviewers(true)
    setReviewers([])
    setSelectedReviewerIds([])
    setPrimaryReviewerId(null)
    try {
      if (item.kind === 'topics') {
        const response = await topicService.eligibleReviewers(item.id)
        setReviewers(response.reviewers.map(reviewer => ({ id: reviewer.id, name: reviewer.name, email: reviewer.email, workload: reviewer.pending_reviews_count })))
      } else {
        const response = await protocolApi.reviewers(item.id)
        setReviewers(response.reviewers.map(reviewer => ({ id: reviewer.id, name: reviewer.name, email: reviewer.email, area: reviewer.scientific_area_name, workload: reviewer.active_works })))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os revisores elegíveis.')
    } finally {
      setLoadingReviewers(false)
    }
  }, [protocolApi])

  function setRequirementRejectReason(requirementId: number, reason: string) {
    setRequirementRejectionReasons(current => ({ ...current, [requirementId]: reason }))
  }

  async function downloadRequirement(url: string | null | undefined, fallbackFilename?: string | null) {
    if (!url) return
    try {
      await protocolService.downloadFile(url, fallbackFilename || undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível baixar o anexo.')
    }
  }

  async function approveRequirement(protocolId: number, requirementId: number) {
    setReviewingRequirementId(requirementId)
    setError(null)
    setSuccess(null)
    try {
      await protocolService.approveRequiredDocument(protocolId, requirementId)
      setSuccess('Documento aprovado com sucesso.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível aprovar o documento.')
    } finally {
      setReviewingRequirementId(null)
    }
  }

  async function rejectRequirement(protocolId: number, requirementId: number) {
    const reason = (requirementRejectionReasons[requirementId] ?? '').trim()
    if (!reason) {
      setError('Informe o motivo da não aprovação do anexo.')
      return
    }

    setReviewingRequirementId(requirementId)
    setError(null)
    setSuccess(null)
    try {
      await protocolService.rejectRequiredDocument(protocolId, requirementId, reason)
      setRequirementRejectionReasons(current => {
        const next = { ...current }
        delete next[requirementId]
        return next
      })
      setSuccess('Documento marcado como não aprovado.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível rejeitar o documento.')
    } finally {
      setReviewingRequirementId(null)
    }
  }

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      if (selectedItem?.canAssign) void loadReviewers(selectedItem)
      else {
        setReviewers([])
        setSelectedReviewerIds([])
        setPrimaryReviewerId(null)
      }
    }, 0)
    return () => window.clearTimeout(requestId)
  }, [selectedItem, loadReviewers])

  function toggleReviewer(reviewerId: number) {
    if (!selectedItem) return
    if (selectedItem.kind === 'topics' || isBioethics) {
      setSelectedReviewerIds(current => current.includes(reviewerId) ? current.filter(id => id !== reviewerId) : [...current, reviewerId])
      return
    }
    setSelectedReviewerIds(current => {
      if (current.includes(reviewerId)) return current.filter(id => id !== reviewerId)
      return current.length === 2 ? current : [...current, reviewerId]
    })
  }

  async function assignReviewers() {
    if (!selectedItem) return
    if (!selectedItem.canAssign) return setError('Esta submissão já não está em atribuição neste órgão.')
    const requiresTwo = selectedItem.kind === 'protocols'
    if (selectedItem.kind === 'topics' && selectedReviewerIds.length === 0) return setError('Seleciona pelo menos um revisor para o tema.')
    if (selectedItem.kind === 'protocols' && isBioethics && !primaryReviewerId) return setError('Seleciona o revisor principal do Comité de Bioética.')
    if (requiresTwo && !isBioethics && selectedReviewerIds.length !== 2) return setError('Seleciona dois revisores diferentes antes de atribuir.')

    setAssigning(true)
    setError(null)
    try {
      if (selectedItem.kind === 'topics') await topicService.assignReviewers(selectedItem.id, selectedReviewerIds)
      else if (isBioethics) await protocolService.assignReviewersBioetica(selectedItem.id, primaryReviewerId as number, selectedReviewerIds.filter(id => id !== primaryReviewerId))
      else if (organType === 'scientific_committee') await protocolService.assignReviewersCC(selectedItem.id, selectedReviewerIds[0], selectedReviewerIds[1])
      else return setError('Este órgão não atribui revisores a protocolos.')
      setSuccess('Revisores atribuídos com sucesso.')
      updateSearch({ item: null })
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível atribuir os revisores.')
    } finally {
      setAssigning(false)
    }
  }

  const assignmentHint = !selectedItem ? '' : !selectedItem.canAssign
    ? 'Esta submissão encontra-se no histórico do órgão e não pode receber nova atribuição.'
    : selectedItem.kind === 'topics'
    ? 'Seleciona um ou mais revisores elegíveis.'
    : isBioethics ? 'Escolhe um revisor principal. Os restantes participantes são opcionais.' : 'Seleciona exatamente dois revisores elegíveis.'
  const selectedAssignmentDate = selectedItem?.assignments?.find(assignment => assignment.assignedAt)?.assignedAt ?? null

  return (
    <main className="secretary-workspace" aria-labelledby="secretary-triage-title">
      <header className="secretary-page-header">
        <div>
          <p className="secretary-page-header__eyebrow">{selectedItem ? selectedItem.code : 'Secretaria'}</p>
          <h1 id="secretary-triage-title" className="secretary-page-header__title">{selectedItem ? selectedItem.title : 'Gestão de Submissões'}</h1>
          <p className="secretary-page-header__description">
            {selectedItem
              ? isDocumentValidation
                ? 'Valida os documentos submetidos antes de encaminhar o protocolo para revisão.'
                : 'Consulta o estado, histórico e revisores desta submissão.'
              : 'Organiza a fila e atribui revisores ao teu órgão.'}
          </p>
          <span className="secretary-organ-badge"><span className="material-symbols-outlined" aria-hidden="true">account_balance</span>{organLabel(organType)}</span>
        </div>
        {selectedItem ? (
          <button type="button" className="btn btn-outline" onClick={() => updateSearch({ item: null })}>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Voltar às Submissões
          </button>
        ) : (
          <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}><span className="material-symbols-outlined" aria-hidden="true">refresh</span>Atualizar Fila</button>
        )}
      </header>

      {error && <div className="secretary-alert secretary-alert--error" role="alert" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">error</span><span>{error}</span></div>}
      {success && <div className="secretary-alert secretary-alert--success" role="status" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>{success}</span></div>}

      {!selectedItem && (
        <>
          <div className="secretary-tabs" role="tablist" aria-label="Tipo de submissão">
            {availableTypes.map(type => <button key={type} type="button" className="secretary-tab" role="tab" aria-selected={activeType === type} onClick={() => updateSearch({ type, status: 'all', item: null })}><span className="material-symbols-outlined" aria-hidden="true">{typeConfig[type].icon}</span>{typeConfig[type].label}<span className="secretary-count-badge">{type === 'topics' ? topics.length : protocols.length}</span></button>)}
          </div>

          <div className="secretary-filter-bar">
            <div className="secretary-filter-group" aria-label="Filtrar fila">
              {(Object.keys(statusConfig) as QueueStatus[]).map(status => <button key={status} type="button" className="secretary-filter" aria-pressed={activeStatus === status} onClick={() => updateSearch({ status, item: null })}>{statusConfig[status]}</button>)}
            </div>
            <span className="secretary-count-badge">{visibleItems.length} na lista</span>
          </div>
        </>
      )}

      {loading ? <div className="secretary-loading"><span className="secretary-spinner" aria-hidden="true" />A carregar fila…</div> : (
        <div className={`secretary-workbench${selectedItem ? ' secretary-workbench--detail' : ' secretary-workbench--list'}`}>
          <section className="secretary-queue" aria-label="Fila de submissões">
            {visibleItems.length === 0 ? <div className="secretary-empty-state"><span className="material-symbols-outlined" aria-hidden="true">inbox</span><strong>{typeConfig[activeType].empty}</strong><span>A fila será atualizada quando houver novas submissões.</span></div> : visibleItems.map(item => {
              const itemStatus = queueStatus(item.status)
              return <button key={item.id} type="button" className="secretary-row" aria-pressed={selectedItem?.id === item.id} onClick={() => updateSearch({ item: String(item.id) })}>
                <span className="secretary-row__content"><span className="secretary-row__eyebrow">{item.code}</span><span className="secretary-row__title">{item.title}</span><span className="secretary-row__meta"><span>{item.context || 'Submissão do órgão'}</span><span aria-hidden="true">•</span><span>{formatDate(item.submittedAt)}</span></span></span>
                <span className={`secretary-status-badge secretary-status-badge--${itemStatus}`}>{item.statusLabel}</span>
              </button>
            })}
          </section>

          <aside className={`secretary-panel${selectedItem ? ' secretary-panel--detail' : ''}`} aria-label="Detalhe e atribuição">
            {!selectedItem ? (
              <div className="secretary-empty-panel">
                <span className="material-symbols-outlined" aria-hidden="true">touch_app</span>
                <strong>Seleciona uma submissão</strong>
                <span>Os detalhes e revisores aparecem aqui.</span>
              </div>
            ) : (
              <>
                <div className="secretary-panel__header">
                  <div className="secretary-panel__summary">
                    <p className="secretary-panel__eyebrow">{selectedItem.code}</p>
                    <h2 className="secretary-panel__title">{selectedItem.title}</h2>
                  </div>
                  <button type="button" className="btn btn-icon" aria-label="Voltar às submissões" onClick={() => updateSearch({ item: null })}>
                    <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                  </button>
                </div>
                <div className="secretary-panel__body">
                  <div>
                    <span className={`secretary-status-badge secretary-status-badge--${queueStatus(selectedItem.status)}`}>{selectedItem.statusLabel}</span>
                    <p className="secretary-helper-text" style={{ marginTop: '8px' }}>{selectedItem.context || 'Submissão associada ao teu órgão'} · {formatDate(selectedItem.submittedAt)}</p>
                  </div>

                  {selectedProtocol && selectedPhase && (
                    <section className="secretary-process-phase" aria-label="Fase actual do protocolo">
                      <span className={`secretary-status-badge secretary-status-badge--${selectedPhase.tone}`}>{selectedPhase.label}</span>
                      <p>{selectedPhase.text}</p>
                    </section>
                  )}

                  {selectedProtocol && (
                    <section className="secretary-submission-description" aria-labelledby="protocol-description-title">
                      <span id="protocol-description-title" className="secretary-field-label">Descrição</span>
                      <p>{selectedProtocol.justification || selectedProtocol.topic?.justification || 'Sem descrição registada para este protocolo.'}</p>
                    </section>
                  )}

                  {selectedProtocol && isDocumentValidation && (
                    <div className="secretary-document-review">
                      <RequiredDocumentsReviewPanel
                        protocol={selectedProtocol}
                        reviewingRequirementId={reviewingRequirementId}
                        rejectionReasons={requirementRejectionReasons}
                        onReasonChange={setRequirementRejectReason}
                        onApprove={approveRequirement}
                        onReject={rejectRequirement}
                        onDownload={downloadRequirement}
                        organ={documentOrgan}
                      />
                    </div>
                  )}

                  <div className="secretary-history" aria-label="Histórico deste órgão">
                    <span className="secretary-field-label">Histórico deste órgão</span>
                    {selectedItem.history?.length ? (
                      <button type="button" className="secretary-history-summary" onClick={() => setHistoryModalItem(selectedItem)}>
                        <span className="material-symbols-outlined" aria-hidden="true">history</span>
                        <span><strong>Histórico do protocolo</strong><small>{historySummary(selectedItem.history, selectedItem.finalDecision)}</small></span>
                        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                      </button>
                    ) : (
                      <p className="secretary-helper-text">Ainda não há ações registadas neste órgão.</p>
                    )}
                  </div>

                  {selectedItem.assignments && selectedItem.assignments.length > 0 && (
                    <div className="secretary-assignment-summary" aria-label="Revisores atribuídos">
                      <div>
                        <span className="secretary-field-label">{selectedPhase?.label === 'Em avaliação' ? 'Estado das avaliações' : 'Revisores atribuídos'}</span>
                        <p className="secretary-helper-text">
                          {selectedPhase?.label === 'Concluído'
                            ? selectedPhase.text
                            : `Data de atribuição: ${selectedAssignmentDate ? formatDate(selectedAssignmentDate) : 'Sem data registada'}`}
                        </p>
                      </div>
                      <ul className="secretary-assignment-list">
                        {selectedItem.assignments.map(assignment => {
                          const isComplete = assignment.evaluationStatus === 'submitted' || Boolean(assignment.decisionLabel)
                          const visibleStatus = reviewerEvaluationLabel(assignment.evaluationStatus, assignment.evaluationDecision)

                          return (
                            <li key={assignment.id} className="secretary-assignment-list__item">
                              <span className="secretary-assignment-list__main">
                                <strong>{assignment.reviewerName}</strong>
                                <small>{assignment.roleLabel || assignment.reviewerEmail || 'Revisor'} · {durationLabel(assignment.assignedAt, assignment.evaluatedAt)}</small>
                              </span>
                              <span className={`secretary-status-badge secretary-status-badge--${isComplete ? 'complete' : 'reviewing'}`}>
                                {visibleStatus}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {selectedItem.canAssign && (
                    <>
                      <div>
                        <span className="secretary-field-label">Revisores Elegíveis</span>
                        <p className="secretary-helper-text">{assignmentHint}</p>
                      </div>
                      {loadingReviewers ? (
                        <div className="secretary-loading"><span className="secretary-spinner" aria-hidden="true" />A carregar revisores…</div>
                      ) : reviewers.length === 0 ? (
                        <div className="secretary-empty-state">
                          <span className="material-symbols-outlined" aria-hidden="true">group_off</span>
                          <strong>Sem revisores elegíveis</strong>
                          <span>Verifica os membros e as áreas científicas do órgão.</span>
                        </div>
                      ) : (
                        <div className="secretary-reviewer-list">
                          <div className="secretary-reviewer-list__header">
                            <span>{selectedReviewerIds.length + (primaryReviewerId && !selectedReviewerIds.includes(primaryReviewerId) ? 1 : 0)} selecionado(s)</span>
                            <span>{isBioethics && selectedItem.kind === 'protocols' ? 'Principal obrigatório' : selectedItem.kind === 'topics' ? 'Mínimo 1' : 'Exatamente 2'}</span>
                          </div>
                          {reviewers.map(reviewer => {
                            const useRadio = isBioethics && selectedItem.kind === 'protocols'
                            const isChecked = useRadio ? primaryReviewerId === reviewer.id : selectedReviewerIds.includes(reviewer.id)
                            if (useRadio) {
                              return (
                                <div key={reviewer.id} className="secretary-reviewer-option">
                                  <label><input type="radio" name="primary-reviewer" checked={isChecked} onChange={() => setPrimaryReviewerId(reviewer.id)} aria-label={`Definir ${reviewer.name} como revisor principal`} /></label>
                                  <span className="secretary-reviewer-option__name">{reviewer.name}<span className="secretary-reviewer-option__detail">{reviewer.area || reviewer.email || 'Docente do órgão'}</span></span>
                                  <label className="secretary-reviewer-option__participant"><input type="checkbox" name={`participant-${reviewer.id}`} checked={selectedReviewerIds.includes(reviewer.id)} onChange={() => toggleReviewer(reviewer.id)} />Participa</label>
                                </div>
                              )
                            }
                            return (
                              <label key={reviewer.id} className="secretary-reviewer-option">
                                <input type="checkbox" name={`reviewer-${selectedItem.id}`} checked={isChecked} onChange={() => toggleReviewer(reviewer.id)} />
                                <span className="secretary-reviewer-option__name">{reviewer.name}<span className="secretary-reviewer-option__detail">{reviewer.area || reviewer.email || 'Docente do órgão'}</span></span>
                                {reviewer.workload !== undefined && reviewer.workload !== null && <span className="secretary-count-badge">{reviewer.workload} pendente(s)</span>}
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {selectedItem.canAssign && (
                  <div className="secretary-panel__footer">
                    <button type="button" className="btn btn-primary btn-block" disabled={assigning || loadingReviewers || reviewers.length === 0} onClick={() => void assignReviewers()}>
                      <span className="material-symbols-outlined" aria-hidden="true">person_add</span>{assigning ? 'A atribuir revisores…' : 'Atribuir Revisores'}
                    </button>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
      {historyModalItem && <ProtocolHistoryModal item={historyModalItem} onClose={() => setHistoryModalItem(null)} />}
    </main>
  )
}

function historySummary(history: HistoryEntry[], finalDecision?: string | null) {
  const latest = [...history].sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime())[0]
  const result = decisionLabel(finalDecision)
  if (result) return latest ? `${result} · ${formatDate(latest.occurred_at)}` : result
  return latest ? `Atualizado em ${formatDate(latest.occurred_at)}` : 'Sem registos'
}

function meetingVerdict(item: QueueItem) {
  const finalDecision = decisionLabel(item.finalDecision)
  if (finalDecision) return finalDecision

  const history = item.history ?? []
  const result = [...history].reverse().find(entry => entry.action === 'deliberation_meeting_item_closed')
  const value = result?.metadata?.result

  if (value === 'deliberated') return 'Deliberado'
  if (value === 'not_deliberated') return 'Não deliberado'
  return result?.new_status_label || result?.description || 'Sem veredito registado'
}

function meetingDuration(history: HistoryEntry[]) {
  const started = history.find(entry => entry.action === 'deliberation_meeting_started')
  const completed = [...history].reverse().find(entry => entry.action === 'deliberation_meeting_completed')
  if (!started || !completed) return 'Não registado'

  const elapsedMinutes = Math.max(0, Math.round((new Date(completed.occurred_at).getTime() - new Date(started.occurred_at).getTime()) / 60_000))
  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60

  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`
}

function ProtocolHistoryModal({ item, onClose }: { item: QueueItem; onClose: () => void }) {
  const history = item.history ?? []
  const latest = [...history].sort((left, right) => new Date(right.occurred_at).getTime() - new Date(left.occurred_at).getTime())[0]

  return <div className="secretary-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="secretary-modal" role="dialog" aria-modal="true" aria-labelledby="protocol-history-modal-title">
      <header><div><span className="secretary-eyebrow">{item.code}</span><h2 id="protocol-history-modal-title">Histórico do protocolo</h2></div><button type="button" onClick={onClose} aria-label="Fechar"><span className="material-symbols-outlined" aria-hidden="true">close</span></button></header>
      <dl className="secretary-history-summary-details">
        <div><dt>Veredito</dt><dd>{meetingVerdict(item)}</dd></div>
        <div><dt>Data</dt><dd>{item.decidedAt ? formatDate(item.decidedAt) : latest ? formatDate(latest.occurred_at) : 'Não registada'}</dd></div>
        <div><dt>Tempo de reunião</dt><dd>{meetingDuration(history)}</dd></div>
        <div><dt>Revisores</dt><dd>{item.assignments?.length ? item.assignments.map(assignment => `${assignment.reviewerName}${assignment.roleLabel ? ` (${assignment.roleLabel})` : ''}`).join(' · ') : 'Sem revisores atribuídos'}</dd></div>
      </dl>
      <div className="secretary-modal-actions"><button type="button" className="btn btn-primary" onClick={onClose}>Fechar</button></div>
    </section>
  </div>
}
