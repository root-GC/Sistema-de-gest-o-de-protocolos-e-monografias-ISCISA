import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import '../../styles/global.css'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function toggleSidebar() {
    setSidebarOpen(prev => !prev)
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'var(--font-family)',
      background: 'var(--surface)',
      color: 'var(--on-surface)'
    }}>
      {/* Overlay para mobile quando sidebar está aberta */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            display: 'none', // Só visível em mobile via media query
            position: 'fixed',
            inset: 0,
            background: 'var(--backdrop)',
            zIndex: 45
          }}
          className="sidebar-overlay"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        <Topbar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        // AppLayout.jsx - versão sem max-width
<main style={{
  flex: 1,
  marginTop: '64px',
  overflow: 'auto',
  background: 'var(--background)',
  padding: 'var(--space-4) var(--gutter)'
}}>
  <Outlet />
</main>
      </div>

      {/* Estilos responsivos */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}