// src/pages/secretary/SecretaryProtocolsPage.tsx
import { useState, useEffect } from 'react'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { monographService, type Monograph } from '../../services/monographService'
import { TopicJustificationToggle } from '../../components/TopicJustification'
import { RequiredDocumentsReviewPanel } from '../../components/protocol/RequiredDocumentsReviewPanel'
import { SignatureParecerPanel } from '../../components/protocol/SignatureParecerPanel'
import { useAuth, type SecretaryProfile } from '../../context/AuthContext'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getTopicStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic_pending_nucleo: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    topic_assigned_for_review: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Revisores atribuídos' },
    topic_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em revisão' },
    topic_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado' },
    topic_rejected: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getProtocolStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_pending_nucleo: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    protocol_in_review_nucleo: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Núcleo)' },
    protocol_documents_pending_cc: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Docs Pendentes (CC)' },
    protocol_documents_pending_cibs: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Docs Pendentes (CIBS)' },
    protocol_pending_comite_cientifico: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (CC)' },
    protocol_in_review_comite_cientifico: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (CC)' },
    protocol_parecer_pending_cc_signature: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Parecer CC p/ assinar' },
    protocol_pending_comite_bioetica: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Bioética)' },
    protocol_in_review_comite_bioetica: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Bioética)' },
    protocol_parecer_pending_cibs_signature: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Parecer Bioética p/ assinar' },
    protocol_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado' },
    protocol_rejected_nucleo: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (Núcleo)' },
    protocol_rejected_cc: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (CC)' },
    protocol_rejected_bioetica: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado (Bioética)' },
    protocol_approved_final: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado final' },
    protocol_rejected_final: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovado final' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// Interface para revisor com carga (preparada para o futuro)
interface ReviewerWithLoad {
  id: number
  name: string
  email?: string
  scientific_area_name?: string | null
  scientific_area_id?: number
  is_same_scientific_area?: boolean
  active_works?: number
  currentLoad?: number  // Será preenchido quando a API retornar
  maxLoad?: number      // Será preenchido quando a API retornar
  pending_reviews_count?: number
  pending_topic_reviews_count?: number
  pending_protocol_reviews_count?: number
}

function getReviewerLoad(r: ReviewerWithLoad): number {
  if (r.currentLoad !== undefined) return r.currentLoad
  if (r.pending_reviews_count !== undefined) return r.pending_reviews_count
  if (r.active_works !== undefined) return r.active_works
  return 0
}

function getLoadColor(load: number): string {
  if (load >= 5) return 'var(--error)'
  if (load >= 3) return 'var(--tertiary)'
  return 'var(--primary)'
}

function LoadBadge({ reviewer }: { reviewer: ReviewerWithLoad }) {
  const load = getReviewerLoad(reviewer)
  return (
    <span style={{
      fontSize: 'var(--label-sm)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      background: getLoadColor(load),
      color: 'white',
      whiteSpace: 'nowrap',
      fontWeight: 'var(--font-medium)',
    }} title={`${load} revisão(ões) pendente(s)`}>
      {load} pendente{load !== 1 ? 's' : ''}
    </span>
  )
}

type TabType = 'topics' | 'protocols' | 'monographs'

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function SecretaryProtocolsPage() {
  const [tab, setTab] = useState<TabType>('topics')

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-1)' }}>Gestão de submissões</h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Atribuição de revisores • Revisão • Acompanhamento</p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'topics' as TabType, label: 'Temas', icon: 'lightbulb' },
          { id: 'protocols' as TabType, label: 'Protocolos', icon: 'description' },
          { id: 'monographs' as TabType, label: 'Monografias', icon: 'book' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: tab === t.id ? 'var(--font-bold)' : 'var(--font-medium)',
            border: 'none', borderBottom: tab === t.id ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'transparent', cursor: 'pointer', color: tab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'topics' && <TopicsTab />}
      {tab === 'protocols' && <ProtocolsTab />}
      {tab === 'monographs' && <MonographsTab />}
    </div>
  )
}

// ============================================================
// TAB: TEMAS
// ============================================================
function TopicsTab() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [reviewersByTopic, setReviewersByTopic] = useState<Record<number, ReviewerWithLoad[]>>({})
  const [reviewerSearch, setReviewerSearch] = useState<Record<number, string>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { topics } = await topicService.listForSecretary()
      setTopics(topics)
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }

  async function loadReviewers(topicId: number) {
    try {
      const { reviewers } = await topicService.eligibleReviewers(topicId)
      setReviewersByTopic(prev => ({ 
        ...prev, 
        [topicId]: reviewers.map(r => ({ ...r, currentLoad: undefined, maxLoad: undefined })) 
      }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function toggleReviewer(topicId: number, reviewerId: number) {
    setSelected(prev => {
      const cur = prev[topicId] ?? []
      return { ...prev, [topicId]: cur.includes(reviewerId) ? cur.filter(id => id !== reviewerId) : [...cur, reviewerId] }
    })
  }

  async function assign(topicId: number) {
    const ids = selected[topicId] ?? []
    if (!ids.length) return
    setAssigningId(topicId)
    try { 
      await topicService.assignReviewers(topicId, ids)
      setSelected(p => { const n = { ...p }; delete n[topicId]; return n })
      setReviewersByTopic(prev => { const n = { ...prev }; delete n[topicId]; return n })
      setReviewerSearch(prev => { const n = { ...prev }; delete n[topicId]; return n })
      await load() 
    }
    catch (e) { setError((e as Error).message) } finally { setAssigningId(null) }
  }

  const pending = topics.filter(t => t.status === 'topic_pending_nucleo')

  // Função para filtrar revisores (performance otimizada para 10k+)
  function getFilteredReviewers(topicId: number): ReviewerWithLoad[] {
    const allReviewers = reviewersByTopic[topicId] ?? []
    const search = reviewerSearch[topicId] ?? ''
    
    if (!search.trim()) return allReviewers
    
    const searchLower = search.toLowerCase()
    return allReviewers.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      (r.email && r.email.toLowerCase().includes(searchLower)) ||
      (r.scientific_area_name && r.scientific_area_name.toLowerCase().includes(searchLower))
    )
  }

  // Função para cor da carga (preparada para o futuro)

  if (loading) return <Spinner text="A carregar temas..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {error && <ErrorAlert message={error} />}
      <StatsRow items={[{ icon: 'lightbulb', count: topics.length, label: 'temas', color: 'var(--primary)' }, ...(pending.length > 0 ? [{ icon: 'pending_actions', count: pending.length, label: 'pendentes', color: 'var(--tertiary)' }] : [])]} />
      {topics.length === 0 && <EmptyState icon="lightbulb" text="Sem temas pendentes" sub="Os temas submetidos aparecerão aqui." />}

      {pending.length > 0 && (
        <>
          <SectionTitle icon="pending_actions" title="Pendentes de atribuição" color="var(--tertiary)" count={pending.length} />
          {pending.map(t => {
            const s = getTopicStatusStyle(t.status)
            const sel = selected[t.id] ?? []
            const filteredReviewers = getFilteredReviewers(t.id)
            const searchValue = reviewerSearch[t.id] ?? ''
            
            return (
              <div key={t.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', marginBottom: '6px' }}>{t.title}</h3>
                <StatusBadge s={s} label={t.status_label || s.label} />
                <TopicJustificationToggle justification={t.justification} showEmpty compact />

                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                  {!reviewersByTopic[t.id] ? (
                    <button
                      onClick={() => loadReviewers(t.id)}
                      className="btn"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                        padding: '10px var(--space-3)', fontSize: 'var(--body-md)',
                        fontWeight: 'var(--font-medium)', borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer', width: 'fit-content',
                        border: '1px solid var(--outline-variant)',
                        background: 'var(--surface-container-lowest)', color: 'var(--primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                      Ver avaliadores elegíveis
                    </button>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', gap: 'var(--space-2)' }}>
                        <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', margin: 0, whiteSpace: 'nowrap' }}>
                          Avaliadores elegíveis ({reviewersByTopic[t.id].length})
                          {filteredReviewers.length !== reviewersByTopic[t.id].length && 
                            <span style={{ fontWeight: 'var(--font-regular)', color: 'var(--on-surface-variant)' }}> • {filteredReviewers.length} encontrados</span>
                          }
                        </p>
                        <input 
                          type="text" 
                          value={searchValue} 
                          onChange={e => setReviewerSearch(prev => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="Pesquisar por nome, email ou área..." 
                          style={{ 
                            padding: '6px 10px', 
                            background: 'var(--surface-container-lowest)', 
                            border: '1px solid var(--outline-variant)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontSize: 'var(--label-sm)', 
                            fontFamily: 'var(--font-family)', 
                            outline: 'none', 
                            width: '280px',
                            maxWidth: '100%'
                          }} 
                        />
                      </div>
                      
                      {filteredReviewers.length === 0 ? (
                        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', fontStyle: 'italic', textAlign: 'center', padding: 'var(--space-2)' }}>
                          {searchValue ? 'Nenhum avaliador encontrado com estes critérios.' : 'Nenhum avaliador elegível encontrado.'}
                        </p>
                      ) : (
                        <>
                          {sel.length > 0 && (
                            <span style={{ 
                              display: 'inline-block', 
                              fontSize: 'var(--label-md)', 
                              fontWeight: 'var(--font-medium)', 
                              color: 'var(--primary)', 
                              background: 'var(--primary-container)', 
                              padding: '2px 10px', 
                              borderRadius: 'var(--radius-full)',
                              marginBottom: 'var(--space-2)'
                            }}>
                              {sel.length} selecionado{sel.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 'var(--space-1)', 
                            marginBottom: 'var(--space-2)', 
                            maxHeight: '400px', 
                            overflow: 'auto' 
                          }}>
                            {filteredReviewers.map(r => {
                              const checked = sel.includes(r.id)
                              
                              return (
                                <label key={r.id} style={{ 
                                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)', 
                                  padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', 
                                  background: checked ? 'var(--primary-container)' : 'var(--surface-container-lowest)', 
                                  color: checked ? 'var(--on-primary-container)' : 'var(--on-surface)', 
                                  fontSize: 'var(--body-sm)', 
                                  border: checked ? '1px solid var(--primary)' : '1px solid transparent', 
                                  transition: 'all 0.15s' 
                                }}>
                                  <input 
                                    type="checkbox" 
                                    checked={checked} 
                                    onChange={() => toggleReviewer(t.id, r.id)} 
                                    style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }} 
                                  />
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: checked ? 'var(--primary)' : 'var(--on-surface-variant)' }}>person</span>
                                  <span style={{ flex: 1 }}>
                                    <span style={{ fontWeight: checked ? 'var(--font-semibold)' : 'var(--font-regular)' }}>{r.name}</span>
                                    {r.scientific_area_name && (
                                      <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginLeft: 'var(--space-1)' }}>
                                        • {r.scientific_area_name}
                                      </span>
                                    )}
                                  </span>
                                  <LoadBadge reviewer={r} />
                                </label>
                              )
                            })}
                          </div>
                        </>
                      )}
                      
                      <AssignButton 
                        assigning={assigningId === t.id} 
                        disabled={!sel.length} 
                        onClick={() => assign(t.id)} 
                        label={`Atribuir ${sel.length} avaliador${sel.length !== 1 ? 'es' : ''}`} 
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
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
// TAB: PROTOCOLOS
// ============================================================
function ProtocolsTab() {
  const { activeProfile } = useAuth()
  const secretaryProfile = activeProfile as SecretaryProfile | null
  const organType = secretaryProfile?.organ?.type
  const org = getOrganEndpoints(organType)

  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickOne, setPickOne] = useState<Record<number, number | ''>>({})
  const [pickTwo, setPickTwo] = useState<Record<number, number | ''>>({})
  const [bioReviewerIds, setBioReviewerIds] = useState<Record<number, number[]>>({})
  const [bioPrimary, setBioPrimary] = useState<Record<number, number | ''>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [reviewersByProtocol, setReviewersByProtocol] = useState<Record<number, ReviewerWithLoad[]>>({})
  const [reviewerSearch, setReviewerSearch] = useState<Record<number, string>>({})
  const [reviewingRequirementId, setReviewingRequirementId] = useState<number | null>(null)
  const [requirementRejectionReasons, setRequirementRejectionReasons] = useState<Record<number, string>>({})

  useEffect(() => { load() }, [organType])

  async function load() {
    setLoading(true)
    try { const { protocols } = await org.list(); setProtocols(protocols) }
    catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }

  async function loadReviewers(protocolId: number) {
    try {
      const { reviewers } = await org.reviewers(protocolId)
      setReviewersByProtocol(prev => ({ 
        ...prev, 
        [protocolId]: reviewers.map(r => ({ ...r, currentLoad: undefined, maxLoad: undefined })) 
      }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function assign(protocolId: number) {
    const isBioethics = organType === 'bioethics_committee'
    const one = pickOne[protocolId]; const two = pickTwo[protocolId]
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
        setBioPrimary(p => { const n = { ...p }; delete n[protocolId]; return n })
        setBioReviewerIds(p => { const n = { ...p }; delete n[protocolId]; return n })
      } else {
        const assignTwoReviewers = organType === 'scientific_committee'
          ? protocolService.assignReviewersCC
          : protocolService.assignReviewersNucleo
        await assignTwoReviewers(protocolId, Number(one), Number(two))
        setPickOne(p => { const n = { ...p }; delete n[protocolId]; return n })
        setPickTwo(p => { const n = { ...p }; delete n[protocolId]; return n })
      }
      setReviewersByProtocol(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      setReviewerSearch(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      await load()
    } catch (e) { setError((e as Error).message) } finally { setAssigningId(null) }
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
      setError('Informe o motivo da não aprovação do anexo.')
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

  const pending = protocols.filter(p => (
    p.status === org.pendingStatus ||
    (organType === 'scientific_committee' && p.status === 'protocol_documents_pending_cc') ||
    (organType === 'bioethics_committee' && p.status === 'protocol_documents_pending_cibs') ||
    (organType === 'scientific_committee' && p.status === 'protocol_parecer_pending_cc_signature') ||
    (organType === 'bioethics_committee' && p.status === 'protocol_parecer_pending_cibs_signature')
  ))

  function getFilteredReviewers(protocolId: number): ReviewerWithLoad[] {
    const allReviewers = reviewersByProtocol[protocolId] ?? []
    const search = reviewerSearch[protocolId] ?? ''
    
    if (!search.trim()) return allReviewers
    
    const searchLower = search.toLowerCase()
    return allReviewers.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      (r.email && r.email.toLowerCase().includes(searchLower)) ||
      (r.scientific_area_name && r.scientific_area_name.toLowerCase().includes(searchLower))
    )
  }

  if (loading) return <Spinner text="A carregar protocolos..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {error && <ErrorAlert message={error} />}
      <StatsRow items={[{ icon: 'description', count: protocols.length, label: 'protocolos', color: 'var(--primary)' }, ...(pending.length > 0 ? [{ icon: 'pending_actions', count: pending.length, label: 'pendentes', color: 'var(--tertiary)' }] : [])]} />
      {protocols.length === 0 && <EmptyState icon="folder_open" text="Sem protocolos pendentes" sub="Os protocolos submetidos aparecerão aqui." />}

      {protocols.map(p => {
        const s = getProtocolStatusStyle(p.status)
        const allReviewers = reviewersByProtocol[p.id] ?? []
        const filteredReviewers = getFilteredReviewers(p.id)
        const sel1 = pickOne[p.id]
        const sel2 = pickTwo[p.id]
        const isBioethics = organType === 'bioethics_committee'
        const selectedBio = bioReviewerIds[p.id] ?? []
        const primaryBio = bioPrimary[p.id]
        const searchValue = reviewerSearch[p.id] ?? ''
        const isDocumentValidation = (
          (organType === 'scientific_committee' && p.status === 'protocol_documents_pending_cc') ||
          (organType === 'bioethics_committee' && p.status === 'protocol_documents_pending_cibs')
        )
        const isSignaturePending = (
          (organType === 'scientific_committee' && p.status === 'protocol_parecer_pending_cc_signature') ||
          (organType === 'bioethics_committee' && p.status === 'protocol_parecer_pending_cibs_signature')
        )
        const isPending = p.status === org.pendingStatus || isDocumentValidation || isSignaturePending
	        const isHistorical = Boolean(p.is_historical_for_organ || !isPending)
	        const primaryReviewers = allReviewers.filter(r => r.is_same_scientific_area)
	        const canAssign = isBioethics ? Boolean(primaryBio) : Boolean(sel1 && sel2 && sel1 !== sel2)
	        const latestOpinion = p.organ_tracking?.latest_opinion
        
        return (
          <div key={p.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '6px' }}>
              <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{p.code}</h3>
              <StatusBadge s={s} label={p.organ_tracking?.status_label || p.status_label || s.label} />
              {isHistorical && (
                <StatusBadge s={{ bg: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' }} label="Registo histórico" />
              )}
            </div>
            <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 0 }}>Tema: {p.topic?.title || '—'}</p>
            {p.topic && <TopicJustificationToggle justification={p.topic.justification} showEmpty compact />}

	            {!isPending ? (
	              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
	                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>history</span>
	                <span>
	                  {p.organ_tracking?.latest_action_label || 'Último registo'}
	                  {p.organ_tracking?.latest_action_at ? ` em ${new Date(p.organ_tracking.latest_action_at).toLocaleDateString('pt-PT')}` : ''}.
	                </span>
	                {latestOpinion?.signed_download_url && (
	                  <button type="button" className="btn btn-small" onClick={() => downloadRequirement(latestOpinion.signed_download_url, `parecer-assinado-${p.code}.pdf`)}>
	                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
	                    Parecer assinado
	                  </button>
	                )}
	                {latestOpinion?.download_url && !latestOpinion?.signed_download_url && (
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
	            ) : isDocumentValidation ? (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <RequiredDocumentsReviewPanel
                  protocol={p}
                  reviewingRequirementId={reviewingRequirementId}
                  rejectionReasons={requirementRejectionReasons}
                  onReasonChange={setRequirementRejectReason}
                  onApprove={approveRequirement}
                  onReject={rejectRequirement}
                  onDownload={downloadRequirement}
                  organ={organType === 'bioethics_committee' ? 'comite_bioetica' : 'comite_cientifico'}
                />
              </div>
            ) : isSignaturePending ? (
              <SignatureParecerPanel
                protocol={p}
                orgName={organType === 'bioethics_committee' ? 'Comité de Bioética' : 'Comité Científico'}
                onDownloadParecer={downloadRequirement}
                onDone={load}
              />
            ) : (
            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
              {!reviewersByProtocol[p.id] ? (
                <button
                  onClick={() => loadReviewers(p.id)}
                  className="btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                    padding: '10px var(--space-3)', fontSize: 'var(--body-md)',
                    fontWeight: 'var(--font-medium)', borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer', width: 'fit-content',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-lowest)', color: 'var(--primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                  Ver revisores elegíveis
                </button>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', margin: 0 }}>
                      Selecionar revisores ({allReviewers.length} disponíveis)
                      {filteredReviewers.length !== allReviewers.length && 
                        <span style={{ fontWeight: 'var(--font-regular)' }}> • {filteredReviewers.length} encontrados</span>
                      }
                    </p>
                    <input 
                      type="text" 
                      value={searchValue} 
                      onChange={e => setReviewerSearch(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Pesquisar por nome, email ou área..." 
                      style={{ 
                        padding: '6px 10px', 
                        background: 'var(--surface-container-lowest)', 
                        border: '1px solid var(--outline-variant)', 
                        borderRadius: 'var(--radius-lg)', 
                        fontSize: 'var(--label-sm)', 
                        fontFamily: 'var(--font-family)', 
                        outline: 'none', 
                        width: '280px',
                        maxWidth: '100%'
                      }} 
                    />
                  </div>
                  
                  {filteredReviewers.length === 0 ? (
                    <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', fontStyle: 'italic', textAlign: 'center', padding: 'var(--space-2)' }}>
                      {searchValue ? 'Nenhum revisor encontrado com estes critérios.' : 'Nenhum revisor elegível encontrado.'}
                    </p>
                  ) : (
                    isBioethics ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>
                            Revisor principal do Comité de Bioética (mesma área científica)
                          </label>
                          <select
                            value={primaryBio ?? ''}
                            onChange={e => selectBioPrimary(p.id, Number(e.target.value))}
                            style={{ width: '100%', padding: '10px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="">— Escolher revisor da área —</option>
                            {primaryReviewers.map(r => {
                              const load = getReviewerLoad(r)
                              return (
                                <option key={r.id} value={r.id}>
                                  {r.name}{r.scientific_area_name ? ` • ${r.scientific_area_name}` : ''}{` [${load} pendente${load !== 1 ? 's' : ''}]`}
                                </option>
                              )
                            })}
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: '400px', overflow: 'auto' }}>
                            {filteredReviewers.map(r => {
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
                                  fontSize: 'var(--body-sm)',
                                  border: isPrimary ? '1px solid var(--primary)' : '1px solid transparent',
                                  cursor: isPrimary ? 'not-allowed' : 'pointer',
                                  opacity: isPrimary ? 0.7 : 1,
                                  transition: 'all 0.15s'
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
                                  <LoadBadge reviewer={r} />
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
                      </div>
                    ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Revisor 1</label>
                        <select
                          value={sel1 ?? ''}
                          onChange={e => setPickOne(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                          style={{ width: '100%', padding: '10px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">— Escolher —</option>
                          {filteredReviewers.map(r => {
                            const load = getReviewerLoad(r)
                            return (
                              <option key={r.id} value={r.id} disabled={sel2 === r.id}>
                                {r.name}{r.scientific_area_name ? ` • ${r.scientific_area_name}` : ''}{` [${load} pendente${load !== 1 ? 's' : ''}]`}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>Revisor 2</label>
                        <select
                          value={sel2 ?? ''}
                          onChange={e => setPickTwo(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                          style={{ width: '100%', padding: '10px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">— Escolher —</option>
                          {filteredReviewers.map(r => {
                            const load = getReviewerLoad(r)
                            return (
                              <option key={r.id} value={r.id} disabled={sel1 === r.id}>
                                {r.name}{r.scientific_area_name ? ` • ${r.scientific_area_name}` : ''}{` [${load} pendente${load !== 1 ? 's' : ''}]`}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </div>
                    )
                  )}
                  
                  <AssignButton assigning={assigningId === p.id} disabled={!canAssign} onClick={() => assign(p.id)} label="Atribuir revisores" />
                </>
              )}
            </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// TAB: MONOGRAFIAS
// ============================================================
function MonographsTab() {
  const [monographs, setMonographs] = useState<Monograph[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  async function load() { setLoading(true); try { const data = await monographService.list(); setMonographs(data.monographs || []) } catch (e) {} finally { setLoading(false) } }

  if (loading) return <Spinner text="A carregar..." />

  return (
    <div>
      <StatsRow items={[{ icon: 'book', count: monographs.length, label: 'monografias', color: 'var(--secondary)' }]} />
      {monographs.length === 0 && <EmptyState icon="book" text="Sem monografias" sub="As monografias aparecerão aqui." />}
      {monographs.map(m => (
        <div key={m.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', marginTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{m.code}</h3>
            <StatusBadge s={{ bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)' }} label={m.status_label || m.status} />
          </div>
          {m.title && <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', marginTop: '4px' }}>{m.title}</p>}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// COMPONENTES PARTILHADOS
// ============================================================
function Spinner({ text }: { text: string }) { 
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />{text}
    </div>
  ) 
}

function ErrorAlert({ message }: { message: string }) { 
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>{message}
    </div>
  ) 
}

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub: string }) { 
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>{icon}</span>
      <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>{text}</p>
      <p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>{sub}</p>
    </div>
  ) 
}

function StatsRow({ items }: { items: { icon: string; count: number; label: string; color: string }[] }) { 
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: item.color, fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
          <span>{item.count}</span>
          <span style={{ fontWeight: 'var(--font-regular)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-md)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  ) 
}

function SectionTitle({ icon, title, color, count }: { icon: string; title: string; color?: string; count: number }) { 
  return (
    <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: color || 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>{title}
      <span style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>({count})</span>
    </h2>
  ) 
}

function StatusBadge({ s, label }: { s: { bg: string; color: string; dot: string }; label?: string }) { 
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />{label}
    </span>
  ) 
}

function AssignButton({ assigning, disabled, onClick, label }: { assigning: boolean; disabled: boolean; onClick: () => void; label: string }) { 
  return (
    <button onClick={onClick} disabled={disabled || assigning} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: disabled || assigning ? 'not-allowed' : 'pointer', opacity: disabled || assigning ? 0.6 : 1, width: 'fit-content' }}>
      {assigning ? (
        <>
          <span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} /> A atribuir...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span> {label}
        </>
      )}
    </button>
  ) 
}
