import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':          'Painel Principal',
  '/topic':              'O meu tema',
  '/protocol/mine':      'O meu protocolo',
  '/monograph':          'Monografia',
  '/supervision':        'Corpo Docente',
  '/reviews':            'Revisões Científicas',
  '/workload':           'A minha carga',
  '/protocols':          'Protocolos',
  '/protocols/assign':   'Atribuição de revisores',
  '/defense':            'Defesas',
  '/reports':            'Relatórios',
  '/secretary/protocols':'Gestão de submissões',
  '/admin/users':        'Utilizadores',
  '/admin/organs':       'Órgãos e áreas',
}

export function Topbar() {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const label = ROUTE_LABELS[pathname] ?? 'SGPMC ISCISA'

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      paddingLeft: 'var(--sidebar-width)',
      height: '64px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--surface-variant)',
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--gutter)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <h2 style={{
          fontSize: 'var(--title-md)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--on-surface)',
          fontFamily: 'var(--font-family)'
        }}>
          {label}
        </h2>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link
            to="/dashboard"
            style={{
              fontSize: 'var(--title-md)',
              fontWeight: pathname === '/dashboard' ? 'var(--font-bold)' : 'var(--font-regular)',
              color: pathname === '/dashboard' ? 'var(--primary)' : 'var(--on-surface-variant)',
              borderBottom: pathname === '/dashboard' ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px',
              textDecoration: 'none',
              fontFamily: 'var(--font-family)',
              transition: 'color 0.2s'
            }}
          >
            Início
          </Link>
          <Link
            to="/docs"
            style={{
              fontSize: 'var(--title-md)',
              fontWeight: pathname === '/docs' ? 'var(--font-bold)' : 'var(--font-regular)',
              color: pathname === '/docs' ? 'var(--primary)' : 'var(--on-surface-variant)',
              borderBottom: pathname === '/docs' ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px',
              textDecoration: 'none',
              fontFamily: 'var(--font-family)',
              transition: 'color 0.2s'
            }}
          >
            Documentação
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Campo de pesquisa */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Pesquisar protocolos..."
            style={{
              background: 'var(--surface-container-low)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '10px var(--space-2) 10px 40px',
              fontSize: 'var(--body-md)',
              fontFamily: 'var(--font-family)',
              width: '256px',
              outline: 'none',
              color: 'var(--on-surface)',
              transition: 'box-shadow 0.2s'
            }}
            onFocus={e => e.target.style.boxShadow = '0 0 0 2px var(--primary)'}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--on-surface-variant)',
              fontSize: '20px'
            }}
          >
            search
          </span>
        </div>

        {/* Notificações */}
        <button
          aria-label="Notificações"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'transparent',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            background: 'var(--secondary)',
            borderRadius: 'var(--radius-full)'
          }} />
        </button>

        {/* Perfil */}
        <button
          aria-label="Perfil"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: 'transparent',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" aria-hidden="true">account_circle</span>
        </button>
      </div>
    </header>
  )
}