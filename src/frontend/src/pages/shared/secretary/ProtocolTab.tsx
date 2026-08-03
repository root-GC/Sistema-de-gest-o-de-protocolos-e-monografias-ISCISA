import { useEffect, useState } from 'react'
import { protocolService, type EligibleReviewer, type Protocol } from '../../../services/protocolService'
import { TopicJustificationToggle } from '../../../components/TopicJustification'
import { RequiredDocumentsReviewPanel } from '../../../components/protocol/RequiredDocumentsReviewPanel'
import { useAuth, type SecretaryProfile } from '../../../context/AuthContext'
import '../../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted:           { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor:  { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    protocol_approved_supervisor: { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado (Supervisor)' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Supervisor)' },
    protocol_in_review:           { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_pending_nucleo:      { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    protocol_documents_pending_cc: { bg: 'var(--tertiary-fixed)',    color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Docs Pendentes (CC)' },
    protocol_pending_comite_cientifico: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (CC)' },
    protocol_in_review_comite_cientifico: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (CC)' },
    protocol_pending_comite_bioetica: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Bioética)' },
    protocol_in_review_comite_bioetica: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Bioética)' },
    protocol_approved_nucleo:     { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    protocol_rejected_nucleo:     { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Núcleo)' },
    protocol_rejected_cc:         { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (CC)' },
    protocol_rejected_bioetica:   { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado (Bioética)' },
    protocol_approved_final:      { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado final' },
    protocol_rejected_final:      { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado final' },
    protocol_resubmitted:         { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getOrganEndpoints(organType?: string) {
  switch (organType) {
    case 'scientific_committee':
      return {
        list: protocolService.listForSecretaryCC,
        reviewers: protocolService.getEligibleReviewersCC,
        pendingStatus: 'protocol_pending_comite_cientifico',
      }
    case 'bioethics_committee':
      return {
        list: protocolService.listForSecretaryBioetica,
        reviewers: protocolService.getEligibleReviewersBioetica,
        pendingStatus: 'protocol_pending_comite_bioetica',
      }
    default:
      return {
        list: protocolService.listForSecretary,
        reviewers: protocolService.getEligibleReviewersNucleo,
        pendingStatus: 'protocol_pending_nucleo',
      }
  }
}

// ============================================================
// COMPONENTE
// ============================================================
export function ProtocolsTab() {
  const { activeProfile } = useAuth()
  const secretaryProfile = activeProfile as SecretaryProfile | null
  const organType = secretaryProfile?.organ?.type
  const org = getOrganEndpoints(organType)

  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewersByProtocol, setReviewersByProtocol] = useState<Record<number, EligibleReviewer[]>>({})
  const [pickOne, setPickOne] = useState<Record<number, number | ''>>({})
  const [pickTwo, setPickTwo] = useState<Record<number, number | ''>>({})
  const [bioReviewerIds, setBioReviewerIds] = useState<Record<number, number[]>>({})
  const [bioPrimary, setBioPrimary] = useState<Record<number, number | ''>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [reviewingRequirementId, setReviewingRequirementId] = useState<number | null>(null)
  const [requirementRejectionReasons, setRequirementRejectionReasons] = useState<Record<number, string>>({})

  useEffect(() => { load() }, [organType])

  async function load() {
    setLoading(true)
    try {
      const { protocols } = await org.list()
      setProtocols(protocols)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadReviewers(protocolId: number) {
    try {
      const { reviewers } = await org.reviewers(protocolId)
      setReviewersByProtocol(prev => ({ ...prev, [protocolId]: reviewers }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function assign(protocolId: number) {
    const isBioethics = organType === 'bioethics_committee'
    const one = pickOne[protocolId]
    const two = pickTwo[protocolId]
    const primary = bioPrimary[protocolId]
    const bioIds = bioReviewerIds[protocolId] ?? []

    if (isBioethics) {
      if (!primary) {
        setError('Escolhe o revisor principal do Comité de Bioética.')
        return
      }
    } else if (!one || !two || one === two) {
      setError('Escolhe dois revisores diferentes.')
      return
    }

    setAssigningId(protocolId)
    try {
      if (isBioethics) {
        const reviewerIds = Array.from(new Set(bioIds.map(Number)))
        await protocolService.assignReviewersBioetica(protocolId, Number(primary), reviewerIds)
        setBioPrimary(prev => { const n = { ...prev }; delete n[protocolId]; return n })
        setBioReviewerIds(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      } else {
        const assignTwoReviewers = organType === 'scientific_committee'
          ? protocolService.assignReviewersCC
          : protocolService.assignReviewersNucleo
        await assignTwoReviewers(protocolId, Number(one), Number(two))
        setPickOne(prev => { const n = { ...prev }; delete n[protocolId]; return n })
        setPickTwo(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      }
      setReviewersByProtocol(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAssigningId(null)
    }
  }

  function setRequirementRejectReason(requirementId: number, reason: string) {
    setRequirementRejectionReasons(prev => ({ ...prev, [requirementId]: reason }))
  }

  async function downloadRequirement(url: string | null | undefined, fallbackFilename?: string | null) {
    if (!url) return

    try {
      await protocolService.downloadFile(url, fallbackFilename || undefined)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function approveRequirement(protocolId: number, requirementId: number) {
    setReviewingRequirementId(requirementId)
    setError(null)

    try {
      await protocolService.approveRequiredDocument(protocolId, requirementId)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setReviewingRequirementId(null)
    }
  }

  async function rejectRequirement(protocolId: number, requirementId: number) {
    const reason = (requirementRejectionReasons[requirementId] ?? '').trim()

    if (!reason) {
      setError('Informe o motivo da reprovação do anexo.')
      return
    }

    setReviewingRequirementId(requirementId)
    setError(null)

    try {
      await protocolService.rejectRequiredDocument(protocolId, requirementId, reason)
      setRequirementRejectionReasons(prev => {
        const next = { ...prev }
        delete next[requirementId]
        return next
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setReviewingRequirementId(null)
    }
  }

  function toggleBioReviewer(protocolId: number, reviewerId: number) {
    if (bioPrimary[protocolId] === reviewerId) return

    setBioReviewerIds(prev => {
      const current = prev[protocolId] ?? []
      const next = current.includes(reviewerId)
        ? current.filter(id => id !== reviewerId)
        : [...current, reviewerId]

      return { ...prev, [protocolId]: next }
    })
  }

  function selectBioPrimary(protocolId: number, reviewerId: number) {
    setBioPrimary(prev => ({ ...prev, [protocolId]: reviewerId }))
    setBioReviewerIds(prev => ({ ...prev, [protocolId]: (prev[protocolId] ?? []).filter(id => id !== reviewerId) }))
  }

  const pendingCount = protocols.filter(p => (
    p.status === org.pendingStatus ||
    (organType === 'scientific_committee' && p.status === 'protocol_documents_pending_cc')
  )).length

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)',
        fontSize: 'var(--body-lg)',
        gap: 'var(--space-2)'
      }}>
        <span style={{
          width: '24px', height: '24px',
          border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite'
        }} />
        A carregar protocolos...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)'
    }}>

      {/* Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: 'var(--surface-container)',
          color: 'var(--on-surface-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
          {protocols.length} protocolo{protocols.length !== 1 ? 's' : ''}
          {pendingCount > 0 && ` • ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Erro */}
      {error && (
        <div role="alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--error-container)',
          color: 'var(--on-error-container)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* Estado vazio */}
      {protocols.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-5) var(--space-3)',
          color: 'var(--on-surface-variant)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--outline-variant)'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '48px',
            marginBottom: 'var(--space-2)',
            display: 'block'
          }}>
            folder_open
          </span>
          <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>
            Sem protocolos pendentes no núcleo
          </p>
          <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>
            Os protocolos submetidos aparecerão aqui para atribuição de revisores.
          </p>
        </div>
      )}

      {/* Lista de protocolos */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }}>
        {protocols.map(p => {
          const s = getStatusStyle(p.status)
          const protocolReviewers = reviewersByProtocol[p.id]
          const isDocumentValidation = organType === 'scientific_committee' && p.status === 'protocol_documents_pending_cc'
          const isPending = p.status === org.pendingStatus || isDocumentValidation
          const isHistorical = Boolean(p.is_historical_for_organ || !isPending)
          const isAssigning = assigningId === p.id
          const sel1 = pickOne[p.id]
          const sel2 = pickTwo[p.id]
          const isBioethics = organType === 'bioethics_committee'
	          const selectedBio = bioReviewerIds[p.id] ?? []
	          const primaryBio = bioPrimary[p.id]
	          const primaryReviewers = (protocolReviewers ?? []).filter(r => r.is_same_scientific_area)
	          const canAssign = isBioethics ? Boolean(primaryBio) : Boolean(sel1 && sel2 && sel1 !== sel2)
	          const latestOpinion = p.organ_tracking?.latest_opinion

          return (
            <div key={p.id} className="card" style={{
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              {/* Cabeçalho */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <h3 style={{
                      fontSize: 'var(--body-lg)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--on-surface)'
                    }}>
                      {p.code}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-md)',
                      fontWeight: 'var(--font-medium)',
                      background: s.bg,
                      color: s.color,
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        width: '6px', height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: s.dot
                      }} />
                      {p.organ_tracking?.status_label || p.status_label || s.label}
                    </span>
                    {isHistorical && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)', background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline-variant)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
                        Registo histórico
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)'
                  }}>
                    Tema: {p.topic?.title || '—'}
                  </p>
                  {p.topic && (
                    <TopicJustificationToggle
                      justification={p.topic.justification}
                      showEmpty
                      compact
                      style={{ marginTop: 'var(--space-2)' }}
                    />
                  )}
                </div>
              </div>

	              {isHistorical && (
	                <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
	                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>history</span>
	                  <span>{p.organ_tracking?.latest_action_label || 'Último registo'}{p.organ_tracking?.latest_action_at ? ` em ${new Date(p.organ_tracking.latest_action_at).toLocaleDateString('pt-PT')}` : ''}.</span>
	                  {latestOpinion?.download_url && (
	                    <button type="button" className="btn btn-small" onClick={() => downloadRequirement(latestOpinion.download_url, `parecer-${p.code}.pdf`)}>
	                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
	                      Parecer
	                    </button>
	                  )}
	                  {latestOpinion?.evaluation_form_download_url && (
	                    <button type="button" className="btn btn-small" onClick={() => downloadRequirement(latestOpinion.evaluation_form_download_url, `ficha-${p.code}.pdf`)}>
	                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>
	                      Ficha
	                    </button>
	                  )}
	                </div>
	              )}

              {/* Área de validação documental ou atribuição (apenas pendentes) */}
              {isPending && (
                isDocumentValidation ? (
                  <RequiredDocumentsReviewPanel
                    protocol={p}
                    reviewingRequirementId={reviewingRequirementId}
                    rejectionReasons={requirementRejectionReasons}
                    onReasonChange={setRequirementRejectReason}
                    onApprove={approveRequirement}
                    onReject={rejectRequirement}
                    onDownload={downloadRequirement}
                  />
                ) : (
                  <div style={{
                    padding: 'var(--space-3)',
                    background: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)'
                  }}>
                  {!protocolReviewers ? (
                    <button
                      onClick={() => loadReviewers(p.id)}
                      className="btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: '10px var(--space-3)',
                        fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-medium)',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        width: 'fit-content',
                        border: '1px solid var(--outline-variant)',
                        background: 'var(--surface-container-lowest)',
                        color: 'var(--primary)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--surface-container)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--surface-container-lowest)'
                        e.currentTarget.style.borderColor = 'var(--outline-variant)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                      Ver revisores elegíveis
                    </button>
                  ) : (
                    <>
                      <p style={{
                        fontSize: 'var(--label-md)',
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--on-surface-variant)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Selecionar revisores ({protocolReviewers.length} disponíveis)
                      </p>

                      {isBioethics ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>
                              Revisor principal do Comité de Bioética (mesma área científica)
                            </label>
                            <select
                              value={primaryBio ?? ''}
                              onChange={e => selectBioPrimary(p.id, Number(e.target.value))}
                              style={{
                                width: '100%',
                                padding: '10px var(--space-2)',
                                background: 'var(--surface-container-lowest)',
                                border: '1px solid var(--outline-variant)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: 'var(--body-md)',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--on-surface)',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="">— Escolher revisor da área —</option>
                              {primaryReviewers.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name}{r.scientific_area_name ? ` • ${r.scientific_area_name}` : ''}
                                </option>
                              ))}
                            </select>
                            {primaryReviewers.length === 0 && (
                              <span style={{ fontSize: 'var(--label-sm)', color: 'var(--error)' }}>
                                Nenhum membro do Comité de Bioética pertence à área científica deste protocolo.
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)', margin: 0 }}>
                              Revisores secundários do Comité de Bioética ({selectedBio.length} selecionado{selectedBio.length !== 1 ? 's' : ''})
                            </p>
                            {protocolReviewers.map(r => {
                              const checked = selectedBio.includes(r.id)
                              const isPrimary = primaryBio === r.id

                              return (
                                <label key={r.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-2)',
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-md)',
                                  background: checked ? 'var(--primary-container)' : 'var(--surface-container-lowest)',
                                  color: checked ? 'var(--on-primary-container)' : 'var(--on-surface)',
                                  border: isPrimary ? '1px solid var(--primary)' : '1px solid transparent',
                                  cursor: isPrimary ? 'not-allowed' : 'pointer',
                                  opacity: isPrimary ? 0.7 : 1,
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isPrimary}
                                    onChange={() => toggleBioReviewer(p.id, r.id)}
                                    style={{ accentColor: 'var(--primary)', cursor: isPrimary ? 'not-allowed' : 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                                  />
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: checked ? 'var(--primary)' : 'var(--on-surface-variant)' }}>person</span>
                                  <span style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: checked ? 'var(--font-semibold)' : 'var(--font-regular)' }}>{r.name}</span>
                                    {r.scientific_area_name && (
                                      <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginLeft: 'var(--space-1)' }}>
                                        • {r.scientific_area_name}
                                      </span>
                                    )}
                                  </span>
                                  {isPrimary && (
                                    <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'var(--on-primary)' }}>
                                      Principal
                                    </span>
                                  )}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 'var(--space-3)'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            <label style={{
                              fontSize: 'var(--label-md)',
                              fontWeight: 'var(--font-medium)',
                              color: 'var(--on-surface-variant)'
                            }}>
                              Revisor 1
                            </label>
                            <select
                              value={sel1 ?? ''}
                              onChange={e => setPickOne(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                              style={{
                                width: '100%',
                                padding: '10px var(--space-2)',
                                background: 'var(--surface-container-lowest)',
                                border: '1px solid var(--outline-variant)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: 'var(--body-md)',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--on-surface)',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => {
                                e.target.style.borderColor = 'var(--primary)'
                                e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                              }}
                              onBlur={e => {
                                e.target.style.borderColor = 'var(--outline-variant)'
                                e.target.style.boxShadow = 'none'
                              }}
                            >
                              <option value="">— Escolher —</option>
                              {protocolReviewers.map(r => (
                                <option key={r.id} value={r.id} disabled={sel2 === r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            <label style={{
                              fontSize: 'var(--label-md)',
                              fontWeight: 'var(--font-medium)',
                              color: 'var(--on-surface-variant)'
                            }}>
                              Revisor 2
                            </label>
                            <select
                              value={sel2 ?? ''}
                              onChange={e => setPickTwo(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                              style={{
                                width: '100%',
                                padding: '10px var(--space-2)',
                                background: 'var(--surface-container-lowest)',
                                border: '1px solid var(--outline-variant)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: 'var(--body-md)',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--on-surface)',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => {
                                e.target.style.borderColor = 'var(--primary)'
                                e.target.style.boxShadow = '0 0 0 2px rgba(0,105,51,0.15)'
                              }}
                              onBlur={e => {
                                e.target.style.borderColor = 'var(--outline-variant)'
                                e.target.style.boxShadow = 'none'
                              }}
                            >
                              <option value="">— Escolher —</option>
                              {protocolReviewers.map(r => (
                                <option key={r.id} value={r.id} disabled={sel1 === r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Botão atribuir */}
                      <button
                        onClick={() => assign(p.id)}
                        disabled={!canAssign || isAssigning}
                        className="btn btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 'var(--space-1)',
                          padding: '12px var(--space-3)',
                          fontSize: 'var(--body-md)',
                          fontWeight: 'var(--font-semibold)',
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          cursor: !canAssign || isAssigning ? 'not-allowed' : 'pointer',
                          opacity: !canAssign || isAssigning ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          width: 'fit-content'
                        }}
                      >
                        {isAssigning ? (
                          <>
                            <span style={{
                              width: '16px', height: '16px',
                              border: '2px solid var(--on-primary)',
                              borderTopColor: 'transparent',
                              borderRadius: 'var(--radius-full)',
                              animation: 'spin 0.8s linear infinite'
                            }} />
                            A atribuir...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
                            Atribuir revisores
                          </>
                        )}
                      </button>
                    </>
                  )}
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
