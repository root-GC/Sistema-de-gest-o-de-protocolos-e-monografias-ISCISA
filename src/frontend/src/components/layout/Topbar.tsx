// src/components/layout/Topbar.tsx
import { useLocation } from 'react-router-dom'
import { RoleSwitcher } from '../auth/RoleSwitcher'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Painel Principal',
  '/topic': 'O meu tema',
  '/protocol/mine': 'O meu protocolo',
  '/monograph': 'Monografia',
  '/supervision': 'Corpo Docente',
  '/supervision/pending': 'Aprovar submissões',
  '/reviews': 'Revisões Científicas',
  '/reviews/history': 'Histórico de Revisões',
  '/workload': 'A minha carga',
  '/protocols': 'Protocolos',
  '/protocols/assign': 'Atribuição de revisores',
  '/defense': 'Defesas',
  '/reports': 'Relatórios',
  '/secretary/protocols': 'Gestão de submissões',
  '/admin/users': 'Utilizadores',
  '/admin/organs': 'Órgãos e áreas',
  '/agenda': 'Agenda',
}

interface TopbarProps {
  onMenuClick: () => void
  sidebarExpanded: boolean
  isMobile: boolean
  mobileOpen: boolean
}

export function Topbar({ onMenuClick, sidebarExpanded, isMobile, mobileOpen }: TopbarProps) {
  const { pathname } = useLocation()
  const label = ROUTE_LABELS[pathname] ?? 'SGPMC ISCISA'

  const leftPadding = isMobile ? '0' : sidebarExpanded ? 'var(--sidebar-width)' : '72px'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      paddingLeft: leftPadding,
      height: '64px', background: 'var(--surface)',
      borderBottom: '1px solid var(--surface-variant)',
      zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingRight: 'var(--gutter)',
      transition: 'padding-left 0.25s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        {/* Botão toggle */}
        <button
          onClick={onMenuClick}
          aria-label={sidebarExpanded || mobileOpen ? 'Recolher menu' : 'Expandir menu'}
          style={{
            background: 'none', border: 'none', color: 'var(--on-surface-variant)',
            cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            {isMobile ? (mobileOpen ? 'close' : 'menu') : (sidebarExpanded ? 'menu_open' : 'menu')}
          </span>
        </button>

        <h2 style={{
          fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)',
          color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{label}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
        <RoleSwitcher />
        <button className="topbar-icon-action" aria-label="Notificações" style={{
          width: '40px', height: '40px', borderRadius: 'var(--radius-full)', border: 'none',
          background: 'transparent', color: 'var(--on-surface-variant)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
        }}>
          <span className="material-symbols-outlined">notifications</span>
          <span style={{
            position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px',
            background: 'var(--secondary)', borderRadius: 'var(--radius-full)'
          }} />
        </button>
        <button className="topbar-icon-action" aria-label="Perfil" style={{
          width: '40px', height: '40px', borderRadius: 'var(--radius-full)', border: 'none',
          background: 'transparent', color: 'var(--on-surface-variant)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  )
}
