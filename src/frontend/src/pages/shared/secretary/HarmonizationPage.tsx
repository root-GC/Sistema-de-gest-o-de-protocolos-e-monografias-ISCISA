// src/pages/secretary/HarmonizationPage.tsx
import { useEffect, useState } from 'react'
import '../../../styles/global.css'

type TabType = 'protocols' | 'monographs'

interface HarmonizationItem {
  id: number
  type: 'protocol' | 'monograph'
  code: string
  title: string
  studentName: string
  status: string
  statusLabel: string
  reviewerOne?: { id: number; name: string; decision?: string; comment?: string }
  reviewerTwo?: { id: number; name: string; decision?: string; comment?: string }
  harmonizedDecision?: string
  harmonizedComment?: string
  harmonizedAt?: string
  daysSinceAssignment: number
  submittedAt?: string
}

export default function HarmonizationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('protocols')
  const [items, setItems] = useState<HarmonizationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [harmonizingId, setHarmonizingId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [activeTab])

  async function loadData() {
    setLoading(true); setError(null)
    
    const mockItems: HarmonizationItem[] = [
      { id: 1, type: 'protocol', code: 'PTM0001E', title: 'Protocolo de investigação sobre HIV/SIDA', studentName: 'Sofia Estudante', status: 'protocol_in_review_nucleo', statusLabel: 'Em Revisão', reviewerOne: { id: 1, name: 'Dr. Armando Macuácua', decision: 'approved', comment: 'Protocolo bem estruturado.' }, reviewerTwo: { id: 2, name: 'Dra. Carla Mondlane', decision: 'rejected', comment: 'Necessita de ajustes éticos.' }, daysSinceAssignment: 8, submittedAt: '2024-03-15' },
      { id: 2, type: 'protocol', code: 'PTM0003E', title: 'Estudo sobre resistência antimicrobiana', studentName: 'Carlos Mavie', status: 'protocol_in_review_comite_cientifico', statusLabel: 'Em Revisão (CC)', reviewerOne: { id: 3, name: 'Prof. Doutor José Chissano', decision: 'rejected', comment: 'Metodologia fraca.' }, reviewerTwo: { id: 4, name: 'Dra. Ana Tembe', decision: 'approved', comment: 'Tema importante e atual.' }, daysSinceAssignment: 5, submittedAt: '2024-03-20' },
      { id: 3, type: 'protocol', code: 'PTM0004E', title: 'Avaliação de intervenções comunitárias', studentName: 'Ana Tembe', status: 'protocol_in_review_comite_bioetica', statusLabel: 'Em Revisão (Bioética)', reviewerOne: { id: 1, name: 'Dr. Armando Macuácua', decision: 'approved', comment: 'Aspectos éticos bem tratados.' }, reviewerTwo: { id: 5, name: 'Dr. Pedro Nkosi', decision: 'approved', comment: 'Consentimento informado adequado.' }, harmonizedDecision: 'approved', harmonizedComment: 'Após harmonização, decide-se pela aprovação com ajustes menores.', harmonizedAt: '2024-04-01', daysSinceAssignment: 12, submittedAt: '2024-03-10' },
    ]

    const typeMap: Record<TabType, string> = { protocols: 'protocol', monographs: 'monograph' }
    setItems(mockItems.filter(i => i.type === typeMap[activeTab]))
    setLoading(false)
  }

  function toggleExpand(id: string) { setExpandedId(expandedId === id ? null : id) }

  async function handleHarmonize(item: HarmonizationItem) {
    setHarmonizingId(`${item.type}-${item.id}`)
    try {
      // await harmonizationService.create(item.type, item.id)
      setSuccessMessage(`Sessão de harmonização marcada para ${item.code}`)
      setTimeout(() => setSuccessMessage(null), 3000)
      loadData()
    } catch (e) { setError((e as Error).message) } finally { setHarmonizingId(null) }
  }

  async function handleReturnWithHarmonization(item: HarmonizationItem) {
    setActingId(`${item.type}-${item.id}`)
    try {
      // await evaluationService.returnWithHarmonization(item.type, item.id)
      setSuccessMessage(`${item.code} devolvido com parecer harmonizado`)
      setTimeout(() => setSuccessMessage(null), 3000)
      loadData()
    } catch (e) { setError((e as Error).message) } finally { setActingId(null) }
  }

  function getDaysColor(days: number): string {
    if (days > 7) return 'var(--error)'
    if (days > 5) return 'var(--tertiary)'
    return 'var(--primary)'
  }

  if (loading) return <Loader />

  const tabs = [
    { id: 'protocols' as TabType, label: 'Protocolos', icon: 'description', count: items.filter(i => i.type === 'protocol').length },
    { id: 'monographs' as TabType, label: 'Monografias', icon: 'book', count: items.filter(i => i.type === 'monograph').length },
  ]

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Harmonização</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Resultado das sessões de harmonização e pareceres finais</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--outline-variant)', marginBottom: 'var(--space-4)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setExpandedId(null) }} style={{
            padding: '12px var(--space-3)', fontSize: 'var(--body-md)',
            fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'var(--font-medium)',
            border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'transparent', cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--on-surface-variant)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
            <span style={{ background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.length === 0 ? (
          <EmptyState message="Nenhum item pendente de harmonização" />
        ) : items.map(item => {
          const itemKey = `${item.type}-${item.id}`
          const isExpanded = expandedId === itemKey
          const isHarmonized = !!item.harmonizedDecision
          const needsHarmonization = item.reviewerOne?.decision && item.reviewerTwo?.decision && item.reviewerOne.decision !== item.reviewerTwo.decision

          return (
            <div key={itemKey} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              {/* Header */}
              <div onClick={() => toggleExpand(itemKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{item.code}</h3>
                    <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', 
                      background: isHarmonized ? 'var(--primary-container)' : needsHarmonization ? 'var(--tertiary-container)' : 'var(--surface-container)',
                      color: isHarmonized ? 'var(--on-primary-container)' : needsHarmonization ? 'var(--on-tertiary-container)' : 'var(--on-surface-variant)' }}>
                      {isHarmonized ? 'Harmonizado' : needsHarmonization ? 'Pendente' : 'Em revisão'}
                    </span>
                    <span style={{ fontSize: 'var(--label-sm)', color: getDaysColor(item.daysSinceAssignment) }}>
                      {item.daysSinceAssignment}d
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)', margin: 0 }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{item.studentName}</p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {/* Expandido */}
              {isExpanded && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {/* Dois revisores lado a lado */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-semibold)' }}>Revisor 1</p>
                      <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px' }}>{item.reviewerOne?.name || '—'}</p>
                      {item.reviewerOne?.decision && (
                        <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: item.reviewerOne.decision === 'approved' ? 'var(--primary-container)' : 'var(--error-container)', color: item.reviewerOne.decision === 'approved' ? 'var(--on-primary-container)' : 'var(--on-error-container)', marginBottom: 'var(--space-1)', display: 'inline-block' }}>
                          {item.reviewerOne.decision === 'approved' ? 'Aprovou' : 'Rejeitou'}
                        </span>
                      )}
                      {item.reviewerOne?.comment && <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', fontStyle: 'italic', margin: 0 }}>"{item.reviewerOne.comment}"</p>}
                    </div>
                    <div style={{ padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-semibold)' }}>Revisor 2</p>
                      <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px' }}>{item.reviewerTwo?.name || '—'}</p>
                      {item.reviewerTwo?.decision && (
                        <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: item.reviewerTwo.decision === 'approved' ? 'var(--primary-container)' : 'var(--error-container)', color: item.reviewerTwo.decision === 'approved' ? 'var(--on-primary-container)' : 'var(--on-error-container)', marginBottom: 'var(--space-1)', display: 'inline-block' }}>
                          {item.reviewerTwo.decision === 'approved' ? 'Aprovou' : 'Rejeitou'}
                        </span>
                      )}
                      {item.reviewerTwo?.comment && <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', fontStyle: 'italic', margin: 0 }}>"{item.reviewerTwo.comment}"</p>}
                    </div>
                  </div>

                  {/* Resultado da harmonização (se já feita) */}
                  {isHarmonized && (
                    <div style={{ padding: 'var(--space-3)', background: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary)', color: 'var(--on-primary-container)' }}>
                      <p style={{ fontSize: 'var(--label-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>Parecer Harmonizado</p>
                      <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                        Decisão: {item.harmonizedDecision === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </p>
                      {item.harmonizedComment && <p style={{ fontSize: 'var(--body-md)', margin: '4px 0 0', fontStyle: 'italic' }}>"{item.harmonizedComment}"</p>}
                      {item.harmonizedAt && <p style={{ fontSize: 'var(--label-sm)', opacity: 0.7, margin: '4px 0 0' }}>Harmonizado em: {item.harmonizedAt}</p>}
                    </div>
                  )}

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    {needsHarmonization && !isHarmonized && (
                      <button onClick={() => handleHarmonize(item)} disabled={harmonizingId === itemKey} className="btn" style={{ padding: '10px 20px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', opacity: harmonizingId === itemKey ? 0.7 : 1, background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', border: '1px solid var(--tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>balance</span> Marcar Harmonização
                      </button>
                    )}
                    {isHarmonized && (
                      <button onClick={() => handleReturnWithHarmonization(item)} disabled={actingId === itemKey} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', opacity: actingId === itemKey ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment_return</span> Devolver com Parecer Harmonizado
                      </button>
                    )}
                  </div>
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

function Loader() { return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div> }
function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) { return <div style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', fontSize: 'var(--body-md)' }}>{children}</div> }
function EmptyState({ message }: { message: string }) { return <div style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--outline-variant)' }}><span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: 'var(--space-2)', display: 'block' }}>folder_open</span><p>{message}</p></div> }