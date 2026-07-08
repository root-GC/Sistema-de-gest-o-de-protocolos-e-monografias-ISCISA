import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
// @ts-ignore
import { useMenu } from '../../hooks/useMenu'
import { useAuth } from '../../context/AuthContext'

interface MenuItem {
  id: string
  label: string
  icon: string
  route?: string
  children?: { label: string; route: string }[]
}

const ICON_MAP: Record<string, string> = {
  'ti-dashboard': 'dashboard', 'ti-school': 'school', 'ti-fitness-center': 'fitness_center',
  'ti-user-check': 'person_check', 'ti-files': 'folder_open', 'ti-event-available': 'event_available',
  'ti-users-group': 'group', 'ti-building': 'account_balance', 'ti-clipboard-list': 'assignment',
  'ti-file-description': 'description', 'ti-book': 'menu_book', 'ti-bookmark': 'bookmark',
  'ti-description': 'description', 'ti-rate-review': 'rate_review', 'ti-reports': 'analytics',
  'ti-settings': 'settings', 'ti-help': 'help', 'ti-topic': 'lightbulb', 'ti-monograph': 'menu_book',
  'ti-calendar': 'calendar_month', 'ti-notifications': 'notifications', 'ti-messages': 'chat',
  'ti-search': 'search', 'ti-filter': 'filter_list', 'ti-more': 'more_vert', 'ti-add': 'add',
  'ti-edit': 'edit', 'ti-delete': 'delete', 'ti-download': 'download', 'ti-upload': 'upload',
  'ti-print': 'print', 'ti-share': 'share', 'ti-star': 'star', 'ti-visibility': 'visibility',
  'ti-visibility-off': 'visibility_off', 'ti-lock': 'lock', 'ti-person': 'person', 'ti-mail': 'mail',
  'ti-phone': 'call', 'ti-location': 'location_on', 'ti-link': 'link', 'ti-logout': 'logout',
  'ti-warning': 'warning', 'ti-error': 'error', 'ti-check': 'check_circle', 'ti-pending': 'pending',
  'ti-schedule': 'schedule', 'ti-history': 'history', 'ti-trending-up': 'trending_up',
  'ti-trending-down': 'trending_down', 'ti-expand-more': 'expand_more', 'ti-expand-less': 'expand_less',
  'ti-chevron-right': 'chevron_right', 'ti-chevron-left': 'chevron_left', 'ti-close': 'close',
  'ti-menu': 'menu', 'ti-refresh': 'refresh', 'ti-sync': 'sync', 'ti-cloud': 'cloud',
  'ti-cloud-upload': 'cloud_upload', 'ti-cloud-download': 'cloud_download', 'ti-lightbulb': 'lightbulb',
  'ti-menu-book': 'menu_book', 'ti-inventory': 'inventory_2', 'ti-person-add': 'person_add',
  'ti-account-balance': 'account_balance', 'ti-person-check': 'person_check', 'ti-folder-open': 'folder_open',
  dashboard: 'dashboard', inicio: 'dashboard', home: 'dashboard', protocols: 'description',
  'all-protocols': 'folder_open', 'my-protocol': 'description', 'protocol-mine': 'description',
  reviews: 'rate_review', 'rate-review': 'rate_review', supervision: 'school', tutorandos: 'school',
  'my-students': 'school', reports: 'analytics', analytics: 'analytics', defense: 'event_available',
  defesas: 'event_available', assign: 'person_check', 'assign-reviewers': 'person_check',
  secretary: 'assignment', 'clipboard-list': 'assignment', 'secretary-protocols': 'assignment',
  'gestao-submissoes': 'assignment', submissions: 'assignment', users: 'group', utilizadores: 'group',
  organs: 'account_balance', 'orgaos-areas': 'account_balance', topic: 'bookmark', tema: 'bookmark',
  'meu-tema': 'bookmark', monograph: 'menu_book', monografia: 'menu_book', book: 'menu_book',
  workload: 'fitness_center', 'minha-carga': 'fitness_center', settings: 'settings',
  configuracoes: 'settings', help: 'help', suporte: 'help', profile: 'person',
  notifications: 'notifications', messages: 'chat', calendar: 'calendar_month', add: 'add',
  edit: 'edit', delete: 'delete', search: 'search', filter: 'filter_list', more: 'more_vert',
  download: 'download', upload: 'upload', print: 'print', share: 'share', bookmark: 'bookmark',
  star: 'star', visibility: 'visibility', visibility_off: 'visibility_off', lock: 'lock',
  email: 'mail', phone: 'call', location: 'location_on', link: 'link', logout: 'logout',
  warning: 'warning', error: 'error', check: 'check_circle', pending: 'pending', schedule: 'schedule',
  history: 'history', trending_up: 'trending_up', trending_down: 'trending_down',
  expand_more: 'expand_more', expand_less: 'expand_less', chevron_right: 'chevron_right',
  chevron_left: 'chevron_left', close: 'close', menu: 'menu', refresh: 'refresh', sync: 'sync',
  cloud: 'cloud', cloud_upload: 'cloud_upload', cloud_download: 'cloud_download',
  lightbulb: 'lightbulb', menu_book: 'menu_book', inventory_2: 'inventory_2', person_add: 'person_add',
  account_balance: 'account_balance', person_check: 'person_check', folder_open: 'folder_open',
  group: 'group', assignment: 'assignment', description: 'description', circle: 'circle',
}

// ============================================================
// CONTEXTO para expandir a sidebar a partir dos filhos
// ============================================================
interface SidebarContextType {
  expanded: boolean
  requestExpand: () => void
}
export const SidebarContext = { current: null as SidebarContextType | null }

interface SidebarProps {
  expanded: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onExpand: () => void
  isMobile: boolean
}

export function Sidebar({ expanded, mobileOpen, onCloseMobile, onExpand, isMobile }: SidebarProps) {
  const menu: MenuItem[] = useMenu()
  const { user, activeProfile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedMenu, setExpandedMenu] = useState<Record<string, boolean>>({})

  const reallyExpanded = isMobile ? mobileOpen : expanded

  // Expõe o contexto para os itens poderem pedir expansão
  SidebarContext.current = { expanded: reallyExpanded, requestExpand: onExpand }

  function toggleMenu(id: string) {
    if (!reallyExpanded && !isMobile) {
      onExpand()
      // Pequeno delay para expandir antes de abrir o submenu
      setTimeout(() => setExpandedMenu(prev => ({ ...prev, [id]: !prev[id] })), 100)
      return
    }
    setExpandedMenu(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleItemClick(route: string) {
    if (!reallyExpanded && !isMobile) {
      // Expande e navega
      onExpand()
      setTimeout(() => navigate(route), 150)
    } else {
      navigate(route)
      if (isMobile) onCloseMobile()
    }
  }

  const profileSub: string | null =
    activeProfile?.course?.name ?? activeProfile?.scientific_area?.name ?? activeProfile?.organ?.name ?? null

  return (
    <aside style={{
      width: reallyExpanded ? 'var(--sidebar-width)' : isMobile ? '0' : '72px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-1) 0',
      background: 'var(--surface-container-low)',
      borderRight: reallyExpanded ? '1px solid var(--outline-variant)' : 'none',
      zIndex: 50,
      transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      transition: 'width 0.25s ease, transform 0.3s ease',
      overflow: 'hidden'
    }}>
      {/* Botão fechar (mobile) */}
      {isMobile && mobileOpen && (
        <button onClick={onCloseMobile} aria-label="Fechar menu" style={{
          position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)',
          background: 'none', border: 'none', color: 'var(--on-surface-variant)',
          cursor: 'pointer', padding: '4px', zIndex: 1
        }}>
          <span className="material-symbols-outlined">close</span>
        </button>
      )}

      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: reallyExpanded ? 'var(--space-1)' : '0',
        padding: reallyExpanded ? 'var(--space-2) var(--gutter)' : 'var(--space-2) 0',
        marginBottom: 'var(--space-2)',
        justifyContent: reallyExpanded ? 'flex-start' : 'center'
      }}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwV4wdC8vH1FjtS0PIz3QVCsaP68cGmeIDt1tVSNruV8MTY1eWGYVGQ6vTsK3bYcoqRVWMns-fhVYJgmAtJachZVuHbmghglRaEg-t0vON1f1f1g9Y-QQUqexPOeffDNstnijqE6hxMjOV1Q-E6w4GihCisBXN2qmJS12zsSrI1h7yCYHrzhWfSWz9uUZ69qBzww-KrOOWmzEPS-4_awJMZl5ysFVlwEF090mLJ8HdDIQk2LAbXtGCwvZGqP2COd20915NIs6GTJA"
          alt="ISCISA"
          style={{
            width: reallyExpanded ? '42px' : '32px',
            height: reallyExpanded ? '42px' : '32px',
            objectFit: 'contain',
            flexShrink: 0,
            transition: 'width 0.25s, height 0.25s',
            cursor: 'pointer'
          }}
          onClick={() => { if (!reallyExpanded && !isMobile) onExpand() }}
        />
        {reallyExpanded && (
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontSize: '20px', fontWeight: 'var(--font-bold)', color: 'var(--primary)',
              letterSpacing: '-0.02em', lineHeight: 1.2
            }}>ISCISA</h1>
            <p style={{
              fontSize: '10px', color: 'var(--on-surface-variant)',
              textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--font-semibold)'
            }}>Gestão Científica</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav style={{
        flex: 1, overflow: 'auto', padding: '0 var(--space-1)',
        display: 'flex', flexDirection: 'column', gap: '2px'
      }} aria-label="Navegação principal">
        {menu.map(item => {
          const iconName = ICON_MAP[item.id] || ICON_MAP[item.icon] || item.icon || 'circle'

          if (item.children && item.children.length > 0) {
            const isActiveParent = item.children.some(child => location.pathname === child.route)

            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleMenu(item.id)}
                  aria-expanded={!!expandedMenu[item.id]}
                  title={!reallyExpanded ? item.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: reallyExpanded ? 'var(--space-2)' : '0',
                    width: '100%',
                    padding: reallyExpanded ? '12px var(--space-2)' : '12px 0',
                    borderRadius: 'var(--radius-lg)', border: 'none',
                    background: isActiveParent ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                    color: isActiveParent ? 'var(--primary)' : 'var(--on-surface-variant)',
                    fontSize: 'var(--body-md)',
                    fontWeight: isActiveParent ? 'var(--font-bold)' : 'var(--font-regular)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    justifyContent: reallyExpanded ? 'space-between' : 'center',
                    textAlign: 'left'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{iconName}</span>
                  {reallyExpanded && (
                    <>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span className="material-symbols-outlined" style={{
                        fontSize: '18px', transition: 'transform 0.2s ease',
                        transform: expandedMenu[item.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>expand_more</span>
                    </>
                  )}
                </button>

                {reallyExpanded && (
                  <div style={{
                    maxHeight: expandedMenu[item.id] ? '500px' : '0', overflow: 'hidden',
                    transition: 'max-height 0.25s ease', paddingLeft: 'var(--space-4)'
                  }}>
                    {item.children.map(child => (
                      <NavLink key={child.route} to={child.route} onClick={onCloseMobile} style={{
                        display: 'flex', padding: '8px var(--space-2)', borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--body-md)', textDecoration: 'none',
                        color: location.pathname === child.route ? 'var(--primary)' : 'var(--on-surface-variant)',
                        fontWeight: location.pathname === child.route ? 'var(--font-semibold)' : 'var(--font-regular)',
                        background: location.pathname === child.route ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                        transition: 'all 0.2s', marginTop: '2px'
                      }}>{child.label}</NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const active = location.pathname === (item.route || '/')
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.route || '/')}
              title={!reallyExpanded ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: reallyExpanded ? 'var(--space-2)' : '0',
                padding: reallyExpanded ? '12px var(--space-2)' : '12px 0',
                borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)',
                textDecoration: 'none',
                color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
                fontWeight: active ? 'var(--font-bold)' : 'var(--font-regular)',
                background: active ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                borderRight: active && reallyExpanded ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.2s',
                justifyContent: reallyExpanded ? 'flex-start' : 'center',
                cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{iconName}</span>
              {reallyExpanded && <span>{item.label}</span>}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0 var(--space-1)', marginTop: 'auto' }}>
        {reallyExpanded ? (
          <>
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 'var(--space-2)' }}>
              <div onClick={() => { navigate('/settings'); if (isMobile) onCloseMobile() }} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '10px var(--space-2)',
                borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', cursor: 'pointer',
                color: location.pathname === '/settings' ? 'var(--primary)' : 'var(--on-surface-variant)',
                fontWeight: location.pathname === '/settings' ? 'var(--font-bold)' : 'var(--font-regular)',
                background: location.pathname === '/settings' ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                <span>Configurações</span>
              </div>
              <div onClick={() => { navigate('/help'); if (isMobile) onCloseMobile() }} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '10px var(--space-2)',
                borderRadius: 'var(--radius-lg)', fontSize: 'var(--body-md)', cursor: 'pointer',
                color: location.pathname === '/help' ? 'var(--primary)' : 'var(--on-surface-variant)',
                fontWeight: location.pathname === '/help' ? 'var(--font-bold)' : 'var(--font-regular)',
                background: location.pathname === '/help' ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
                <span>Suporte</span>
              </div>
            </div>
            {/* Perfil */}
            <div style={{
              marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)', padding: 'var(--space-2)',
              background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-xl)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
                background: 'var(--primary)', color: 'var(--on-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'var(--font-bold)', fontSize: 'var(--body-md)', flexShrink: 0
              }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <p style={{
                  fontSize: 'var(--body-md)', fontWeight: 'var(--font-bold)', color: 'var(--on-surface)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0
                }}>{user?.name || 'Utilizador'}</p>
                {profileSub && (
                  <p style={{
                    fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0
                  }}>{profileSub}</p>
                )}
              </div>
              <button onClick={logout} aria-label="Terminar sessão" style={{
                background: 'none', border: 'none', color: 'var(--secondary)',
                cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-md)', display: 'flex'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              </button>
            </div>
          </>
        ) : (
          /* Versão compacta */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-2) 0', borderTop: '1px solid var(--outline-variant)'
          }}>
            <div onClick={() => handleItemClick('/settings')} title="Configurações" style={{
              color: location.pathname === '/settings' ? 'var(--primary)' : 'var(--on-surface-variant)',
              padding: '6px', borderRadius: 'var(--radius-md)', cursor: 'pointer'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
            </div>
            <div onClick={() => handleItemClick('/help')} title="Suporte" style={{
              color: location.pathname === '/help' ? 'var(--primary)' : 'var(--on-surface-variant)',
              padding: '6px', borderRadius: 'var(--radius-md)', cursor: 'pointer'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
            </div>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
              background: 'var(--primary)', color: 'var(--on-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'var(--font-bold)', fontSize: 'var(--body-md)'
            }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            <button onClick={logout} title="Terminar sessão" style={{
              background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '4px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}