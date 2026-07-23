// src/pages/secretary/SecretaryProtocolsPage.tsx
import { useState, useEffect } from 'react'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { monographService, type Monograph } from '../../services/monographService'
import TopicJustification, { TopicJustificationToggle } from '../../components/TopicJustification'
import '../../styles/global.css'

function getTopicStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
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
    protocol_pending_nucleo: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    protocol_in_review_nucleo: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Núcleo)' },
    protocol_pending_comite_cientifico: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (CC)' },
    protocol_in_review_comite_cientifico: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (CC)' },
    protocol_pending_comite_bioetica: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Bioética)' },
    protocol_in_review_comite_bioetica: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Em Revisão (Bioética)' },
    protocol_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovado' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

interface ReviewerWithLoad {
  id: number
  name: string
  email: string
  academic_degree: string
  currentLoad: number
  maxLoad: number
}

type TabType = 'topics' | 'protocols' | 'monographs'

const MOCK_REVIEWERS: ReviewerWithLoad[] = [
  { id: 1, name: 'Dr. Armando Macuácua', email: 'armando@iscisa.ac.mz', academic_degree: 'Doutoramento', currentLoad: 3, maxLoad: 5 },
  { id: 2, name: 'Dra. Carla Mondlane', email: 'carla@iscisa.ac.mz', academic_degree: 'Mestrado', currentLoad: 1, maxLoad: 5 },
  { id: 3, name: 'Prof. Doutor José Chissano', email: 'jose@iscisa.ac.mz', academic_degree: 'Doutoramento', currentLoad: 5, maxLoad: 5 },
  { id: 4, name: 'Dra. Ana Tembe', email: 'ana@iscisa.ac.mz', academic_degree: 'Mestrado', currentLoad: 2, maxLoad: 5 },
  { id: 5, name: 'Dr. Pedro Nkosi', email: 'pedro@iscisa.ac.mz', academic_degree: 'Doutoramento', currentLoad: 0, maxLoad: 5 },
  { id: 6, name: 'Dra. Sofia Mabunda', email: 'sofia@iscisa.ac.mz', academic_degree: 'Mestrado', currentLoad: 4, maxLoad: 5 },
]

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
  const [reviewerSearch, setReviewerSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { topics } = await topicService.listForSecretary()
      setTopics(topics)
    } catch (e) { setError((e as Error).message) } finally { setLoading(false) }
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
    try { await topicService.assignReviewers(topicId, ids); setSelected(p => { const n = { ...p }; delete n[topicId]; return n }); await load() }
    catch (e) { setError((e as Error).message) } finally { setAssigningId(null) }
  }

  const pending = topics.filter(t => t.status === 'topic_pending_nucleo')
  const filteredReviewers = MOCK_REVIEWERS.filter(r => !reviewerSearch || r.name.toLowerCase().includes(reviewerSearch.toLowerCase()))

  function getLoadColor(c: number, m: number): string { if (c >= m) return 'var(--error)'; if (c >= m * 0.8) return 'var(--tertiary)'; return 'var(--primary)' }

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
            return (
              <div key={t.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', marginBottom: '6px' }}>{t.title}</h3>
                <StatusBadge s={s} label={t.status_label || s.label} />
                <TopicJustificationToggle justification={t.justification} showEmpty compact />

                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)' }}>Docentes disponíveis</p>
                    <input type="text" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)} placeholder="Pesquisar docente..." style={{ padding: '6px 10px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)', outline: 'none', width: '220px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-2)', maxHeight: '300px', overflow: 'auto' }}>
                    {filteredReviewers.map(r => {
                      const checked = sel.includes(r.id)
                      const loadColor = getLoadColor(r.currentLoad, r.maxLoad)
                      return (
                        <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: checked ? 'var(--primary-container)' : 'var(--surface-container-lowest)', color: checked ? 'var(--on-primary-container)' : 'var(--on-surface)', fontSize: 'var(--body-sm)', border: checked ? '1px solid var(--primary)' : '1px solid transparent', transition: 'all 0.15s' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleReviewer(t.id, r.id)} style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '16px', height: '16px' }} />
                          <span style={{ flex: 1 }}>
                            <span style={{ fontWeight: 'var(--font-semibold)' }}>{r.name}</span>
                            <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginLeft: 'var(--space-1)' }}>• {r.academic_degree}</span>
                          </span>
                          <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: loadColor, color: 'white', whiteSpace: 'nowrap', fontWeight: 'var(--font-medium)' }}>
                            {r.currentLoad}/{r.maxLoad}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <AssignButton assigning={assigningId === t.id} disabled={!sel.length} onClick={() => assign(t.id)} label={`Atribuir ${sel.length} avaliador${sel.length !== 1 ? 'es' : ''}`} />
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ============================================================
// TAB: PROTOCOLOS
// ============================================================
function ProtocolsTab() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickOne, setPickOne] = useState<Record<number, number | ''>>({})
  const [pickTwo, setPickTwo] = useState<Record<number, number | ''>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)
  const [reviewerSearch, setReviewerSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const { protocols } = await protocolService.listForSecretary(); setProtocols(protocols) }
    catch (e) { setError((e as Error).message) } finally { setLoading(false) }
  }

  async function assign(protocolId: number) {
    const one = pickOne[protocolId]; const two = pickTwo[protocolId]
    if (!one || !two || one === two) { setError('Escolhe dois revisores diferentes.'); return }
    setAssigningId(protocolId)
    try {
      await protocolService.assignReviewersNucleo(protocolId, Number(one), Number(two))
      setPickOne(p => { const n = { ...p }; delete n[protocolId]; return n })
      setPickTwo(p => { const n = { ...p }; delete n[protocolId]; return n })
      await load()
    } catch (e) { setError((e as Error).message) } finally { setAssigningId(null) }
  }

  const pending = protocols.filter(p => ['protocol_pending_nucleo', 'protocol_pending_comite_cientifico', 'protocol_pending_comite_bioetica'].includes(p.status))
  const filteredReviewers = MOCK_REVIEWERS.filter(r => !reviewerSearch || r.name.toLowerCase().includes(reviewerSearch.toLowerCase()))

  function getLoadColor(c: number, m: number): string { if (c >= m) return 'var(--error)'; if (c >= m * 0.8) return 'var(--tertiary)'; return 'var(--primary)' }

  if (loading) return <Spinner text="A carregar protocolos..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {error && <ErrorAlert message={error} />}
      <StatsRow items={[{ icon: 'description', count: protocols.length, label: 'protocolos', color: 'var(--primary)' }, ...(pending.length > 0 ? [{ icon: 'pending_actions', count: pending.length, label: 'pendentes', color: 'var(--tertiary)' }] : [])]} />
      {protocols.length === 0 && <EmptyState icon="folder_open" text="Sem protocolos pendentes" sub="Os protocolos submetidos aparecerão aqui." />}

      {pending.map(p => {
        const s = getProtocolStatusStyle(p.status)
        return (
          <div key={p.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '6px' }}>
              <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{p.code}</h3>
              <StatusBadge s={s} label={p.status_label || s.label} />
            </div>
            <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 0 }}>Tema: {p.topic?.title || '—'}</p>
            {p.topic && <TopicJustificationToggle justification={p.topic.justification} showEmpty compact />}

            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)' }}>Docentes disponíveis</p>
                <input type="text" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)} placeholder="Pesquisar..." style={{ padding: '6px 10px', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--label-sm)', fontFamily: 'var(--font-family)', outline: 'none', width: '200px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-2)', maxHeight: '300px', overflow: 'auto' }}>
                {filteredReviewers.map(r => {
                  const loadColor = getLoadColor(r.currentLoad, r.maxLoad)
                  const selectedAs = pickOne[p.id] === r.id ? '1' : pickTwo[p.id] === r.id ? '2' : ''
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: selectedAs ? 'var(--primary-container)' : 'var(--surface-container-lowest)', fontSize: 'var(--body-sm)', transition: 'all 0.15s' }}>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontWeight: 'var(--font-semibold)' }}>{r.name}</span>
                        <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginLeft: 'var(--space-1)' }}>• {r.academic_degree}</span>
                      </span>
                      <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: loadColor, color: 'white', whiteSpace: 'nowrap', marginRight: 'var(--space-2)' }}>{r.currentLoad}/{r.maxLoad}</span>
                      <select value={selectedAs} onChange={e => {
                        const slot = e.target.value
                        if (slot === '1') { setPickOne(prev => ({ ...prev, [p.id]: r.id })); if (pickTwo[p.id] === r.id) setPickTwo(prev => ({ ...prev, [p.id]: '' })) }
                        else if (slot === '2') { setPickTwo(prev => ({ ...prev, [p.id]: r.id })); if (pickOne[p.id] === r.id) setPickOne(prev => ({ ...prev, [p.id]: '' })) }
                        else { if (pickOne[p.id] === r.id) setPickOne(prev => ({ ...prev, [p.id]: '' })); if (pickTwo[p.id] === r.id) setPickTwo(prev => ({ ...prev, [p.id]: '' })) }
                      }} style={{ padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: 'var(--label-sm)', background: 'var(--surface-container-lowest)' }}>
                        <option value="">—</option>
                        <option value="1">Revisor 1</option>
                        <option value="2">Revisor 2</option>
                      </select>
                    </div>
                  )
                })}
              </div>
              <AssignButton assigning={assigningId === p.id} disabled={!pickOne[p.id] || !pickTwo[p.id]} onClick={() => assign(p.id)} label="Atribuir revisores" />
            </div>
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
function Spinner({ text }: { text: string }) { return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)' }}><span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />{text}</div> }
function ErrorAlert({ message }: { message: string }) { return <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)' }}><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>{message}</div> }
function EmptyState({ icon, text, sub }: { icon: string; text: string; sub: string }) { return <div style={{ textAlign: 'center', padding: 'var(--space-5) var(--space-3)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}><span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>{icon}</span><p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>{text}</p><p style={{ fontSize: 'var(--body-md)', marginTop: 'var(--space-1)' }}>{sub}</p></div> }
function StatsRow({ items }: { items: { icon: string; count: number; label: string; color: string }[] }) { return <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>{items.map((item, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '8px 16px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: item.color, fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span><span>{item.count}</span><span style={{ fontWeight: 'var(--font-regular)', color: 'var(--on-surface-variant)', fontSize: 'var(--label-md)' }}>{item.label}</span></div>)}</div> }
function SectionTitle({ icon, title, color, count }: { icon: string; title: string; color?: string; count: number }) { return <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: color || 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>{title}<span style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>({count})</span></h2> }
function StatusBadge({ s, label }: { s: { bg: string; color: string; dot: string }; label?: string }) { return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}><span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', background: s.dot }} />{label}</span> }
function AssignButton({ assigning, disabled, onClick, label }: { assigning: boolean; disabled: boolean; onClick: () => void; label: string }) { return <button onClick={onClick} disabled={disabled || assigning} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)', padding: '12px var(--space-3)', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: disabled || assigning ? 'not-allowed' : 'pointer', opacity: disabled || assigning ? 0.6 : 1, width: 'fit-content' }}>{assigning ? <><span style={{ width: '16px', height: '16px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} /> A atribuir...</> : <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span> {label}</>}</button> }