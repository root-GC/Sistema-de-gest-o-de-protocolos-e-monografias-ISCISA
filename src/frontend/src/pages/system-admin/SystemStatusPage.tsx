import { useCallback, useEffect, useState } from 'react'
import { req } from '../../services/apiClient'
import '../../styles/global.css'

type Status = 'healthy' | 'degraded' | 'down'

interface ServiceStatus {
  name: string
  status: Status
  detail: string
  response_time_ms: number | null
}

interface SystemStatusResponse {
  checked_at: string
  services: ServiceStatus[]
  summary: Record<Status, number>
}

const styles: Record<Status, { label: string; color: string; background: string }> = {
  healthy: { label: 'Saudavel', color: 'var(--primary)', background: 'var(--primary-container)' },
  degraded: { label: 'Degradado', color: 'var(--tertiary)', background: 'var(--tertiary-container)' },
  down: { label: 'Indisponivel', color: 'var(--error)', background: 'var(--error-container)' },
}

export default function SystemStatusPage() {
  const [data, setData] = useState<SystemStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await req<SystemStatusResponse>('GET', '/api/v1/admin/system-status'))
    } catch (requestError) {
      setError((requestError as Error).message || 'Nao foi possivel consultar o estado do sistema.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = window.setInterval(() => { void refresh() }, 30_000)
    return () => window.clearInterval(interval)
  }, [autoRefresh, refresh])

  return (
    <main style={{ width: '100%', color: 'var(--on-background)' }} aria-busy={loading}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', margin: 0 }}>Estado do sistema</h1>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-1)' }}>
            {data ? `Verificado em ${new Date(data.checked_at).toLocaleString('pt-MZ')}` : 'A verificar servicos configurados.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--on-surface-variant)' }}>
            <input type="checkbox" checked={autoRefresh} onChange={event => setAutoRefresh(event.target.checked)} />
            Atualizar automaticamente
          </label>
          <button type="button" className="btn btn-primary" onClick={() => void refresh()} disabled={loading}>
            <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
            Atualizar
          </button>
        </div>
      </header>

      <p aria-live="polite" style={{ minHeight: '1.5rem', color: 'var(--error)' }}>{error}</p>

      {data && (
        <>
          <section aria-label="Resumo de servicos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {(Object.keys(styles) as Status[]).map(status => (
              <div className="card" key={status} style={{ padding: 'var(--space-2) var(--space-3)', borderColor: styles[status].color }}>
                <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>{styles[status].label}</p>
                <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', color: styles[status].color }}>{data.summary[status]}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="services-title">
            <h2 id="services-title" style={{ fontSize: 'var(--title-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>Servicos configurados</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-2)' }}>
              {data.services.map(service => {
                const style = styles[service.status]
                return (
                  <article className="card" key={service.name} style={{ padding: 'var(--space-2) var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)' }}>{service.name}</h3>
                        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--on-surface-variant)' }}>{service.detail}</p>
                      </div>
                      <span style={{ flexShrink: 0, padding: '4px 8px', borderRadius: 'var(--radius-md)', color: style.color, background: style.background, fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)' }}>{style.label}</span>
                    </div>
                    <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--on-surface-variant)', fontSize: 'var(--label-sm)' }}>
                      {service.response_time_ms === null ? 'Sem medicao de tempo.' : `${service.response_time_ms} ms`}
                    </p>
                  </article>
                )
              })}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
