import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { organWorkspaceService, type OrganProcess } from '../../services/organWorkspaceService'

export default function OrganProcessesPage() {
  const [kind, setKind] = useState<'topics' | 'protocols'>('protocols')
  const [items, setItems] = useState<OrganProcess[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void organWorkspaceService.processes()
      .then(response => { setKind(response.kind); setItems(response.data) })
      .catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os processos.'))
  }, [])

  if (error) return <main className="card" style={{ padding: 'var(--space-4)', color: 'var(--error)' }}>{error}</main>
  return <main style={{ display: 'grid', gap: 'var(--space-3)' }}>
    <header><p style={{ color: 'var(--primary)', fontWeight: 'var(--font-semibold)' }}>O meu órgão</p><h1 style={{ margin: 0 }}>{kind === 'topics' ? 'Temas' : 'Protocolos'}</h1></header>
    {items.length === 0 && <section className="card" style={{ padding: 'var(--space-4)' }}>Ainda não existem {kind === 'topics' ? 'temas' : 'protocolos'} neste órgão.</section>}
    {items.map(item => <article key={item.id} className="card" style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <div><p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>{item.code ?? item.course?.code ?? 'Tema'}</p><h2 style={{ fontSize: 'var(--title-md)', margin: '4px 0' }}>{item.topic?.title ?? item.title}</h2><p style={{ color: 'var(--on-surface-variant)' }}>{item.status_label}</p></div>
        {kind === 'protocols' && <Link className="btn btn-small" to={'/organ-president/protocols/' + item.id}>Ver detalhes</Link>}
      </div>
      {item.reviewers.length > 0 && <p style={{ fontSize: 'var(--body-sm)' }}>Revisores: {item.reviewers.map(reviewer => reviewer.name || 'Sem nome').join(', ')}</p>}
    </article>)}
  </main>
}
