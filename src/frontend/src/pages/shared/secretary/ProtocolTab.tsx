import { useEffect, useState } from 'react'
import { protocolService, type Protocol } from '../../../services/protocolService'
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
    protocol_approved_nucleo:     { bg: 'var(--primary-container)',  color: 'var(--on-primary-container)',  dot: 'var(--primary)',  label: 'Aprovado' },
    protocol_rejected_nucleo:     { bg: 'var(--error-container)',    color: 'var(--on-error-container)',    dot: 'var(--error)',    label: 'Rejeitado' },
    protocol_resubmitted:         { bg: 'var(--tertiary-fixed)',     color: 'var(--on-tertiary-fixed)',    dot: 'var(--tertiary)', label: 'Re-submetido' },
  }
  return map[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)', dot: 'var(--outline)', label: status }
}

// ============================================================
// COMPONENTE
// ============================================================
export function ProtocolsTab() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewersByProtocol, setReviewersByProtocol] = useState<Record<number, { id: number; name: string }[]>>({})
  const [pickOne, setPickOne] = useState<Record<number, number | ''>>({})
  const [pickTwo, setPickTwo] = useState<Record<number, number | ''>>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { protocols } = await protocolService.listForSecretary()
      setProtocols(protocols)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function loadReviewers(protocolId: number) {
    try {
      const { reviewers } = await protocolService.eligibleReviewers(protocolId)
      setReviewersByProtocol(prev => ({ ...prev, [protocolId]: reviewers }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function assign(protocolId: number) {
    const one = pickOne[protocolId]
    const two = pickTwo[protocolId]
    if (!one || !two || one === two) {
      setError('Escolhe dois revisores diferentes.')
      return
    }
    setAssigningId(protocolId)
    try {
      await protocolService.assignReviewers(protocolId, Number(one), Number(two))
      setPickOne(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      setPickTwo(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      setReviewersByProtocol(prev => { const n = { ...prev }; delete n[protocolId]; return n })
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAssigningId(null)
    }
  }

  const pendingCount = protocols.filter(p => p.status === 'protocol_pending_nucleo').length

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
          const isPending = p.status === 'protocol_pending_nucleo'
          const isAssigning = assigningId === p.id
          const sel1 = pickOne[p.id]
          const sel2 = pickTwo[p.id]

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
                      {p.status_label || s.label}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 'var(--body-md)',
                    color: 'var(--on-surface-variant)'
                  }}>
                    Tema: {p.topic?.title || '—'}
                  </p>
                </div>
              </div>

              {/* Área de atribuição (apenas pendentes) */}
              {isPending && (
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

                      {/* Grid de selects */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-3)'
                      }}>
                        {/* Revisor 1 */}
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

                        {/* Revisor 2 */}
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

                      {/* Botão atribuir */}
                      <button
                        onClick={() => assign(p.id)}
                        disabled={!sel1 || !sel2 || isAssigning}
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
                          cursor: !sel1 || !sel2 || isAssigning ? 'not-allowed' : 'pointer',
                          opacity: !sel1 || !sel2 || isAssigning ? 0.6 : 1,
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
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}