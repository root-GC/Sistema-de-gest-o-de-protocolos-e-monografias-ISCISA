// src/pages/SecretaryPage/MonographsTab.tsx
import { useState, useEffect } from 'react'
import { monographService, type Monograph } from '../../../services/monographService'
import type { AssignedReviewer } from '../../../services/monographService'
import '../../../styles/global.css'

// ============================================================
// HELPERS
// ============================================================
function getMonographStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    monograph_submitted: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Submetida' },
    monograph_pending_supervisor: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Pendente (Supervisor)' },
    monograph_approved_supervisor: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovada (Supervisor)' },
    monograph_pending_nucleo: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Pendente (Núcleo)' },
    monograph_in_review: { bg: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', dot: 'var(--tertiary)', label: 'Em Revisão' },
    monograph_approved_nucleo: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Aprovada' },
    monograph_rejected_nucleo: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Não Aprovada (Núcleo)' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTES AUXILIARES
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

function StatsRow({ items }: { items: { icon: string; count: number; label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '8px 16px', borderRadius: 'var(--radius-full)',
          background: 'var(--surface-container)', color: item.color,
          fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)'
        }}>
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
      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
      {title}
      <span style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface-variant)' }}>({count})</span>
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

function SelectRevisor({ label, value, onChange, reviewers, disabledId }: {
  label: string; value: string | number; onChange: (v: string) => void;
  reviewers: { id: number; name: string }[]; disabledId?: number | ''
}) {
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

function AssignedReviewersPanel({ reviewers, loading, emptyText = 'Nenhum revisor atribuído.' }: {
  reviewers?: AssignedReviewer[]; loading: boolean; emptyText?: string
}) {
  return (
    <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
      <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>Revisores atribuídos</p>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--on-surface-variant)', fontSize: 'var(--body-md)' }}>
          <span style={{ width: '16px', height: '16px', border: '2px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)', animation: 'spin 0.8s linear infinite' }} />
          A carregar...
        </div>
      ) : !reviewers || reviewers.length === 0 ? (
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
          {reviewers.map((r, i) => (
            <div key={`${r.assignment_id || r.id}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', padding: '10px var(--space-2)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)', marginTop: '2px' }}>person_check</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginBottom: '2px' }}>{r.slot === 'reviewer_one' ? 'Revisor 1' : 'Revisor 2'}</p>
                <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>{r.name || `Revisor #${r.id}`}</p>
                {r.email && <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>{r.email}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function MonographsTab() {
  const [monographs, setMonographs] = useState<Monograph[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewersByMonograph, setReviewersByMonograph] = useState<Record<number, { id: number; name: string }[]>>({})
  const [assignedReviewersByMonograph, setAssignedReviewersByMonograph] = useState<Record<number, AssignedReviewer[]>>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loadingAssignedId, setLoadingAssignedId] = useState<number | null>(null)
  const [pickOne, setPickOne] = useState<Record<number, number | ''>>({})
  const [pickTwo, setPickTwo] = useState<Record<number, number | ''>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await monographService.listForSecretary()
      setMonographs(data.monographs || [])
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  async function loadReviewers(monographId: number) {
    try {
      const { reviewers } = await monographService.getEligibleReviewers(monographId)
      setReviewersByMonograph(prev => ({ ...prev, [monographId]: reviewers }))
    } catch (e) { setError((e as Error).message) }
  }

  async function loadAssignedReviewers(monographId: number) {
    setLoadingAssignedId(monographId)
    try {
      const { reviewers } = await monographService.getAssignedReviewers(monographId)
      setAssignedReviewersByMonograph(prev => ({ ...prev, [monographId]: reviewers }))
    } catch (e) { setError((e as Error).message) }
    finally { setLoadingAssignedId(null) }
  }

  async function toggleAssignedReviewers(monographId: number) {
    if (expandedId === monographId) { setExpandedId(null); return }
    setExpandedId(monographId)
    if (!assignedReviewersByMonograph[monographId]) await loadAssignedReviewers(monographId)
  }

  async function assign(monographId: number) {
    const one = pickOne[monographId]
    const two = pickTwo[monographId]
    if (!one || !two || one === two) { setError('Escolhe dois revisores diferentes.'); return }
    setAssigningId(monographId)
    try {
      await monographService.assignReviewers(monographId, Number(one), Number(two))
      setPickOne(prev => { const n = { ...prev }; delete n[monographId]; return n })
      setPickTwo(prev => { const n = { ...prev }; delete n[monographId]; return n })
      setReviewersByMonograph(prev => { const n = { ...prev }; delete n[monographId]; return n })
      await load()
      setExpandedId(monographId)
      await loadAssignedReviewers(monographId)
    } catch (e) { setError((e as Error).message) }
    finally { setAssigningId(null) }
  }

  if (loading) return <Spinner text="A carregar monografias..." />

  const pending = monographs.filter(m => m.status === 'monograph_pending_nucleo')
  const others = monographs.filter(m => m.status !== 'monograph_pending_nucleo')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {error && <ErrorAlert message={error} />}

      <StatsRow items={[
        { icon: 'book', count: monographs.length, label: 'monografias', color: 'var(--secondary)' },
        ...(pending.length > 0 ? [{ icon: 'pending_actions', count: pending.length, label: 'pendentes', color: 'var(--tertiary)' }] : []),
      ]} />

      {monographs.length === 0 && (
        <EmptyState icon="book" text="Sem monografias submetidas" sub="As monografias aparecerão aqui para revisão." />
      )}

      {/* Pendentes */}
      {pending.length > 0 && (
        <>
          <SectionTitle icon="pending_actions" title="Pendentes de atribuição" color="var(--tertiary)" count={pending.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {pending.map(m => {
              const s = getMonographStatusStyle(m.status)
              const revs = reviewersByMonograph[m.id]
              const isExpanded = expandedId === m.id

              return (
                <div key={m.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  {/* Header clicável */}
                  <button
                    type="button"
                    onClick={() => toggleAssignedReviewers(m.id)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      gap: 'var(--space-2)', padding: 0, border: 'none', background: 'transparent',
                      color: 'inherit', cursor: 'pointer', fontFamily: 'var(--font-family)', textAlign: 'left'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{m.code}</h3>
                        <StatusBadge s={s} label={m.status_label || s.label} />
                      </div>
                      {m.title && <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 0 }}>{m.title}</p>}
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px', flexWrap: 'wrap' }}>
                        {m.student && (
                          <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                            {m.student.name}
                          </span>
                        )}
                        <span style={{ fontSize: 'var(--label-sm)', color: 'var(--outline)' }}>
                          Submissão nº{m.submission_number} • v{m.version}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {/* Revisores atribuídos (expand) */}
                  {isExpanded && (
                    <AssignedReviewersPanel
                      reviewers={assignedReviewersByMonograph[m.id]}
                      loading={loadingAssignedId === m.id}
                      emptyText="Nenhum revisor atribuído a esta monografia."
                    />
                  )}

                  {/* Documentos */}
                  {m.documents?.filter(d => d.status === 'active').map(doc => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: '10px 14px', background: 'var(--surface-container-low)',
                      borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-2)'
                    }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>description</span>
                      <span style={{ fontSize: 'var(--body-md)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.file_name}
                      </span>
                      <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>v{doc.version}</span>
                    </div>
                  ))}

                  {/* Área de atribuição de revisores */}
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                    {!revs ? (
                      <button
                        onClick={() => loadReviewers(m.id)}
                        className="btn"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                          padding: '10px var(--space-3)', fontSize: 'var(--body-md)',
                          fontWeight: 'var(--font-medium)', borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer', border: '1px solid var(--outline-variant)',
                          background: 'var(--surface-container-lowest)', color: 'var(--primary)'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                        Ver revisores elegíveis
                      </button>
                    ) : (
                      <>
                        <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>
                          Selecionar revisores ({revs.length} disponíveis)
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                          <SelectRevisor
                            label="Revisor 1"
                            value={pickOne[m.id] ?? ''}
                            onChange={v => setPickOne(prev => ({ ...prev, [m.id]: Number(v) }))}
                            reviewers={revs}
                            disabledId={pickTwo[m.id]}
                          />
                          <SelectRevisor
                            label="Revisor 2"
                            value={pickTwo[m.id] ?? ''}
                            onChange={v => setPickTwo(prev => ({ ...prev, [m.id]: Number(v) }))}
                            reviewers={revs}
                            disabledId={pickOne[m.id]}
                          />
                        </div>
                        <AssignButton
                          assigning={assigningId === m.id}
                          disabled={!pickOne[m.id] || !pickTwo[m.id]}
                          onClick={() => assign(m.id)}
                          label="Atribuir revisores"
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Outras (já processadas) */}
      {others.length > 0 && (
        <>
          <SectionTitle icon="checklist" title="Outras monografias" count={others.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {others.map(m => {
              const s = getMonographStatusStyle(m.status)
              const isExpanded = expandedId === m.id

              return (
                <div key={m.id} className="card" style={{ padding: 'var(--space-2) var(--space-3)', opacity: 0.85 }}>
                  <button
                    type="button"
                    onClick={() => toggleAssignedReviewers(m.id)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 'var(--space-2)', padding: 0, border: 'none', background: 'transparent',
                      color: 'inherit', cursor: 'pointer', fontFamily: 'var(--font-family)', textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{m.code}</h3>
                      <StatusBadge s={s} label={m.status_label || s.label} />
                      {m.student && (
                        <span style={{ fontSize: 'var(--label-sm)', color: 'var(--outline)' }}>{m.student.name}</span>
                      )}
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isExpanded && (
                    <>
                      {m.title && <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginTop: 'var(--space-2)' }}>{m.title}</p>}
                      <AssignedReviewersPanel
                        reviewers={assignedReviewersByMonograph[m.id]}
                        loading={loadingAssignedId === m.id}
                        emptyText="Nenhum revisor atribuído."
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}