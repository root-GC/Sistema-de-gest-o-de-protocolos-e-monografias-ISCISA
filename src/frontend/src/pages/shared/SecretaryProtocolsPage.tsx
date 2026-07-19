import { useState, useEffect } from 'react'
import { topicService, type AssignedTopicReviewer, type Topic } from '../../services/topicService'
import { protocolService, type AssignedProtocolReviewer, type Protocol } from '../../services/protocolService'
import TopicJustification, { TopicJustificationToggle } from '../../components/TopicJustification'
import '../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getTopicStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    topic_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    topic_pending_nucleo: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    topic_assigned_for_review: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Revisores atribuídos' },
    topic_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em revisão' },
    topic_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado' },
    topic_rejected: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

function getProtocolStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    protocol_submitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Submetido' },
    protocol_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    protocol_approved_supervisor: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado (Supervisor)' },
    protocol_rejected_supervisor: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado (Supervisor)' },
    protocol_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em Revisão' },
    protocol_pending_nucleo: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    protocol_in_review_nucleo: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Núcleo)' },
    protocol_pending_comite_cientifico: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Comité Científico)' },
    protocol_in_review_comite_cientifico: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Comité Científico)' },
    protocol_pending_comite_bioetica: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Comité de Bioética)' },
    protocol_in_review_comite_bioetica: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Comité de Bioética)' },
    protocol_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado' },
    protocol_rejected_nucleo: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Rejeitado' },
    protocol_resubmitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function SecretaryProtocolsPage() {
  const [tab, setTab] = useState<'topics' | 'protocols'>('topics')

  return (
    <div style={{
      width: '100%',
      fontFamily: 'var(--font-family)',
      color: 'var(--on-background)'
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)',
            marginBottom: 'var(--space-1)'
          }}>
            Gestão de submissões
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Atribuição de revisores • Revisão cega
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2px',
        marginBottom: 'var(--space-4)',
        background: 'var(--surface-container-low)',
        borderRadius: 'var(--radius-lg)',
        padding: '4px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setTab('topics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '10px var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--body-md)',
            fontWeight: tab === 'topics' ? 'var(--font-bold)' : 'var(--font-medium)',
            fontFamily: 'var(--font-family)',
            cursor: 'pointer',
            background: tab === 'topics' ? 'var(--surface-container-lowest)' : 'transparent',
            color: tab === 'topics' ? 'var(--primary)' : 'var(--on-surface-variant)',
            boxShadow: tab === 'topics' ? 'var(--elevation-1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lightbulb</span>
          Temas
        </button>
        <button
          onClick={() => setTab('protocols')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '10px var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--body-md)',
            fontWeight: tab === 'protocols' ? 'var(--font-bold)' : 'var(--font-medium)',
            fontFamily: 'var(--font-family)',
            cursor: 'pointer',
            background: tab === 'protocols' ? 'var(--surface-container-lowest)' : 'transparent',
            color: tab === 'protocols' ? 'var(--primary)' : 'var(--on-surface-variant)',
            boxShadow: tab === 'protocols' ? 'var(--elevation-1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
          Protocolos
        </button>
      </div>

      {/* Conteúdo da tab */}
      {tab === 'topics' ? <TopicsTab /> : <ProtocolsTab />}
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
  const [reviewersByTopic, setReviewersByTopic] = useState<Record<number, { id: number; name: string }[]>>({})
  const [assignedReviewersByTopic, setAssignedReviewersByTopic] = useState<Record<number, AssignedTopicReviewer[]>>({})
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null)
  const [loadingAssignedTopicId, setLoadingAssignedTopicId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Record<number, number[]>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { topics } = await topicService.listForSecretary()
      setTopics(topics)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  async function loadReviewers(topicId: number) {
    try {
      const { reviewers } = await topicService.eligibleReviewers(topicId)
      setReviewersByTopic(prev => ({ ...prev, [topicId]: reviewers }))
    } catch (e) { setError((e as Error).message) }
  }

  async function loadAssignedReviewers(topicId: number) {
    setLoadingAssignedTopicId(topicId)
    try {
      const { reviewers } = await topicService.getAssignedReviewers(topicId)
      setAssignedReviewersByTopic(prev => ({ ...prev, [topicId]: reviewers }))
    } catch (e) { setError((e as Error).message) }
    finally { setLoadingAssignedTopicId(null) }
  }

  async function toggleAssignedReviewers(topicId: number) {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null)
      return
    }

    setExpandedTopicId(topicId)

    if (!assignedReviewersByTopic[topicId]) {
      await loadAssignedReviewers(topicId)
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
      setReviewersByTopic(p => { const n = { ...p }; delete n[topicId]; return n })
      await load()
      setExpandedTopicId(topicId)
      await loadAssignedReviewers(topicId)
    } catch (e) { setError((e as Error).message) }
    finally { setAssigningId(null) }
  }

  if (loading) return <Spinner text="A carregar temas..." />

  const pending = topics.filter(t => t.status === 'topic_pending_nucleo')
  const others = topics.filter(t => t.status !== 'topic_pending_nucleo')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {error && <ErrorAlert message={error} />}

      {/* Badge de contagem */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <CountBadge icon="lightbulb" count={topics.length} label="tema" />
        {pending.length > 0 && <CountBadge icon="pending_actions" count={pending.length} label="pendente" color="var(--tertiary)" />}
      </div>

      {topics.length === 0 && <EmptyState icon="lightbulb" text="Sem temas pendentes no núcleo" sub="Os temas submetidos aparecerão aqui." />}

      {/* Pendentes */}
      {pending.length > 0 && (
        <>
          <SectionTitle icon="pending_actions" title="Pendentes de atribuição" color="var(--tertiary)" />
          {pending.map(t => (
            <TopicCard
              key={t.id}
              topic={t}
              reviewers={reviewersByTopic[t.id]}
              selected={selected[t.id] ?? []}
              assigning={assigningId === t.id}
              onLoadReviewers={() => loadReviewers(t.id)}
              onToggle={(rid) => toggleReviewer(t.id, rid)}
              onAssign={() => assign(t.id)}
            />
          ))}
        </>
      )}

      {/* Outros */}
      {others.length > 0 && (
        <>
          <SectionTitle icon="checklist" title="Outras submissões" />
          {others.map(t => {
            const s = getTopicStatusStyle(t.status)
            const isExpanded = expandedTopicId === t.id
            const assignedReviewers = assignedReviewersByTopic[t.id]
            const isLoadingAssigned = loadingAssignedTopicId === t.id
            return (
              <div key={t.id} className="card" style={{ padding: 'var(--space-2) var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => toggleAssignedReviewers(t.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0 }}>
                    <StatusBadge s={s} label={t.status_label || s.label} />
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)' }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </span>
                </button>

                {isExpanded && (
                  <>
                    <TopicJustification
                      justification={t.justification}
                      showEmpty
                      compact
                      style={{ marginTop: 'var(--space-2)' }}
                    />
                    <AssignedReviewersPanel
                      reviewers={assignedReviewers}
                      loading={isLoadingAssigned}
                    />
                  </>
                )}
              </div>
            )
          })}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// TAB: PROTOCOLOS
// ============================================================
function getProtocolOrganService(status: string) {
  if (status.startsWith('protocol_pending_nucleo') || status.startsWith('protocol_in_review_nucleo')) {
    return {
      getEligibleReviewers: protocolService.getEligibleReviewersNucleo,
      getAssignedReviewers: protocolService.getAssignedReviewersNucleo,
      assignReviewers: protocolService.assignReviewersNucleo,
    }
  }
  if (status.startsWith('protocol_pending_comite_cientifico') || status.startsWith('protocol_in_review_comite_cientifico')) {
    return {
      getEligibleReviewers: protocolService.getEligibleReviewersCC,
      getAssignedReviewers: protocolService.getAssignedReviewersCC,
      assignReviewers: protocolService.assignReviewersCC,
    }
  }
  if (status.startsWith('protocol_pending_comite_bioetica') || status.startsWith('protocol_in_review_comite_bioetica')) {
    return {
      getEligibleReviewers: protocolService.getEligibleReviewersBioetica,
      getAssignedReviewers: protocolService.getAssignedReviewersBioetica,
      assignReviewers: protocolService.assignReviewersBioetica,
    }
  }
  return null
}

function ProtocolsTab() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewersByProtocol, setReviewersByProtocol] = useState<Record<number, { id: number; name: string }[]>>({})
  const [assignedReviewersByProtocol, setAssignedReviewersByProtocol] = useState<Record<number, AssignedProtocolReviewer[]>>({})
  const [expandedProtocolId, setExpandedProtocolId] = useState<number | null>(null)
  const [loadingAssignedProtocolId, setLoadingAssignedProtocolId] = useState<number | null>(null)
  const [pickOne, setPickOne] = useState<Record<number, number | ''>>({})
  const [pickTwo, setPickTwo] = useState<Record<number, number | ''>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { protocols } = await protocolService.listForSecretary()
      setProtocols(protocols)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  function findProtocol(protocolId: number): Protocol | undefined {
    return protocols.find(p => p.id === protocolId)
  }

  async function loadReviewers(protocolId: number) {
    const protocol = findProtocol(protocolId)
    if (!protocol) return
    const service = getProtocolOrganService(protocol.status)
    if (!service) return

    try {
      const { reviewers } = await service.getEligibleReviewers(protocolId)
      setReviewersByProtocol(prev => ({ ...prev, [protocolId]: reviewers }))
    } catch (e) { setError((e as Error).message) }
  }

  async function loadAssignedReviewers(protocolId: number) {
    const protocol = findProtocol(protocolId)
    if (!protocol) return
    const service = getProtocolOrganService(protocol.status)
    if (!service) return

    setLoadingAssignedProtocolId(protocolId)
    try {
      const { reviewers } = await service.getAssignedReviewers(protocolId)
      setAssignedReviewersByProtocol(prev => ({ ...prev, [protocolId]: reviewers }))
    } catch (e) { setError((e as Error).message) }
    finally { setLoadingAssignedProtocolId(null) }
  }

  async function toggleAssignedReviewers(protocolId: number) {
    if (expandedProtocolId === protocolId) {
      setExpandedProtocolId(null)
      return
    }

    setExpandedProtocolId(protocolId)

    if (!assignedReviewersByProtocol[protocolId]) {
      await loadAssignedReviewers(protocolId)
    }
  }

  async function assign(protocolId: number) {
    const one = pickOne[protocolId]
    const two = pickTwo[protocolId]
    if (!one || !two || one === two) { setError('Escolhe dois revisores diferentes.'); return }

    const protocol = findProtocol(protocolId)
    if (!protocol) return
    const service = getProtocolOrganService(protocol.status)
    if (!service) return

    setAssigningId(protocolId)
    try {
      await service.assignReviewers(protocolId, Number(one), Number(two))
      setPickOne(p => { const n = { ...p }; delete n[protocolId]; return n })
      setPickTwo(p => { const n = { ...p }; delete n[protocolId]; return n })
      setReviewersByProtocol(p => { const n = { ...p }; delete n[protocolId]; return n })
      await load()
      setExpandedProtocolId(protocolId)
      await loadAssignedReviewers(protocolId)
    } catch (e) { setError((e as Error).message) }
    finally { setAssigningId(null) }
  }

  if (loading) return <Spinner text="A carregar protocolos..." />

  const pending = protocols.filter(p => ['protocol_pending_nucleo', 'protocol_pending_comite_cientifico', 'protocol_pending_comite_bioetica'].includes(p.status))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {error && <ErrorAlert message={error} />}

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <CountBadge icon="description" count={protocols.length} label="protocolo" />
        {pending.length > 0 && <CountBadge icon="pending_actions" count={pending.length} label="pendente" color="var(--tertiary)" />}
      </div>

      {protocols.length === 0 && <EmptyState icon="folder_open" text="Sem protocolos pendentes no núcleo" sub="Os protocolos submetidos aparecerão aqui." />}

      {protocols.map(p => {
        const s = getProtocolStatusStyle(p.status)
        const isPending = ['protocol_pending_nucleo', 'protocol_pending_comite_cientifico', 'protocol_pending_comite_bioetica'].includes(p.status)
        const revs = reviewersByProtocol[p.id]
        const s1 = pickOne[p.id]
        const s2 = pickTwo[p.id]
        const isExpanded = expandedProtocolId === p.id
        const assignedReviewers = assignedReviewersByProtocol[p.id]
        const isLoadingAssigned = loadingAssignedProtocolId === p.id

        return (
          <div key={p.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() => toggleAssignedReviewers(p.id)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)' }}>{p.code}</h3>
                  <StatusBadge s={s} label={p.status_label} />
                </div>
                <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Tema: {p.topic?.title || '—'}</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isExpanded && (
              <>
                {p.topic && (
                  <TopicJustification
                    justification={p.topic.justification}
                    showEmpty
                    compact
                    style={{ marginTop: 'var(--space-2)' }}
                  />
                )}
                <AssignedReviewersPanel
                  reviewers={assignedReviewers}
                  loading={isLoadingAssigned}
                  emptyText="Nenhum revisor atribuído a este protocolo."
                />
              </>
            )}

            {isPending && (
              <div style={{ padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                {!revs ? (
                  <button onClick={() => loadReviewers(p.id)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span> Ver revisores elegíveis
                  </button>
                ) : (
                  <>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Selecionar revisores ({revs.length})</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                      <SelectRevisor label="Revisor 1" value={s1 ?? ''} onChange={v => setPickOne(prev => ({ ...prev, [p.id]: Number(v) }))} reviewers={revs} disabledId={s2} />
                      <SelectRevisor label="Revisor 2" value={s2 ?? ''} onChange={v => setPickTwo(prev => ({ ...prev, [p.id]: Number(v) }))} reviewers={revs} disabledId={s1} />
                    </div>
                    <AssignButton assigning={assigningId === p.id} disabled={!s1 || !s2} onClick={() => assign(p.id)} label="Atribuir revisores" />
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES PARTILHADOS
// ============================================================
function Spinner({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
      {text}
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
      {message}
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

function CountBadge({ icon, count, label, color }: { icon: string; count: number; label: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: 'var(--surface-container)', color: color || 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
      {count} {label}{count !== 1 ? (label.endsWith('s') ? '' : 's') : ''}
    </span>
  )
}

function SectionTitle({ icon, title, color }: { icon: string; title: string; color?: string }) {
  return (
    <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: color || 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
      {title}
    </h2>
  )
}

function StatusBadge({ s, label }: { s: { bg: string; color: string; dot: string }; label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />
      {label}
    </span>
  )
}

function AssignButton({ assigning, disabled, onClick, label }: { assigning: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled || assigning} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: disabled || assigning ? 'not-allowed' : 'pointer', opacity: disabled || assigning ? 0.6 : 1, width: 'fit-content' }}>
      {assigning ? (
        <><span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} /> A atribuir...</>
      ) : (
        <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span> {label}</>
      )}
    </button>
  )
}

function SelectRevisor({ label, value, onChange, reviewers, disabledId }: { label: string; value: string | number; onChange: (v: string) => void; reviewers: { id: number; name: string }[]; disabledId?: number | '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '10px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontFamily: 'var(--font-family)', color: 'var(--on-surface)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
        <option value="">— Escolher —</option>
        {reviewers.map(r => <option key={r.id} value={r.id} disabled={r.id === disabledId}>{r.name}</option>)}
      </select>
    </div>
  )
}

function AssignedReviewersPanel({
  reviewers,
  loading,
  emptyText = 'Nenhum revisor atribuído a este tema.'
}: {
  reviewers?: Array<AssignedTopicReviewer | AssignedProtocolReviewer>;
  loading: boolean;
  emptyText?: string;
}) {
  return (
    <div style={{
      marginTop: 'var(--space-2)',
      padding: 'var(--space-3)',
      background: 'var(--surface-container-low)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--outline-variant)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }}>
      <p style={{
        fontSize: 'var(--label-md)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--on-surface-variant)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Revisores atribuídos
      </p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>
          <span style={{ width: '16px', height: '16px', border: '2px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
          A carregar revisores...
        </div>
      ) : !reviewers || reviewers.length === 0 ? (
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
          {reviewers.map((reviewer, index) => {
            const label = 'slot' in reviewer
              ? reviewer.slot === 'reviewer_one' ? 'Revisor 1' : 'Revisor 2'
              : `Revisor ${index + 1}`

            return (
              <div
                key={`${reviewer.assignment_id}-${reviewer.id}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  padding: '10px var(--space-2)',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', marginTop: '2px' }}>person_check</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginBottom: '2px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {reviewer.name || `Revisor #${reviewer.id}`}
                  </p>
                  {reviewer.email && (
                    <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reviewer.email}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TopicCard({ topic, reviewers, selected, assigning, onLoadReviewers, onToggle, onAssign }: {
  topic: Topic
  reviewers?: { id: number; name: string }[]
  selected: number[]
  assigning: boolean
  onLoadReviewers: () => void
  onToggle: (rid: number) => void
  onAssign: () => void
}) {
  const s = getTopicStatusStyle(topic.status)
  return (
    <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div>
        <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</h3>
        <StatusBadge s={s} label={topic.status_label} />
      </div>
      <TopicJustificationToggle justification={topic.justification} showEmpty compact />
      {!reviewers ? (
        <button onClick={onLoadReviewers} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--primary)', width: 'fit-content' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span> Ver avaliadores elegíveis
        </button>
      ) : (
        <div style={{ padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avaliadores ({reviewers.length})</p>
            {selected.length > 0 && <span style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--primary)', background: 'var(--primary-container)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>{selected.length} selecionado{selected.length !== 1 ? 's' : ''}</span>}
          </div>
          {reviewers.length === 0 ? (
            <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', fontStyle: 'italic', textAlign: 'center' }}>Nenhum avaliador elegível.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
              {reviewers.map(r => {
                const checked = selected.includes(r.id)
                return (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px var(--space-2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s', background: checked ? 'var(--primary-container)' : 'transparent', color: checked ? 'var(--on-primary-container)' : 'var(--on-surface)', fontSize: 'var(--body-md)', fontWeight: checked ? 'var(--font-medium)' : 'var(--font-regular)', border: checked ? '1px solid var(--primary)' : '1px solid transparent' }}>
                    <input type="checkbox" checked={checked} onChange={() => onToggle(r.id)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }} />
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: checked ? 'var(--primary)' : 'var(--on-surface-variant)' }}>person</span>
                    {r.name}
                  </label>
                )
              })}
            </div>
          )}
          <AssignButton assigning={assigning} disabled={!selected.length} onClick={onAssign} label={`Atribuir ${selected.length} avaliador${selected.length !== 1 ? 'es' : ''}`} />
        </div>
      )}
    </div>
  )
}
