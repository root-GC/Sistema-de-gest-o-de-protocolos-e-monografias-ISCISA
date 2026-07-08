import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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

// ============================================================
// MAPEAMENTO DE ÍCONES (Material Symbols)
// ============================================================
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
}

// ============================================================
// COMPONENTE SidebarLink (substitui NavLink com função no style)
// ============================================================
function SidebarLink({
  to,
  onClick,
  isActive,
  children,
  isChild = false,
  icon,
}: {
  to: string
  onClick?: () => void
  isActive: boolean
  children: React.ReactNode
  isChild?: boolean
  icon?: string
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: icon ? 'var(--space-2)' : '0',
        padding: isChild ? '10px var(--space-2)' : '12px var(--space-2)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--body-md)',
        fontFamily: 'var(--font-family)',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
        fontWeight: isActive
          ? isChild
            ? 'var(--font-semibold)'
            : 'var(--font-bold)'
          : 'var(--font-regular)',
        background: isActive ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
        borderRight: !isChild && isActive ? '4px solid var(--primary)' : '4px solid transparent',
        transition: 'all 0.2s',
        marginTop: isChild ? '2px' : '0',
      }}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </NavLink>
  )
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const menu: MenuItem[] = useMenu()
  const { user, activeProfile, logout } = useAuth()
  const location = useLocation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const profileSub: string | null =
    activeProfile?.course?.name ??
    activeProfile?.scientific_area?.name ??
    activeProfile?.organ?.name ??
    null

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-1) 0',
      background: 'var(--surface-container-low)',
      borderRight: '1px solid var(--outline-variant)',
      zIndex: 50,
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease'
    }}>
      {/* Botão fechar (mobile) */}
      <button
        onClick={onClose}
        aria-label="Fechar menu"
        className="sidebar-close-btn"
        style={{
          display: 'none',
          position: 'absolute',
          top: 'var(--space-2)',
          right: 'var(--space-2)',
          background: 'none',
          border: 'none',
          color: 'var(--on-surface-variant)',
          cursor: 'pointer',
          padding: '4px',
          zIndex: 1
        }}
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {/* Logo + Marca */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: 'var(--space-2) var(--gutter)',
        marginBottom: 'var(--space-3)'
      }}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwV4wdC8vH1FjtS0PIz3QVCsaP68cGmeIDt1tVSNruV8MTY1eWGYVGQ6vTsK3bYcoqRVWMns-fhVYJgmAtJachZVuHbmghglRaEg-t0vON1f1f1g9Y-QQUqexPOeffDNstnijqE6hxMjOV1Q-E6w4GihCisBXN2qmJS12zsSrI1h7yCYHrzhWfSWz9uUZ69qBzww-KrOOWmzEPS-4_awJMZl5ysFVlwEF090mLJ8HdDIQk2LAbXtGCwvZGqP2COd20915NIs6GTJA"
          alt="ISCISA Logo"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain',
            flexShrink: 0
          }}
        />
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'var(--font-bold)',
            color: 'var(--primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            fontFamily: 'var(--font-family)'
          }}>
            ISCISA
          </h1>
          <p style={{
            fontSize: 'var(--label-md)',
            color: 'var(--on-surface-variant)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 'var(--font-semibold)',
            fontFamily: 'var(--font-family)'
          }}>
            Gestão Científica
          </p>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 var(--space-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }} aria-label="Navegação principal">
        {menu.map(item => {
          const iconName = ICON_MAP[item.id] || ICON_MAP[item.icon] || item.icon || 'circle'

          // Item com filhos (dropdown)
          if (item.children && item.children.length > 0) {
            const isActiveParent = item.children.some(child => location.pathname === child.route)

            return (
              <div key={item.id}>
                <button
                  onClick={() => toggle(item.id)}
                  aria-expanded={!!expanded[item.id]}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    width: '100%',
                    padding: '12px var(--space-2)',
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    background: isActiveParent ? 'rgba(0, 105, 51, 0.08)' : 'transparent',
                    color: isActiveParent ? 'var(--primary)' : 'var(--on-surface-variant)',
                    fontSize: 'var(--body-md)',
                    fontWeight: isActiveParent ? 'var(--font-bold)' : 'var(--font-regular)',
                    fontFamily: 'var(--font-family)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    const bg = e.currentTarget.style.background
                    if (!bg.includes('105') && !bg.includes('rgba')) {
                      e.currentTarget.style.background = 'var(--surface-container-highest)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActiveParent) {
                      e.currentTarget.style.background = 'transparent'
                    } else {
                      e.currentTarget.style.background = 'rgba(0, 105, 51, 0.08)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">
                      {iconName}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    style={{
                      fontSize: '20px',
                      transition: 'transform 0.2s ease',
                      transform: expanded[item.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    expand_more
                  </span>
                </button>

                <div style={{
                  maxHeight: expanded[item.id] ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                  paddingLeft: 'var(--space-5)'
                }}>
                  {item.children.map(child => (
                    <SidebarLink
                      key={child.route}
                      to={child.route}
                      onClick={onClose}
                      isActive={location.pathname === child.route}
                      isChild
                    >
                      {child.label}
                    </SidebarLink>
                  ))}
                </div>
              </div>
            )
          }

          // Item simples
          return (
            <SidebarLink
              key={item.id}
              to={item.route || '/'}
              onClick={onClose}
              isActive={location.pathname === (item.route || '/')}
              icon={iconName}
            >
              {item.label}
            </SidebarLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0 var(--space-1)', marginTop: 'auto' }}>
        <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 'var(--space-2)' }}>
          <SidebarLink
            to="/settings"
            onClick={onClose}
            isActive={location.pathname === '/settings'}
            icon="settings"
          >
            Configurações
          </SidebarLink>

          <SidebarLink
            to="/help"
            onClick={onClose}
            isActive={location.pathname === '/help'}
            icon="help"
          >
            Suporte
          </SidebarLink>
        </div>

        {/* Perfil */}
        <div style={{
          marginTop: 'var(--space-2)',
          marginBottom: 'var(--space-2)',
          padding: 'var(--space-2)',
          background: 'var(--surface-container-highest)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--body-lg)',
            fontFamily: 'var(--font-family)',
            flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <p style={{
              fontSize: 'var(--body-md)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--on-surface)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
              fontFamily: 'var(--font-family)'
            }}>
              {user?.name || 'Utilizador'}
            </p>
            {profileSub && (
              <p style={{
                fontSize: 'var(--label-md)',
                color: 'var(--on-surface-variant)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
                fontFamily: 'var(--font-family)'
              }}>
                {profileSub}
              </p>
            )}
          </div>
          <button
            onClick={logout}
            aria-label="Terminar sessão"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              display: 'flex'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  )
}