// src/pages/organ-president/OrganPresidentDashboard.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/adminService'
import type { OrganInfo } from '../../services/organPresidentService'
import { getOrganConfig } from './organPresidentConfig'
import '../../styles/global.css'

interface OrganStats {
  total_members: number
  active_protocols: number
  completed_reviews: number
  pending_reviews: number
  members_by_role: Record<string, number>
}

export default function OrganPresidentDashboard() {
  const { user, profiles } = useAuth()
  const [organ, setOrgan] = useState<OrganInfo | null>(null)
  const [stats, setStats] = useState<OrganStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrganData()
  }, [])

  async function loadOrganData() {
    setLoading(true)
    setError(null)
    try {
      // Obter órgão do perfil admin do utilizador
      const adminProfile = profiles?.admin
      const organId = (adminProfile as any)?.organ_id || adminProfile?.organ?.id
      
      if (!organId) {
        setError('Órgão não encontrado no perfil.')
        setLoading(false)
        return
      }

      // Buscar dados do órgão
      const organResponse = await adminService.getOrgan(organId)
      const organData = (organResponse as any)?.data || organResponse

      // Buscar membros do órgão (todos os users com adminProfile neste órgão)
      const usersResponse = await adminService.listUsers({ role: 'admin' })
      const usersData = Array.isArray(usersResponse?.data) ? usersResponse.data : 
                        Array.isArray(usersResponse) ? usersResponse : []
      
      // Filtrar membros deste órgão
      const organMembers = usersData.filter((u: any) => {
        const adminProf = u.profiles?.admin || u.adminProfile || u.admin_profile
        return adminProf?.organ_id === organId
      })

      // Contar por role
      const membersByRole: Record<string, number> = {
        president: 1,
        vice_president: 0,
        reviewer: 0,
        member: 0,
        secretary: 0,
      }

      setOrgan({
        id: organData.id,
        name: organData.name,
        type: organData.type,
        description: organData.description,
        members_count: organMembers.length,
        president: { id: user ? Number(user.id) : 0, name: user ? user.name : '', email: user ? user.email : '' },
      })

      setStats({
        total_members: organMembers.length,
        active_protocols: 0,
        completed_reviews: 0,
        pending_reviews: 0,
        members_by_role: membersByRole,
      })

    } catch (e) {
      console.error('Erro ao carregar dados do órgão:', e)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  const config = getOrganConfig(organ?.type || '')

  const ROLE_LABELS: Record<string, string> = {
    president: 'Presidente',
    vice_president: 'Vice-Presidente',
    reviewer: 'Revisor',
    member: 'Membro',
    secretary: 'Secretário',
  }

  return (
    <div style={{ width: '100%', fontFamily: 'var(--font-family)', color: 'var(--on-background)' }}>
      
      {/* Cabeçalho do Órgão */}
      <div style={{
        background: 'var(--surface-container-low)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        border: '1px solid var(--outline-variant)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: 'var(--radius-xl)',
            background: 'var(--primary-container)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-primary-container)', fontSize: '32px' }}>account_balance</span>
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <span style={{ 
                fontSize: 'var(--label-sm)', 
                background: 'var(--tertiary-container)', 
                color: 'var(--on-tertiary-container)', 
                padding: '2px 10px', 
                borderRadius: 'var(--radius-full)',
                fontWeight: 'var(--font-medium)'
              }}>
                {config.label}
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-semibold)', margin: 0, color: 'var(--on-surface)' }}>
              {organ?.name}
            </h1>
            {organ?.description && (
              <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 'var(--space-1) 0 0 0' }}>
                {organ.description}
              </p>
            )}
          </div>
          
          {user && (
            <div style={{ 
              textAlign: 'right', 
              flexShrink: 0,
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--surface-container)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--outline-variant)'
            }}>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>Presidente</p>
              <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: '2px 0 0' }}>{user.name}</p>
              <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 0 }}>{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Estatísticas */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--on-surface)' }}>
        Visão Geral do Órgão
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 'var(--space-3)', 
        marginBottom: 'var(--space-4)' 
      }}>
        <StatCard icon="group" label="Total de Membros" value={stats?.total_members || 0} color="var(--primary)" />
        <StatCard icon="description" label="Protocolos Ativos" value={stats?.active_protocols || 0} color="var(--tertiary)" />
        <StatCard icon="check_circle" label="Revisões Concluídas" value={stats?.completed_reviews || 0} color="var(--primary)" />
        <StatCard icon="pending" label="Revisões Pendentes" value={stats?.pending_reviews || 0} color="var(--tertiary)" />
      </div>

      {/* Distribuição de Membros */}
      <h2 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--on-surface)' }}>
        Membros por Função
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 'var(--space-2)', 
        marginBottom: 'var(--space-4)' 
      }}>
        {Object.entries(stats?.members_by_role || {}).map(([role, count]) => (
          <div key={role} className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color: 'var(--primary)', margin: 0 }}>
              {count}
            </p>
            <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 'var(--space-1) 0 0' }}>
              {ROLE_LABELS[role] || role}
            </p>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', border: `1px solid ${color}` }}>
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color, marginBottom: 'var(--space-1)' }}>{icon}</span>
      <p style={{ fontSize: 'var(--headline-lg)', fontWeight: 'var(--font-bold)', color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', margin: 'var(--space-1) 0 0' }}>{label}</p>
    </div>
  )
}