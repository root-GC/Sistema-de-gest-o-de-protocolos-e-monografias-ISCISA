import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { scientificDirectionService, type DirectionOrgan, type DirectionProcessPage } from '../../services/scientificDirectionService'
import './scientificDirection.css'

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Sem data' }

export default function ScientificDirectionOrganPage() {
  const { organId } = useParams()
  const [params, setParams] = useSearchParams()
  const [organ, setOrgan] = useState<DirectionOrgan | null>(null)
  const [page, setPage] = useState<DirectionProcessPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(params.get('q') ?? '')
  const status = params.get('status') ?? ''
  const id = Number(organId)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const [dashboard, processes] = await Promise.all([
        scientificDirectionService.dashboard(),
        scientificDirectionService.processes(id, { status: status || undefined, q: params.get('q') || undefined, page: Number(params.get('page') || 1) }),
      ])
      setOrgan(dashboard.organs.find(item => item.id === id) ?? null)
      setPage(processes)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar este órgão.') }
  }, [id, params, status])

  useEffect(() => {
    const requestId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(requestId)
  }, [load])
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next)
  }
  const submitSearch = (event: FormEvent) => { event.preventDefault(); update({ q: query || null, page: null }) }

  if (!organ && !error) return <main className="direction-loading" aria-live="polite">A carregar órgão…</main>
  if (error) return <main className="direction-error" role="alert"><strong>Não foi possível carregar o órgão.</strong><span>{error}</span><button type="button" className="btn btn-primary" onClick={() => void load()}>Tentar novamente</button></main>
  if (!organ || !page) return null
  const label = page.kind === 'topics' ? 'Temas' : 'Protocolos'

  return <main className="direction-workspace" aria-labelledby="direction-organ-title">
    <header className="direction-header"><div><Link className="direction-eyebrow" to="/general-admin">Direção Científica</Link><h1 id="direction-organ-title">{organ.name}</h1><p>{label}, revisões e atividade institucional dos últimos 12 meses.</p></div><Link className="btn btn-outline" to="/general-admin"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Voltar ao painel</Link></header>
    <section className="direction-summary-grid" aria-label="Resumo do órgão"><Metric label={label} value={organ.processes} /><Metric label="Taxa de avaliação" value={organ.review_rate === null ? 'Sem dados' : `${organ.review_rate}%`} /><Metric label="Duração média" value={organ.average_duration_days === null ? 'Sem dados' : `${organ.average_duration_days} dias`} />{organ.type !== 'nucleus' && <Metric label="Reuniões" value={organ.meetings.total} />}</section>
    <form className="direction-toolbar" onSubmit={submitSearch}><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Pesquisar ${label.toLowerCase()}`} aria-label={`Pesquisar ${label.toLowerCase()}`} /><select value={status} onChange={event => update({ status: event.target.value || null, page: null })} aria-label="Filtrar por estado"><option value="">Todos os estados</option><option value="pending">Pendentes</option><option value="in_review">Em revisão</option><option value="decided">Decididos</option></select><button type="submit" className="btn btn-outline"><span className="material-symbols-outlined" aria-hidden="true">search</span>Pesquisar</button></form>
    <section className="direction-process-list" aria-label={`Lista de ${label.toLowerCase()}`}>
      {page.data.length === 0 ? <div className="direction-loading">Não há {label.toLowerCase()} para estes filtros.</div> : page.data.map(item => <Link key={item.id} className="direction-process-row" to={`/general-admin/organs/${organ.id}/${item.kind}/${item.id}`}><div><p>{item.code || item.course?.code || 'Tema'} · {item.student?.name || 'Estudante não identificado'} · {formatDate(item.submitted_at)}</p><h3>{item.title}</h3><p>{item.reviewers.length ? `Revisores: ${item.reviewers.map(reviewer => reviewer.name || 'Sem nome').join(', ')}` : 'Sem revisores atribuídos'}</p></div><span className="direction-badge">{item.status_label}</span></Link>)}
    </section>
    {page.meta.last_page > 1 && <nav className="direction-file-actions" aria-label="Paginação"><button type="button" className="btn btn-outline" disabled={page.meta.current_page === 1} onClick={() => update({ page: String(page.meta.current_page - 1) })}>Anterior</button><span>{page.meta.current_page} de {page.meta.last_page}</span><button type="button" className="btn btn-outline" disabled={page.meta.current_page === page.meta.last_page} onClick={() => update({ page: String(page.meta.current_page + 1) })}>Seguinte</button></nav>}
  </main>
}

function Metric({ label, value }: { label: string; value: number | string }) { return <article className="direction-metric"><div><span>{label}</span><strong>{value}</strong></div></article> }
