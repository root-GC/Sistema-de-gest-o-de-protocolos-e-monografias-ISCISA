// src/pages/WorkloadPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supervisorService, type Supervisee } from '../../services/supervisorService'
import { topicService, type Topic } from '../../services/topicService'
import { protocolService, type Protocol } from '../../services/protocolService'
import { monographService, type Monograph } from '../../services/monographService'
import { evaluationService, type EvaluationForm } from '../../services/evaluationService'
import '../../styles/global.css'

// ============================================================
// COMPONENTE
// ============================================================
export default function WorkloadPage() {
  const { roles } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Supervisor
  const [supervisees, setSupervisees] = useState<Supervisee[]>([])
  const [pendingTopics, setPendingTopics] = useState<Topic[]>([])
  const [pendingProtocols, setPendingProtocols] = useState<Protocol[]>([])
  const [pendingMonographs, setPendingMonographs] = useState<Monograph[]>([])

  // Reviewer
  const [pendingEvaluations, setPendingEvaluations] = useState<EvaluationForm[]>([])
  const [completedEvaluations, setCompletedEvaluations] = useState<EvaluationForm[]>([])

  const isSupervisor = roles.includes('supervisor')
  const isReviewer = roles.includes('reviewer')
  const isTeacher = roles.includes('teacher')
  const responsibilityLabel = [isTeacher && 'Docente', isSupervisor && 'Supervisor', isReviewer && 'Revisor']
    .filter(Boolean)
    .join(' · ')

  const loadData = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError(null)
    try {
      const promises: Promise<void>[] = []

      if (isSupervisor) {
        promises.push(
          (async () => {
            const data = await supervisorService.listSupervisees()
            setSupervisees(data.supervisees || [])
          })(),
          (async () => {
            const data = await topicService.getForSupervisor()
            setPendingTopics((data.topics || []).filter(t => t.status === 'topic_pending_supervisor'))
          })(),
          (async () => {
            const data = await protocolService.listForSupervisor()
            setPendingProtocols((data.protocols || []).filter(p =>
              p.status === 'protocol_pending_supervisor'
            ))
          })(),
          (async () => {
            try {
              const data = await monographService.list()
              setPendingMonographs((data.monographs || []).filter(m =>
                m.status === 'submetida'
              ))
            } catch { setPendingMonographs([]) }
          })()
        )
      }

      if (isReviewer) {
        promises.push(
          (async () => {
            try {
              const data = await evaluationService.listForReviewerAcrossCommittees()
              const forms = data.evaluation_forms || []
              setPendingEvaluations(
                forms.filter(f => {
                  const reviewerEval = f.reviewer_evaluations?.find(
                    re => re.status === 'pending' || re.status === 'in_progress'
                  )
                  return reviewerEval || f.status === 'pending'
                })
              )
              setCompletedEvaluations(
                forms.filter(f => {
                  return f.reviewer_evaluations?.some(
                    re => re.status === 'submitted' || re.status === 'completed'
                  )
                })
              )
            } catch { 
              setPendingEvaluations([])
              setCompletedEvaluations([])
            }
          })()
        )
      }

      await Promise.all(promises)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [isReviewer, isSupervisor])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadData])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', fontFamily: 'var(--font-family)',
        color: 'var(--on-surface-variant)', fontSize: 'var(--body-lg)', gap: 'var(--space-2)'
      }}>
        <span style={{
          width: '24px', height: '24px', border: '3px solid var(--outline-variant)',
          borderTopColor: 'var(--primary)', borderRadius: 'var(--radius-full)',
          animation: 'spin 0.8s linear infinite'
        }} />
        A carregar...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const totalPending = pendingTopics.length + pendingProtocols.length + pendingMonographs.length

  return (
    <main className="teacher-workspace teacher-workspace--workload">

      {/* Cabeçalho */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)',
            color: 'var(--on-surface)', marginBottom: 'var(--space-1)'
          }}>
            A minha carga de trabalho
          </h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Resumo das tarefas e responsabilidades actuais.
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: 'var(--primary-container)', color: 'var(--on-primary-container)',
          fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>badge</span>
          {responsibilityLabel || 'Utilizador'}
        </div>
      </div>

      {error && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)', background: 'var(--error-container)',
          color: 'var(--on-error-container)', borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
          {error}
        </div>
      )}

      {/* ==================== SUPERVISOR ==================== */}
      {isSupervisor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Cards de resumo */}
          <div className="teacher-summary-grid">
            <SummaryCard
              icon="groups"
              label="Supervisionandos"
              value={supervisees.length}
              color="var(--primary)"
              bg="var(--primary-container)"
              detail={`${supervisees.filter(s => s.phase !== 'none').length} com submissões`}
            />
            <SummaryCard
              icon="lightbulb"
              label="Temas por aprovar"
              value={pendingTopics.length}
              color="var(--tertiary)"
              bg="var(--tertiary-container)"
              urgent={pendingTopics.length > 0}
            />
            <SummaryCard
              icon="description"
              label="Protocolos por aprovar"
              value={pendingProtocols.length}
              color="var(--primary)"
              bg="var(--primary-container)"
              urgent={pendingProtocols.length > 0}
            />
            <SummaryCard
              icon="book"
              label="Monografias por aprovar"
              value={pendingMonographs.length}
              color="var(--secondary)"
              bg="var(--secondary-container)"
              urgent={pendingMonographs.length > 0}
            />
          </div>

          {/* Barra de progresso de tarefas */}
          {totalPending > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>pending_actions</span>
                Tarefas pendentes
              </h3>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
                  <span>{totalPending} tarefa{totalPending !== 1 ? 's' : ''} pendente{totalPending !== 1 ? 's' : ''}</span>
                  <span style={{ fontWeight: 'var(--font-semibold)' }}>Por fazer</span>
                </div>
                <div style={{
                  width: '100%', height: '8px', background: 'var(--surface-container-high)',
                  borderRadius: 'var(--radius-full)', overflow: 'hidden'
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, var(--tertiary), var(--primary))',
                    borderRadius: 'var(--radius-full)',
                    animation: 'progressPulse 2s ease-in-out infinite'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {pendingTopics.length > 0 && (
                  <TaskBar label="Temas" count={pendingTopics.length} total={totalPending} color="var(--tertiary)" icon="lightbulb" />
                )}
                {pendingProtocols.length > 0 && (
                  <TaskBar label="Protocolos" count={pendingProtocols.length} total={totalPending} color="var(--primary)" icon="description" />
                )}
                {pendingMonographs.length > 0 && (
                  <TaskBar label="Monografias" count={pendingMonographs.length} total={totalPending} color="var(--secondary)" icon="book" />
                )}
              </div>
            </div>
          )}

          {/* Supervisionandos em detalhe */}
          {supervisees.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>group</span>
                Estado dos supervisionandos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {supervisees.map((s, i) => (
                  <div key={s.student.id ?? i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-lg)', flexWrap: 'wrap', gap: 'var(--space-2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'var(--primary-container)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>
                          {s.student.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--body-md)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.student.name || 'Estudante'}
                        </p>
                        <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                          {s.phase_label || (s.phase === 'none' ? 'Sem submissão' : s.phase)}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 10px', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)',
                      background: s.phase === 'none' ? 'var(--surface-container-high)' :
                        s.phase === 'topic' ? 'var(--tertiary-container)' :
                        s.phase === 'protocol' ? 'var(--primary-container)' :
                        'var(--secondary-container)',
                      color: s.phase === 'none' ? 'var(--on-surface-variant)' :
                        s.phase === 'topic' ? 'var(--on-tertiary-container)' :
                        s.phase === 'protocol' ? 'var(--on-primary-container)' :
                        'var(--on-secondary-container)'
                    }}>
                      {s.phase === 'topic' ? 'Tema' : s.phase === 'protocol' ? 'Protocolo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalPending === 0 && supervisees.length === 0 && (
            <EmptyState icon="check_circle" message="Sem tarefas pendentes. Tudo em dia!" />
          )}
        </div>
      )}

      {/* ==================== REVISOR ==================== */}
      {isReviewer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Cards de resumo do revisor */}
          <div className="teacher-summary-grid">
            <SummaryCard
              icon="rate_review"
              label="Avaliações pendentes"
              value={pendingEvaluations.length}
              color="var(--tertiary)"
              bg="var(--tertiary-container)"
              urgent={pendingEvaluations.length > 0}
            />
            <SummaryCard
              icon="task_alt"
              label="Avaliações concluídas"
              value={completedEvaluations.length}
              color="var(--primary)"
              bg="var(--primary-container)"
            />
            <SummaryCard
              icon="trending_up"
              label="Taxa de conclusão"
              value={`${completedEvaluations.length + pendingEvaluations.length > 0
                ? Math.round((completedEvaluations.length / (completedEvaluations.length + pendingEvaluations.length)) * 100)
                : 0}%`}
              color="var(--primary)"
              bg="var(--surface-container)"
            />
          </div>

          {/* Avaliações pendentes */}
          {pendingEvaluations.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                color: 'var(--tertiary)'
              }}>
                <span className="material-symbols-outlined">pending_actions</span>
                Avaliações por fazer
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {pendingEvaluations.map((form, i) => (
                  <div key={form.id ?? i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-lg)', flexWrap: 'wrap', gap: 'var(--space-2)',
                    borderLeft: '4px solid var(--tertiary)'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--body-md)', margin: 0 }}>
                        {form.protocol?.code || `Formulário #${form.id}`}
                      </p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                        {form.protocol?.topic?.title || 'Sem título'}
                      </p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--outline)', marginTop: '4px' }}>
                        {form.organ} • Versão {form.version}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)',
                      background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)',
                      whiteSpace: 'nowrap'
                    }}>
                      Pendente
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimas avaliações concluídas */}
          {completedEvaluations.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{
                fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>done_all</span>
                Últimas avaliações concluídas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {completedEvaluations.slice(0, 5).map((form, i) => (
                  <div key={form.id ?? i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 14px', background: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)',
                    flexWrap: 'wrap', gap: 'var(--space-2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>check_circle</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {form.protocol?.code || `Formulário #${form.id}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)' }}>
                      {form.protocol?.topic?.title?.substring(0, 40) || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingEvaluations.length === 0 && (
            <EmptyState icon="celebration" message="Sem tarefas pendentes. Bom trabalho!" />
          )}
        </div>
      )}

      {!isSupervisor && !isReviewer && (
        <EmptyState icon="work" message="Ainda não existem responsabilidades de supervisão ou revisão atribuídas." />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </main>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function SummaryCard({ icon, label, value, color, bg, urgent, detail }: {
  icon: string
  label: string
  value: string | number
  color: string
  bg: string
  urgent?: boolean
  detail?: string
}) {
  return (
    <div className="teacher-summary-card" style={{ borderColor: urgent ? color : undefined }}>
      {urgent && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '8px', height: '8px', borderRadius: '50%',
          background: color, margin: '12px',
          animation: 'pulse 2s infinite'
        }} />
      )}
      <span className="material-symbols-outlined" aria-hidden="true" style={{ color, background: bg, borderRadius: 'var(--radius-md)', padding: '4px' }}>{icon}</span>
      <span className="teacher-summary-card__label">{label}</span>
      <strong className="teacher-summary-card__value">{value}</strong>
      {detail && <span className="teacher-summary-card__detail">{detail}</span>}
    </div>
  )
}

function TaskBar({ label, count, total, color, icon }: {
  label: string
  count: number
  total: number
  color: string
  icon: string
}) {
  const percentage = Math.round((count / total) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px', color }}>{icon}</span>
      <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', minWidth: '90px' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          width: `${percentage}%`, height: '100%',
          background: color, borderRadius: 'var(--radius-full)',
          transition: 'width 0.5s ease'
        }} />
      </div>
      <span style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color, minWidth: '30px', textAlign: 'right' }}>
        {count}
      </span>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: 'var(--space-6) var(--space-3)',
      color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)',
      borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)'
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: 'var(--space-3)', display: 'block' }}>
        {icon}
      </span>
      <p style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-medium)' }}>{message}</p>
    </div>
  )
}

// Adicionar animação pulse
const styleEl = document.createElement('style')
styleEl.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
  }
`
document.head.appendChild(styleEl)
