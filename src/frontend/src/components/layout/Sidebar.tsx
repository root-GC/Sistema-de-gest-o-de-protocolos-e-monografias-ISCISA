// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
// @ts-ignore
import { useMenu } from '../../hooks/useMenu'
import { useAuth } from '../../context/AuthContext'
import '../../styles/global.css'

interface MenuItem {
  id: string
  label: string
  icon: string
  route?: string
  permission?: string
  roles?: string[]
  children?: { label: string; route: string; permission?: string }[]
}

const ICON_MAP: Record<string, string> = {
  'ti-dashboard': 'dashboard',
  'ti-school': 'school',
  'ti-fitness-center': 'fitness_center',
  'ti-user-check': 'person_check',
  'ti-files': 'folder_open',
  'ti-event-available': 'event_available',
  'ti-users-group': 'group',
  'ti-building': 'account_balance',
  'ti-clipboard-list': 'assignment',
  'ti-file-description': 'description',
  'ti-book': 'menu_book',
  'ti-bookmark': 'bookmark',
  'ti-description': 'description',
  'ti-rate-review': 'rate_review',
  'ti-reports': 'analytics',
  'ti-settings': 'settings',
  'ti-help': 'help',
  'ti-topic': 'lightbulb',
  'ti-monograph': 'menu_book',
  'ti-calendar': 'calendar_month',
  'ti-notifications': 'notifications',
  'ti-messages': 'chat',
  'ti-search': 'search',
  'ti-filter': 'filter_list',
  'ti-more': 'more_vert',
  'ti-add': 'add',
  'ti-edit': 'edit',
  'ti-delete': 'delete',
  'ti-download': 'download',
  'ti-upload': 'upload',
  'ti-print': 'print',
  'ti-share': 'share',
  'ti-star': 'star',
  'ti-visibility': 'visibility',
  'ti-visibility-off': 'visibility_off',
  'ti-lock': 'lock',
  'ti-person': 'person',
  'ti-mail': 'mail',
  'ti-phone': 'call',
  'ti-location': 'location_on',
  'ti-link': 'link',
  'ti-logout': 'logout',
  'ti-warning': 'warning',
  'ti-error': 'error',
  'ti-check': 'check_circle',
  'ti-pending': 'pending',
  'ti-schedule': 'schedule',
  'ti-history': 'history',
  'ti-trending-up': 'trending_up',
  'ti-trending-down': 'trending_down',
  'ti-expand-more': 'expand_more',
  'ti-expand-less': 'expand_less',
  'ti-chevron-right': 'chevron_right',
  'ti-chevron-left': 'chevron_left',
  'ti-close': 'close',
  'ti-menu': 'menu',
  'ti-refresh': 'refresh',
  'ti-sync': 'sync',
  'ti-cloud': 'cloud',
  'ti-cloud-upload': 'cloud_upload',
  'ti-cloud-download': 'cloud_download',
  'ti-lightbulb': 'lightbulb',
  'ti-menu-book': 'menu_book',
  'ti-inventory': 'inventory_2',
  'ti-person-add': 'person_add',
  'ti-account-balance': 'account_balance',
  'ti-person-check': 'person_check',
  'ti-folder-open': 'folder_open',
  'ti-users': 'group',
  'ti-balance': 'balance',
  'ti-check-double': 'done_all',
  'ti-chart-bar': 'bar_chart',
  'ti-eye': 'visibility',
  'ti-calendar-event': 'event_available',
  'ti-chart-pie': 'pie_chart',
  'ti-home': 'home',
  dashboard: 'dashboard',
  inicio: 'dashboard',
  home: 'dashboard',
  protocols: 'description',
  'all-protocols': 'folder_open',
  'my-protocol': 'description',
  'protocol-mine': 'description',
  reviews: 'rate_review',
  'rate-review': 'rate_review',
  supervision: 'school',
  tutorandos: 'school',
  'my-students': 'school',
  reports: 'analytics',
  analytics: 'analytics',
  defense: 'event_available',
  defesas: 'event_available',
  assign: 'person_check',
  'assign-reviewers': 'person_check',
  secretary: 'assignment',
  'clipboard-list': 'assignment',
  'secretary-protocols': 'assignment',
  'gestao-submissoes': 'assignment',
  submissions: 'assignment',
  users: 'group',
  utilizadores: 'group',
  organs: 'account_balance',
  'orgaos-areas': 'account_balance',
  topic: 'bookmark',
  tema: 'bookmark',
  'meu-tema': 'bookmark',
  monograph: 'menu_book',
  monografia: 'menu_book',
  book: 'menu_book',
  workload: 'fitness_center',
  'minha-carga': 'fitness_center',
  settings: 'settings',
  configuracoes: 'settings',
  help: 'help',
  suporte: 'help',
  profile: 'person',
  notifications: 'notifications',
  messages: 'chat',
  calendar: 'calendar_month',
  add: 'add',
  edit: 'edit',
  delete: 'delete',
  search: 'search',
  filter: 'filter_list',
  more: 'more_vert',
  download: 'download',
  upload: 'upload',
  print: 'print',
  share: 'share',
  bookmark: 'bookmark',
  star: 'star',
  visibility: 'visibility',
  visibility_off: 'visibility_off',
  lock: 'lock',
  email: 'mail',
  phone: 'call',
  location: 'location_on',
  link: 'link',
  logout: 'logout',
  warning: 'warning',
  error: 'error',
  check: 'check_circle',
  pending: 'pending',
  schedule: 'schedule',
  history: 'history',
  trending_up: 'trending_up',
  trending_down: 'trending_down',
  expand_more: 'expand_more',
  expand_less: 'expand_less',
  chevron_right: 'chevron_right',
  chevron_left: 'chevron_left',
  close: 'close',
  menu: 'menu',
  refresh: 'refresh',
  sync: 'sync',
  cloud: 'cloud',
  cloud_upload: 'cloud_upload',
  cloud_download: 'cloud_download',
  lightbulb: 'lightbulb',
  menu_book: 'menu_book',
  inventory_2: 'inventory_2',
  person_add: 'person_add',
  account_balance: 'account_balance',
  person_check: 'person_check',
  folder_open: 'folder_open',
  group: 'group',
  assignment: 'assignment',
  description: 'description',
  circle: 'circle',
  balance: 'balance',
  done_all: 'done_all',
  shield_person: 'shield_person',
  key: 'key',
  hourglass_top: 'hourglass_top',
  verified: 'verified',
  cancel: 'cancel',
  rate_review: 'rate_review',
  assignment_ind: 'assignment_ind',
  check_circle: 'check_circle',
}

// ============================================================
// CONTEXTO
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
  const { user, activeProfile, logout, loading: authLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedMenu, setExpandedMenu] = useState<Record<string, boolean>>({})
  const [loggingOut, setLoggingOut] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)

  const reallyExpanded = isMobile ? mobileOpen : expanded
  SidebarContext.current = { expanded: reallyExpanded, requestExpand: onExpand }

  useEffect(() => {
    if (isMobile) onCloseMobile()
  }, [location.pathname])

  // Reset navigating state when route changes
  useEffect(() => {
    setNavigatingTo(null)
  }, [location.pathname])

  function toggleMenu(id: string) {
    if (!reallyExpanded && !isMobile) {
      onExpand()
      setTimeout(() => setExpandedMenu(prev => ({ ...prev, [id]: !prev[id] })), 100)
      return
    }
    setExpandedMenu(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleItemClick(route: string) {
    setNavigatingTo(route)
    if (!reallyExpanded && !isMobile) {
      onExpand()
      setTimeout(() => navigate(route), 150)
    } else {
      navigate(route)
      if (isMobile) onCloseMobile()
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      setLoggingOut(false)
    }
  }

  const profileSub: string | null =
    (activeProfile as { course?: { name?: string } } | null | undefined)?.course?.name ??
    (activeProfile as { scientific_area?: { name?: string } } | null | undefined)?.scientific_area?.name ??
    (activeProfile as { organ?: { name?: string } } | null | undefined)?.organ?.name ??
    null

  // Skeleton items para loading
  const skeletonItems = Array.from({ length: 6 }, (_, i) => i)

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
      {/* Overlay de logout - cobre toda a tela */}
      {loggingOut && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 'var(--space-3)', boxShadow: 'var(--elevation-3)',
            minWidth: '220px'
          }}>
            <div style={{
              width: '44px', height: '44px',
              border: '3px solid var(--outline-variant)',
              borderTopColor: 'var(--secondary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{
              fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)',
              fontWeight: 'var(--font-medium)', fontFamily: 'var(--font-family)'
            }}>
              A terminar sessão...
            </p>
          </div>
        </div>
      )}

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
        {authLoading ? (
          // Skeleton enquanto carrega
          skeletonItems.map(i => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              padding: reallyExpanded ? '12px var(--space-2)' : '12px 0',
              justifyContent: reallyExpanded ? 'flex-start' : 'center',
              gap: reallyExpanded ? 'var(--space-2)' : '0'
            }}>
              <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-md)' }} />
              {reallyExpanded && (
                <div className="skeleton skeleton--text-short" style={{ height: '14px', flex: 1 }} />
              )}
            </div>
          ))
        ) : (
          menu.map(item => {
            const iconName = ICON_MAP[item.id] || ICON_MAP[item.icon] || item.icon || 'circle'
            const isNavigating = navigatingTo === item.route

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
                      {item.children.map(child => {
                        const childNavigating = navigatingTo === child.route
                        return (
                          <NavLink key={child.route} to={child.route} onClick={onCloseMobile} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                            padding: '8px var(--space-2)', borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--body-md)', textDecoration: 'none',
                            color: location.pathname === child.route ? 'var(--primary)' : 'var(--on-surface-variant)',
                            fontWeight: location.pathname === child.route ? 'var(--font-semibold)' : 'var(--font-regular)',
                            background: location.pathname === child.route ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                            transition: 'all 0.2s', marginTop: '2px',
                            pointerEvents: childNavigating ? 'none' : 'auto',
                            opacity: childNavigating ? 0.7 : 1
                          }}>
                            {childNavigating && (
                              <span style={{
                                width: '12px', height: '12px',
                                border: '2px solid var(--primary)',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite',
                                flexShrink: 0
                              }} />
                            )}
                            {child.label}
                          </NavLink>
                        )
                      })}
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
                  cursor: isNavigating ? 'wait' : 'pointer',
                  opacity: isNavigating ? 0.7 : 1,
                  pointerEvents: isNavigating ? 'none' : 'auto'
                }}
              >
                {isNavigating ? (
                  <span style={{
                    width: '20px', height: '20px',
                    border: '2px solid var(--primary)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    flexShrink: 0
                  }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{iconName}</span>
                )}
                {reallyExpanded && <span>{item.label}</span>}
              </div>
            )
          })
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0 var(--space-1)', marginTop: 'auto' }}>
        {authLoading ? (
          // Skeleton do footer enquanto carrega
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
            padding: 'var(--space-2) 0', borderTop: '1px solid var(--outline-variant)',
            alignItems: reallyExpanded ? 'stretch' : 'center'
          }}>
            <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-md)', alignSelf: 'center' }} />
            <div className="skeleton" style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-md)', alignSelf: 'center' }} />
            {reallyExpanded && (
              <div className="skeleton skeleton--card" style={{ height: '60px' }} />
            )}
          </div>
        ) : reallyExpanded ? (
          <>
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 'var(--space-2)' }}>
              <div onClick={() => handleItemClick('/settings')} style={{
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
              <div onClick={() => handleItemClick('/help')} style={{
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
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Terminar sessão"
                title="Terminar sessão"
                style={{
                  background: 'none', border: 'none',
                  color: loggingOut ? 'var(--outline)' : 'var(--secondary)',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  padding: '6px', borderRadius: 'var(--radius-md)',
                  display: 'flex', transition: 'all 0.2s',
                  opacity: loggingOut ? 0.6 : 1
                }}
              >
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
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Terminar sessão"
              style={{
                background: 'none', border: 'none',
                color: loggingOut ? 'var(--outline)' : 'var(--secondary)',
                cursor: loggingOut ? 'not-allowed' : 'pointer', padding: '4px',
                opacity: loggingOut ? 0.6 : 1, transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </aside>
  )
}