// src/pages/general-admin/GeneralAdminDashboard.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { generalAdminService, type DashboardStats } from '../../services/generalAdminService'
import '../../styles/global.css'

export default function GeneralAdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    try {
      // ⚠️ Mock data enquanto a API (rota dashboard) não existe
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
          { id: 1, action: 'coordinator_assigned', description: 'Maria Silva foi nomeada coordenadora de Enfermagem', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, action: 'secretary_created', description: 'Novo secretário adicionado ao Núcleo Científico', created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 3, action: 'president_appointed', description: 'Dr. João Santos nomeado presidente do Comité Científico', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 4, action: 'course_updated', description: 'Curso de Medicina atualizado', created_at: new Date(Date.now() - 172800000).toISOString() },
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
      
      {/* Cabeçalho com info do Admin */}
      <div style={{
        background: 'var(--surface-container-low)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        border: '1px solid var(--outline-variant)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--primary-container)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-primary-container)', fontSize: '28px' }}>
              shield_person
            </span>
          </div>
          
          {/* Nome e cargo */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ 
              fontSize: 'var(--label-sm)', 
              background: 'var(--tertiary-container)', 
              color: 'var(--on-tertiary-container)', 
              padding: '2px 10px', 
              borderRadius: 'var(--radius-full)',
              fontWeight: 'var(--font-medium)'
            }}>
              Administrador Geral
            </span>
            <h1 style={{ 
              fontSize: 'var(--headline-lg)', 
              fontWeight: 'var(--font-semibold)', 
              margin: 'var(--space-1) 0 0 0',
              color: 'var(--on-surface)'
            }}>
              {user?.name || 'Administrador'}
            </h1>
            <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
              Direção Científica • {user?.email}
            </p>
          </div>

          {/* Estatísticas rápidas no cabeçalho */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-3)', 
            flexShrink: 0,
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color: 'var(--primary)', margin: 0 }}>
                {stats?.total_students || 0}
              </p>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>Estudantes</p>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color: 'var(--tertiary)', margin: 0 }}>
                {stats?.total_teachers || 0}
              </p>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>Docentes</p>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color: 'var(--secondary)', margin: 0 }}>
                {(stats?.total_coordinators || 0) + (stats?.total_secretaries || 0) + (stats?.total_presidents || 0)}
              </p>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>Gestores</p>
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Cards de Estatísticas */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--on-surface)' }}>
        Pessoal
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatCard icon="person_check" label="Coordenadores" count={stats?.total_coordinators || 0} color="var(--primary)" />
        <StatCard icon="assignment" label="Secretários" count={stats?.total_secretaries || 0} color="var(--tertiary)" />
        <StatCard icon="shield" label="Presidentes de Órgão" count={stats?.total_presidents || 0} color="var(--secondary)" />
        <StatCard icon="group" label="Estudantes" count={stats?.total_students || 0} color="var(--primary)" />
        <StatCard icon="school" label="Docentes" count={stats?.total_teachers || 0} color="var(--tertiary)" />
      </div>

      {/* Estrutura Académica */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--on-surface)' }}>
        Estrutura Académica
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <StatCard icon="account_balance" label="Órgãos" count={stats?.total_organs || 0} color="var(--primary)" />
        <StatCard icon="science" label="Áreas Científicas" count={stats?.total_areas || 0} color="var(--tertiary)" />
        <StatCard icon="menu_book" label="Cursos" count={stats?.total_courses || 0} color="var(--secondary)" />
      </div>

      {/* Atividades Recentes */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--on-surface)' }}>
        Atividades Recentes
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {(stats?.recent_activities || []).length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: 'var(--space-1)', display: 'block' }}>history</span>
            <p style={{ fontSize: 'var(--body-md)' }}>Nenhuma atividade recente</p>
          </div>
        ) : (
          (stats?.recent_activities || []).map(activity => (
            <div key={activity.id} className="card" style={{ 
              padding: 'var(--space-3) var(--space-4)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-3)' 
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--primary-container)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>history</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', margin: 0 }}>
                  {activity.description}
                </p>
                <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                  {new Date(activity.created_at).toLocaleString('pt-MZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--outline)', fontSize: '20px' }}>chevron_right</span>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span style={{ 
        width: '24px', height: '24px', 
        border: '3px solid var(--outline-variant)', 
        borderTopColor: 'var(--primary)', 
        borderRadius: '50%', 
        animation: 'spin 0.8s linear infinite' 
      }} />
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div style={{ 
      padding: 'var(--space-2) var(--space-3)', 
      marginBottom: 'var(--space-4)', 
      borderRadius: 'var(--radius-lg)', 
      background: type === 'error' ? 'var(--error-container)' : 'var(--primary-container)', 
      color: type === 'error' ? 'var(--on-error-container)' : 'var(--on-primary-container)', 
      fontSize: 'var(--body-md)' 
    }}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', border: `1px solid ${color}` }}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color, marginBottom: 'var(--space-1)' }}>
        {icon}
      </span>
      <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0 }}>
        {count}
      </p>
      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 'var(--space-1) 0 0' }}>
        {label}
      </p>
    </div>
  )
}