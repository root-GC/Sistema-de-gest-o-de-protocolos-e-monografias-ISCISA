import { NavLink } from 'react-router-dom'
import './studentWorkspace.css'

const items = [
  { to: '/topic', icon: 'lightbulb', label: 'Tema' },
  { to: '/protocol/mine', icon: 'description', label: 'Protocolos' },
  { to: '/protocol/documents', icon: 'folder_open', label: 'Documentos' },
]

export function StudentWorkspaceNav() {
  return (
    <nav className="student-workspace-nav" aria-label="Área académica">
      {items.map(item => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `student-workspace-nav__item${isActive ? ' is-active' : ''}`}>
          <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
