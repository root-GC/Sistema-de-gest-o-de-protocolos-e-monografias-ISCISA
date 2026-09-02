import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { organWorkspaceService, type OrganDashboard, type OrganWorkspaceOrgan } from '../../services/organWorkspaceService'

const labels: Record<string, string> = {
  total: 'Total no órgão',
  pending_assignment: 'Aguardam atribuição',
  in_review: 'Em revisão',
  approved: 'Aprovados',
  in_current_queue: 'Na fila atual',
  document_validation: 'Validação documental',
}

export default function OrganPresidentDashboard() {
  const [organ, setOrgan] = useState<OrganWorkspaceOrgan | null>(null)
  const [dashboard, setDashboard] = useState<OrganDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void organWorkspaceService.dashboard()
      .then(response => { setOrgan(response.organ); setDashboard(response.dashboard) })
      .catch(requestError => setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o órgão.'))
  }, [])

  if (error) return <main className="card" style={{ padding: 'var(--space-4)', color: 'var(--error)' }}>{error}</main>
  if (!organ || !dashboard) return <main style={{ padding: 'var(--space-4)' }}>A carregar atividade do órgão...</main>

  const isNucleus = organ.type === 'nucleus'
  return (
    <main style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: 'var(--primary)', fontWeight: 'var(--font-semibold)', marginBottom: '4px' }}>O meu órgão</p>
          <h1 style={{ margin: 0, fontSize: 'var(--headline-lg)' }}>{organ.name}</h1>
          {organ.description && <p style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-1)' }}>{organ.description}</p>}
        </div>
        <Link className="btn btn-primary" to="/organ-president/processes">Ver {isNucleus ? 'temas' : 'protocolos'}</Link>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {Object.entries(dashboard.summary).map(([key, value]) => (
          <article className="card" key={key} style={{ padding: 'var(--space-2) var(--space-3)' }}>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-md)' }}>{labels[key] ?? key}</p>
            <strong style={{ display: 'block', fontSize: 'var(--headline-lg)', marginTop: 'var(--space-1)' }}>{value}</strong>
          </article>
        ))}
      </section>

      <section className="card" style={{ padding: 'var(--space-3)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--title-md)' }}>Estados atuais</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {Object.entries(dashboard.statuses).map(([status, total]) => <span key={status} style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '6px 10px' }}>{status}: <strong>{total}</strong></span>)}
          {Object.keys(dashboard.statuses).length === 0 && <p style={{ color: 'var(--on-surface-variant)' }}>Sem processos registados neste órgão.</p>}
        </div>
      </section>

      <section className="card" style={{ padding: 'var(--space-3)', overflowX: 'auto' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--title-md)' }}>Desempenho dos revisores</h2>
        {dashboard.reviewer_performance.length === 0 ? <p style={{ color: 'var(--on-surface-variant)' }}>Ainda não existem atribuições neste órgão.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-2)' }}>
            <thead><tr><th style={{ textAlign: 'left' }}>Revisor</th><th>Atribuídas</th><th>Pendentes</th><th>Concluídas</th><th>Atrasadas</th><th>Média</th></tr></thead>
            <tbody>{dashboard.reviewer_performance.map(item => <tr key={item.reviewer_id}><td>{item.name ?? 'Sem nome'}</td><td style={{ textAlign: 'center' }}>{item.assigned}</td><td style={{ textAlign: 'center' }}>{item.pending}</td><td style={{ textAlign: 'center' }}>{item.completed}</td><td style={{ textAlign: 'center' }}>{item.overdue ?? 0}</td><td style={{ textAlign: 'center' }}>{item.average_completion_days === null ? '-' : item.average_completion_days + ' dias'}</td></tr>)}</tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ padding: 'var(--space-3)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--title-md)' }}>Atividade recente</h2>
        <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {dashboard.recent_activity.map(event => <div key={event.id} style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-2)' }}><strong>{event.description || event.action}</strong><p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>{event.actor?.name ?? 'Sistema'} · {new Date(event.occurred_at).toLocaleString('pt-PT')}</p></div>)}
          {dashboard.recent_activity.length === 0 && <p style={{ color: 'var(--on-surface-variant)' }}>Sem atividade registada.</p>}
        </div>
      </section>
    </main>
  )
}
