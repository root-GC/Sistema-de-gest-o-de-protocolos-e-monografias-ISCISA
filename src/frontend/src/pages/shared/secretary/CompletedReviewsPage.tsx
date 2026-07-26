// src/pages/secretary/CompletedReviewsPage.tsx
import { useEffect, useState } from 'react'
import '../../../styles/global.css'

type TabType = 'topics' | 'protocols' | 'monographs'

interface Review {
  reviewer: string
  decision: string
  comment: string
  date: string
}

interface CompletedItem {
  id: number
  type: 'topic' | 'protocol' | 'monograph'
  code: string
  title: string
  studentName: string
  status: string
  statusLabel: string
  reviews: Review[]
  submittedAt?: string
}

export default function CompletedReviewsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('topics')
  const [items, setItems] = useState<CompletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [activeTab])

  async function loadData() {
    setLoading(true); setError(null)
    
    // Mock data
    const mockItems: CompletedItem[] = [
      { 
        id: 1, type: 'topic', code: '', 
        title: 'Impacto da malária na saúde infantil', 
        studentName: 'Sofia Estudante', status: 'topic_in_review', statusLabel: 'Em Revisão', 
        reviews: [{ reviewer: 'Dr. Armando Macuácua', decision: 'Aprovado', comment: 'Tema relevante e bem fundamentado. Metodologia adequada aos objetivos propostos.', date: '2024-03-15' }], 
        submittedAt: '2024-03-10' 
      },
      { 
        id: 2, type: 'topic', code: '', 
        title: 'Estudo sobre desnutrição infantil em zonas rurais', 
        studentName: 'Carlos Mavie', status: 'topic_in_review', statusLabel: 'Em Revisão', 
        reviews: [{ reviewer: 'Dra. Carla Mondlane', decision: 'Rejeitado', comment: 'O tema precisa de maior delimitação e foco. Rever objetivos.', date: '2024-03-18' }], 
        submittedAt: '2024-03-12' 
      },
      { 
        id: 3, type: 'protocol', code: 'PTM0001E', 
        title: 'Protocolo de investigação sobre HIV/SIDA', 
        studentName: 'Sofia Estudante', status: 'protocol_in_review_nucleo', statusLabel: 'Em Revisão', 
        reviews: [
          { reviewer: 'Dr. Armando Macuácua', decision: 'Aprovado', comment: 'Protocolo bem estruturado e metodologia rigorosa.', date: '2024-03-20' }, 
          { reviewer: 'Dra. Carla Mondlane', decision: 'Rejeitado', comment: 'Necessita de ajustes na secção ética e consentimento informado.', date: '2024-03-21' }
        ], 
        submittedAt: '2024-03-15' 
      },
      { 
        id: 4, type: 'protocol', code: 'PTM0002E', 
        title: 'Avaliação de políticas de saúde pública', 
        studentName: 'Ana Tembe', status: 'protocol_in_review_comite_cientifico', statusLabel: 'Em Revisão (CC)', 
        reviews: [
          { reviewer: 'Prof. Doutor José Chissano', decision: 'Aprovado', comment: 'Excelente fundamentação teórica.', date: '2024-03-25' }, 
          { reviewer: 'Dr. Pedro Nkosi', decision: 'Aprovado', comment: 'Metodologia adequada e objectivos claros.', date: '2024-03-26' }
        ], 
        submittedAt: '2024-03-20' 
      },
    ]

    const typeMap: Record<TabType, string> = { topics: 'topic', protocols: 'protocol', monographs: 'monograph' }
    setItems(mockItems.filter(i => i.type === typeMap[activeTab]))
    setLoading(false)
  }

  function toggleExpand(id: string) { setExpandedId(expandedId === id ? null : id) }

  async function handleReturnToStudent(item: CompletedItem) {
    setActingId(`${item.type}-${item.id}`)
    try {
      // await evaluationService.returnToStudent(item.type, item.id)
      setSuccessMessage(`${item.code || item.title} devolvido ao estudante com parecer`)
      setTimeout(() => setSuccessMessage(null), 3000)
      loadData()
    } catch (e) { setError((e as Error).message) } finally { setActingId(null) }
  }

  async function handleMarkHarmonization(item: CompletedItem) {
    setActingId(`${item.type}-${item.id}`)
    try {
      // await harmonizationService.create(item.type, item.id)
      setSuccessMessage(`Harmonização marcada para ${item.code}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (e) { setError((e as Error).message) } finally { setActingId(null) }
  }

  if (loading) return <Loader />

  const tabs = [
    { id: 'topics' as TabType, label: 'Temas', icon: 'lightbulb', count: items.filter(i => i.type === 'topic').length },
    { id: 'protocols' as TabType, label: 'Protocolos', icon: 'description', count: items.filter(i => i.type === 'protocol').length },
    { id: 'monographs' as TabType, label: 'Monografias', icon: 'book', count: items.filter(i => i.type === 'monograph').length },
  ]

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Revisões Concluídas</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          {activeTab === 'topics' ? 'Veja o parecer e devolva ao estudante' : 'Veja os pareceres e marque harmonização se necessário'}
        </p>
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
          <EmptyState message={`Nenhuma revisão concluída para ${activeTab === 'topics' ? 'temas' : activeTab === 'protocols' ? 'protocolos' : 'monografias'}`} />
        ) : items.map(item => {
          const itemKey = `${item.type}-${item.id}`
          const isExpanded = expandedId === itemKey
          const allApproved = item.reviews.every(r => r.decision === 'Aprovado')
          const hasDivergence = item.reviews.length === 2 && !allApproved && !item.reviews.every(r => r.decision === 'Rejeitado')

          return (
            <div key={itemKey} className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              {/* Header clicável */}
              <div onClick={() => toggleExpand(itemKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '4px' }}>
                    {item.code && <h3 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>{item.code}</h3>}
                    <span style={{ fontSize: 'var(--label-sm)', padding: '2px 8px', borderRadius: 'var(--radius-full)', 
                      background: hasDivergence ? 'var(--tertiary-container)' : allApproved ? 'var(--primary-container)' : 'var(--error-container)', 
                      color: hasDivergence ? 'var(--on-tertiary-container)' : allApproved ? 'var(--on-primary-container)' : 'var(--on-error-container)' }}>
                      {hasDivergence ? 'Divergência' : allApproved ? 'Consenso' : 'Rejeitado'}
                    </span>
                    {/* Badge do tipo */}
                    <span style={{ fontSize: 'var(--label-sm)', padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                      {activeTab === 'topics' ? '1 revisor' : '2 revisores'}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                  <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>person</span>
                    {item.studentName}
                    {item.submittedAt && <span style={{ marginLeft: 'var(--space-2)' }}>• Submetido: {item.submittedAt}</span>}
                  </p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {/* Conteúdo expandido */}
              {isExpanded && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {/* Pareceres */}
                  <p style={{ fontSize: 'var(--label-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>
                    Parecer{activeTab !== 'topics' ? 'es' : ''} do{activeTab !== 'topics' ? 's' : ''} revisor{activeTab !== 'topics' ? 'es' : ''}
                  </p>
                  {item.reviews.map((review, i) => (
                    <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>person_check</span>
                          <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{review.reviewer}</p>
                        </div>
                        <span style={{ fontSize: 'var(--label-sm)', padding: '4px 10px', borderRadius: 'var(--radius-full)', 
                          background: review.decision === 'Aprovado' ? 'var(--primary-container)' : 'var(--error-container)', 
                          color: review.decision === 'Aprovado' ? 'var(--on-primary-container)' : 'var(--on-error-container)',
                          fontWeight: 'var(--font-medium)' }}>
                          {review.decision}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 0, fontStyle: 'italic', padding: 'var(--space-2)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)' }}>
                        "{review.comment}"
                      </p>
                      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--outline)', margin: 'var(--space-1) 0 0' }}>{review.date}</p>
                    </div>
                  ))}

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-1)' }}>
                    {/* Temas: só botão devolver */}
                    {activeTab === 'topics' && (
                      <button onClick={() => handleReturnToStudent(item)} disabled={actingId === itemKey} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', opacity: actingId === itemKey ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        {actingId === itemKey ? <><span style={{ width: '14px', height: '14px', border: '2px solid var(--on-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> A devolver...</> : <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment_return</span> Devolver ao Estudante</>}
                      </button>
                    )}
                    {/* Protocolos: botão harmonização (se divergência) + botão devolver (se consenso) */}
                    {activeTab !== 'topics' && hasDivergence && (
                      <button onClick={() => handleMarkHarmonization(item)} disabled={actingId === itemKey} className="btn" style={{ padding: '10px 20px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', opacity: actingId === itemKey ? 0.7 : 1, background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', border: '1px solid var(--tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>balance</span> Marcar Harmonização
                      </button>
                    )}
                    {activeTab !== 'topics' && allApproved && (
                      <button onClick={() => handleReturnToStudent(item)} disabled={actingId === itemKey} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', borderRadius: 'var(--radius-lg)', opacity: actingId === itemKey ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment_return</span> Devolver ao Estudante
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