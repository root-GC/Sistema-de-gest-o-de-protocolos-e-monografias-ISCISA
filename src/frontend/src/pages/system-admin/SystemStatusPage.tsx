// src/pages/system-admin/SystemStatusPage.tsx
import { useEffect, useState, useCallback } from 'react'
import '../../styles/global.css'

// ============================================================
// TIPOS
// ============================================================
interface SystemMetrics {
  cpu: {
    usage_percent: number
    cores: number
    model: string
  }
  memory: {
    total_gb: number
    used_gb: number
    usage_percent: number
    available_gb: number
  }
  disk: {
    total_gb: number
    used_gb: number
    usage_percent: number
    free_gb: number
  }
  uptime: {
    days: number
    hours: number
    minutes: number
    seconds: number
    formatted: string
  }
  requests: {
    total: number
    per_minute: number
    avg_response_time_ms: number
    error_rate_percent: number
  }
  database: {
    connections_active: number
    connections_idle: number
    connections_max: number
    query_avg_time_ms: number
    size_mb: number
  }
  cache: {
    hits_percent: number
    misses: number
    size_mb: number
  }
  queue: {
    pending: number
    processing: number
    failed: number
  }
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime_formatted: string
  response_time_ms: number
  last_checked: string
}

interface RecentLog {
  id: number
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
  service: string
}

// ============================================================
// MOCK DATA
// ============================================================
function generateMockMetrics(): SystemMetrics {
  return {
    cpu: {
      usage_percent: Math.floor(Math.random() * 40) + 10,
      cores: 8,
      model: 'Intel Xeon E5-2680 v4 @ 2.40GHz',
    },
    memory: {
      total_gb: 32,
      used_gb: Math.floor(Math.random() * 16) + 8,
      usage_percent: Math.floor(Math.random() * 40) + 30,
      available_gb: 0,
    },
    disk: {
      total_gb: 500,
      used_gb: Math.floor(Math.random() * 200) + 100,
      usage_percent: Math.floor(Math.random() * 30) + 20,
      free_gb: 0,
    },
    uptime: {
      days: 15,
      hours: 8,
      minutes: 32,
      seconds: 45,
      formatted: '15d 8h 32m',
    },
    requests: {
      total: 125000 + Math.floor(Math.random() * 5000),
      per_minute: Math.floor(Math.random() * 30) + 10,
      avg_response_time_ms: Math.floor(Math.random() * 100) + 50,
      error_rate_percent: Math.random() * 2,
    },
    database: {
      connections_active: Math.floor(Math.random() * 10) + 2,
      connections_idle: Math.floor(Math.random() * 5),
      connections_max: 50,
      query_avg_time_ms: Math.floor(Math.random() * 20) + 5,
      size_mb: Math.floor(Math.random() * 500) + 200,
    },
    cache: {
      hits_percent: 85 + Math.floor(Math.random() * 10),
      misses: Math.floor(Math.random() * 100),
      size_mb: Math.floor(Math.random() * 100) + 50,
    },
    queue: {
      pending: Math.floor(Math.random() * 5),
      processing: Math.floor(Math.random() * 3),
      failed: Math.random() > 0.9 ? 1 : 0,
    },
  }
}

function generateMockServices(): ServiceStatus[] {
  return [
    { name: 'API Server', status: 'healthy', uptime_formatted: '15d 8h', response_time_ms: 45, last_checked: new Date().toISOString() },
    { name: 'Base de Dados (PostgreSQL)', status: 'healthy', uptime_formatted: '15d 8h', response_time_ms: 12, last_checked: new Date().toISOString() },
    { name: 'Redis Cache', status: 'healthy', uptime_formatted: '15d 8h', response_time_ms: 3, last_checked: new Date().toISOString() },
    { name: 'Queue Worker', status: Math.random() > 0.8 ? 'degraded' : 'healthy', uptime_formatted: '15d 7h', response_time_ms: 28, last_checked: new Date().toISOString() },
    { name: 'Armazenamento (S3/MinIO)', status: 'healthy', uptime_formatted: '15d 8h', response_time_ms: 89, last_checked: new Date().toISOString() },
    { name: 'OnlyOffice Server', status: Math.random() > 0.9 ? 'down' : 'healthy', uptime_formatted: '10d 4h', response_time_ms: 156, last_checked: new Date().toISOString() },
  ]
}

function generateMockLogs(): RecentLog[] {
  const templates = [
    { level: 'info' as const, service: 'API', message: 'Request GET /api/v1/protocols concluído em 45ms' },
    { level: 'info' as const, service: 'Auth', message: 'Login bem-sucedido: estudante@iscisa.ac.mz' },
    { level: 'warning' as const, service: 'Queue', message: 'Fila de emails com 15 itens pendentes' },
    { level: 'info' as const, service: 'DB', message: 'Backup automático concluído com sucesso' },
    { level: 'error' as const, service: 'OnlyOffice', message: 'Timeout ao conectar ao editor (tentativa 2/3)' },
    { level: 'info' as const, service: 'Cache', message: 'Cache limpo para chave: organs:list' },
    { level: 'critical' as const, service: 'Storage', message: 'Espaço em disco abaixo de 10% no volume /data' },
    { level: 'info' as const, service: 'API', message: 'Novo protocolo submetido: PTM00042E' },
  ]
  
  return templates.map((t, i) => ({
    ...t,
    id: i + 1,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
  }))
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function SystemStatusPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>(generateMockMetrics())
  const [services, setServices] = useState<ServiceStatus[]>(generateMockServices())
  const [logs, setLogs] = useState<RecentLog[]>(generateMockLogs())
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshData = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setMetrics(generateMockMetrics())
      setServices(generateMockServices())
      setLogs(generateMockLogs())
      setLastUpdated(new Date())
      setRefreshing(false)
    }, 500)
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(refreshData, 10000) // 10 segundos
    return () => clearInterval(interval)
  }, [autoRefresh, refreshData])

  // Corrigir valores calculados
  metrics.memory.available_gb = Math.round((metrics.memory.total_gb - metrics.memory.used_gb) * 10) / 10
  metrics.disk.free_gb = Math.round((metrics.disk.total_gb - metrics.disk.used_gb) * 10) / 10

  const statusColors = {
    healthy: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)', dot: 'var(--primary)', label: 'Saudável' },
    degraded: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', dot: 'var(--tertiary)', label: 'Degradado' },
    down: { bg: 'var(--error-container)', color: 'var(--on-error-container)', dot: 'var(--error)', label: 'Indisponível' },
  }

  const logLevelColors: Record<string, { bg: string; color: string }> = {
    info: { bg: 'var(--primary-container)', color: 'var(--on-primary-container)' },
    warning: { bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' },
    error: { bg: 'var(--error-container)', color: 'var(--on-error-container)' },
    critical: { bg: '#4a0000', color: '#ffdad6' },
  }

  function getUsageColor(percent: number): string {
    if (percent > 90) return 'var(--error)'
    if (percent > 70) return 'var(--tertiary)'
    return 'var(--primary)'
  }

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Estado do Sistema</h1>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
            Monitorização em tempo real • Atualizado: {lastUpdated.toLocaleTimeString('pt-MZ')}
            {autoRefresh && ' • Auto-refresh: 10s'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--label-md)', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh
          </label>
          <button onClick={refreshData} disabled={refreshing} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: '10px 16px',
            background: 'var(--primary)', color: 'var(--on-primary)', border: 'none',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontSize: 'var(--body-md)',
            fontWeight: 'var(--font-semibold)', fontFamily: 'var(--font-family)', opacity: refreshing ? 0.7 : 1
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Status Global */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatusOverviewCard
          label="Serviços Online"
          value={`${services.filter(s => s.status === 'healthy').length}/${services.length}`}
          icon="cloud_done"
          color="var(--primary)"
        />
        <StatusOverviewCard
          label="Tempo de Resposta"
          value={`${metrics.requests.avg_response_time_ms}ms`}
          icon="speed"
          color={metrics.requests.avg_response_time_ms > 200 ? 'var(--tertiary)' : 'var(--primary)'}
        />
        <StatusOverviewCard
          label="Erros (última hora)"
          value={`${metrics.requests.error_rate_percent.toFixed(1)}%`}
          icon="error"
          color={metrics.requests.error_rate_percent > 5 ? 'var(--error)' : 'var(--primary)'}
        />
        <StatusOverviewCard
          label="Uptime"
          value={metrics.uptime.formatted}
          icon="schedule"
          color="var(--primary)"
        />
      </div>

      {/* Métricas do Servidor */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Recursos do Servidor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <MetricCard
          label="CPU"
          icon="memory"
          usagePercent={metrics.cpu.usage_percent}
          detail={`${metrics.cpu.cores} cores • ${metrics.cpu.model}`}
          color={getUsageColor(metrics.cpu.usage_percent)}
        />
        <MetricCard
          label="Memória RAM"
          icon="memory_alt"
          usagePercent={metrics.memory.usage_percent}
          detail={`${metrics.memory.used_gb}GB / ${metrics.memory.total_gb}GB`}
          color={getUsageColor(metrics.memory.usage_percent)}
        />
        <MetricCard
          label="Disco"
          icon="storage"
          usagePercent={metrics.disk.usage_percent}
          detail={`${metrics.disk.used_gb}GB / ${metrics.disk.total_gb}GB • ${metrics.disk.free_gb}GB livre`}
          color={getUsageColor(metrics.disk.usage_percent)}
        />
        <MetricCard
          label="Conexões DB"
          icon="database"
          usagePercent={(metrics.database.connections_active / metrics.database.connections_max) * 100}
          detail={`${metrics.database.connections_active} ativas • ${metrics.database.connections_idle} inativas • máx ${metrics.database.connections_max}`}
          color={getUsageColor((metrics.database.connections_active / metrics.database.connections_max) * 100)}
        />
      </div>

      {/* Serviços */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Serviços</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {services.map((svc, i) => {
          const sc = statusColors[svc.status]
          return (
            <div key={i} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{svc.name}</p>
                <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                  {svc.response_time_ms}ms • Uptime: {svc.uptime_formatted}
                </p>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                borderRadius: 'var(--radius-full)', fontSize: 'var(--label-sm)', fontWeight: 'var(--font-medium)',
                background: sc.bg, color: sc.color
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                {sc.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Métricas Adicionais */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Métricas da Aplicação</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <MiniCard icon="http" label="Requests/min" value={String(metrics.requests.per_minute)} />
        <MiniCard icon="speed" label="Tempo Médio DB" value={`${metrics.database.query_avg_time_ms}ms`} />
        <MiniCard icon="cached" label="Cache Hit Rate" value={`${metrics.cache.hits_percent}%`} />
        <MiniCard icon="storage" label="Tamanho DB" value={`${metrics.database.size_mb}MB`} />
        <MiniCard icon="inventory_2" label="Cache Size" value={`${metrics.cache.size_mb}MB`} />
        <MiniCard icon="queue" label="Fila Pendente" value={String(metrics.queue.pending)} color={metrics.queue.pending > 10 ? 'var(--tertiary)' : undefined} />
        {metrics.queue.failed > 0 && (
          <MiniCard icon="error" label="Falhas na Fila" value={String(metrics.queue.failed)} color="var(--error)" />
        )}
      </div>

      {/* Logs Recentes */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Logs Recentes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
        {logs.map(log => {
          const lc = logLevelColors[log.level]
          return (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-low)',
              borderRadius: 'var(--radius-lg)', borderLeft: `3px solid ${lc.bg}`, fontSize: 'var(--label-sm)'
            }}>
              <span style={{ padding: '2px 6px', borderRadius: 'var(--radius-full)', background: lc.bg, color: lc.color, fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', fontSize: '10px', flexShrink: 0, minWidth: '50px', textAlign: 'center' }}>
                {log.level}
              </span>
              <span style={{ color: 'var(--on-surface)', flex: 1 }}>{log.message}</span>
              <span style={{ color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleTimeString('pt-MZ')}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function StatusOverviewCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', border: `1px solid ${color}` }}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color, marginBottom: 'var(--space-1)' }}>{icon}</span>
      <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

function MetricCard({ label, icon, usagePercent, detail, color }: { label: string; icon: string; usagePercent: number; detail: string; color: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color }}>{icon}</span>
          <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)' }}>{label}</span>
        </div>
        <span style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-bold)', color }}>{Math.round(usagePercent)}%</span>
      </div>
      {/* Barra de progresso */}
      <div style={{ height: '8px', background: 'var(--surface-container)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(usagePercent, 100)}%`, background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
      </div>
      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>{detail}</p>
    </div>
  )
}

function MiniCard({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '24px', color: color || 'var(--primary)', marginBottom: 'var(--space-1)' }}>{icon}</span>
      <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color: color || 'var(--on-surface)', margin: 0 }}>{value}</p>
      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}