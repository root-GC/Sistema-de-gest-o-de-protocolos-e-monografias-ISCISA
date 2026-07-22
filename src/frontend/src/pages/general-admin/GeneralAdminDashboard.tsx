// src/pages/general-admin/GeneralAdminDashboard.tsx
import { useEffect, useState } from 'react'
import { generalAdminService, type DashboardStats } from '../../services/generalAdminService'
import '../../styles/global.css'

export default function GeneralAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // Mock data enquanto a API não está pronta
      setStats({
        total_coordinators: 4,
        total_secretaries: 6,
        total_presidents: 2,
        total_courses: 10,
        total_areas: 5,
        total_organs: 4,
        total_students: 250,
        total_teachers: 35,
        recent_activities: [
          { id: 1, action: 'coordinator_assigned', description: 'Maria Silva foi nomeada coordenadora de Enfermagem', created_at: new Date().toISOString() },
          { id: 2, action: 'secretary_created', description: 'Novo secretário adicionado ao Núcleo Científico', created_at: new Date().toISOString() },
          { id: 3, action: 'president_appointed', description: 'Dr. João Santos nomeado presidente do Comité Científico', created_at: new Date().toISOString() },
          { id: 4, action: 'course_updated', description: 'Curso de Medicina atualizado', created_at: new Date().toISOString() },
        ],
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Painel do Administrador Geral</h1>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>Visão geral da Direção Científica</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Cards de Estatísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatCard icon="person_check" label="Coordenadores" count={stats?.total_coordinators || 0} color="var(--primary)" />
        <StatCard icon="assignment" label="Secretários" count={stats?.total_secretaries || 0} color="var(--tertiary)" />
        <StatCard icon="shield" label="Presidentes" count={stats?.total_presidents || 0} color="var(--secondary)" />
        <StatCard icon="school" label="Cursos" count={stats?.total_courses || 0} color="var(--primary)" />
        <StatCard icon="science" label="Áreas Científicas" count={stats?.total_areas || 0} color="var(--tertiary)" />
        <StatCard icon="account_balance" label="Órgãos" count={stats?.total_organs || 0} color="var(--secondary)" />
        <StatCard icon="group" label="Estudantes" count={stats?.total_students || 0} color="var(--primary)" />
        <StatCard icon="school" label="Docentes" count={stats?.total_teachers || 0} color="var(--tertiary)" />
      </div>

      {/* Atividades Recentes */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Atividades Recentes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {(stats?.recent_activities || []).map(activity => (
          <div key={activity.id} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>history</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', margin: 0 }}>{activity.description}</p>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                {new Date(activity.created_at).toLocaleString('pt-MZ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ width: '24px', height: '24px', border: '3px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ padding: 'var(--space-2) var(--space-3)', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', fontSize: 'var(--body-md)' }}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', border: `1px solid ${color}` }}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color, marginBottom: 'var(--space-1)' }}>{icon}</span>
      <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0 }}>{count}</p>
      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}