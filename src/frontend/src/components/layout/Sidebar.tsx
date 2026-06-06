import { useState } from 'react';
import { NavLink } from 'react-router-dom';
// @ts-ignore
import { useMenu } from '../../hooks/useMenu';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from '../auth/RoleSwitcher';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: { label: string; route: string }[];
}

export function Sidebar() {
  const menu: MenuItem[] = useMenu();
  const { user, activeProfile } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const profileSub: string | null =
    activeProfile?.course?.name ??
    activeProfile?.scientific_area?.name ??
    activeProfile?.organ?.name ??
    null;

  return (
    <aside className="sidebar">
      {/* Marca */}
      <div className="sidebar-header">
        <div className="sidebar-brand">SGPMC</div>
        <div className="sidebar-brand-sub">ISCISA — Gestão Científica</div>
      </div>

      {/* Utilizador */}
      <div className="sidebar-user">
        <div className="sidebar-avatar" aria-hidden="true">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name}</span>
          {profileSub && (
            <span className="sidebar-user-sub">{profileSub}</span>
          )}
        </div>
      </div>

      <RoleSwitcher />

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {menu.map(item => (
          <div key={item.id}>
            {item.children && item.children.length > 0 ? (
              <>
                <button
                  className="sidebar-link sidebar-link--parent"
                  onClick={() => toggle(item.id)}
                  aria-expanded={!!expanded[item.id]}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                  <i
                    className={`ti ti-chevron-down sidebar-chevron ${
                      expanded[item.id] ? 'sidebar-chevron--open' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {expanded[item.id] && (
                  <div className="sidebar-children">
                    {item.children.map(child => (
                      <NavLink
                        key={child.route}
                        to={child.route}
                        className={({ isActive }) =>
                          `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.route!}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                }
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}