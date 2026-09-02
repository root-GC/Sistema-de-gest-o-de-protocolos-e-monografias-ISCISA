import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { scientificDirectionService, type ScientificDirectionDashboard } from '../../services/scientificDirectionService'
import './scientificDirection.css'

function number(value?: number | null, suffix = '') { return value === null || value === undefined ? 'Sem dados' : `${value}${suffix}` }
function organKind(type: string) { return type === 'nucleus' ? 'Núcleo Científico' : type === 'scientific_committee' ? 'Comité Científico' : 'Comité de Bioética' }

export default function GeneralAdminDashboard() {
  const [data, setData] = useState<ScientificDirectionDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    setError(null)
    try { setData(await scientificDirectionService.dashboard()) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar a atividade dos órgãos.') }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])
  if (!data && !error) return <main className="direction-loading" aria-live="polite">A carregar atividade dos órgãos…</main>
  if (error) return <main className="direction-error" role="alert"><strong>Não foi possível carregar o painel.</strong><span>{error}</span><button type="button" className="btn btn-primary" onClick={() => void load()}>Tentar novamente</button></main>
  if (!data) return null

  return <main className="direction-workspace" aria-labelledby="direction-title">
    <header className="direction-header">
      <div><p className="direction-eyebrow">Direção Científica</p><h1 id="direction-title">Atividade dos Órgãos</h1><p>Visão consolidada de Núcleos, Comité Científico e CIBS.</p></div>
      <span className="direction-period"><span className="material-symbols-outlined" aria-hidden="true">date_range</span>{data.period.label}</span>
    </header>

    <section className="direction-summary-grid" aria-label="Resumo geral">
      <Metric icon="account_tree" label="Processos recebidos" value={number(data.summary.processes)} />
      <Metric icon="event" label="Reuniões" value={number(data.summary.meetings)} />
      <Metric icon="fact_check" label="Avaliações submetidas" value={number(data.summary.review_rate, '%')} />
      <Metric icon="schedule" label="Duração média" value={number(data.summary.average_duration_days, ' dias')} />
    </section>

    <section className="direction-section" aria-labelledby="direction-organs-title">
      <div className="direction-section__header"><div><p className="direction-eyebrow">Acompanhamento institucional</p><h2 id="direction-organs-title">Órgãos</h2></div><span>{data.organs.length} órgãos ativos</span></div>
      <div className="direction-organ-grid">
        {data.organs.map(organ => <Link key={organ.id} to={`/general-admin/organs/${organ.id}`} className="direction-organ-card" aria-label={`Abrir atividade de ${organ.name}`}>
          <div className="direction-organ-card__header"><div><span className="direction-organ-card__kind">{organKind(organ.type)}</span><h3>{organ.name}</h3></div><span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></div>
          <div className="direction-organ-card__metrics"><Metric label={organ.kind === 'topics' ? 'Temas' : 'Protocolos'} value={number(organ.processes)} compact /><Metric label="Taxa de avaliação" value={number(organ.review_rate, '%')} compact /><Metric label="Duração média" value={number(organ.average_duration_days, ' dias')} compact /></div>
          <div className="direction-rate"><span>Avaliações submetidas</span><strong>{number(organ.review_rate, '%')}</strong><div aria-label={`Taxa de avaliação ${number(organ.review_rate, '%')}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={organ.review_rate ?? undefined}><i style={{ width: `${organ.review_rate ?? 0}%` }} /></div></div>
          <div className="direction-state-list"><span>Pendentes <strong>{organ.states.pending ?? 0}</strong></span><span>Em revisão <strong>{organ.states.in_review ?? 0}</strong></span><span>Decididos <strong>{organ.states.decided ?? 0}</strong></span>{organ.type !== 'nucleus' && <span>Reuniões <strong>{organ.meetings.total}</strong></span>}</div>
        </Link>)}
      </div>
    </section>
  </main>
}

function Metric({ icon, label, value, compact = false }: { icon?: string; label: string; value: string; compact?: boolean }) {
  return <article className={compact ? 'direction-metric direction-metric--compact' : 'direction-metric'}>{icon && <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>}<div><span>{label}</span><strong>{value}</strong></div></article>
}
