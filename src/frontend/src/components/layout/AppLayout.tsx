import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import '../../styles/global.css'

export function AppLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth <= 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function toggleSidebar() {
    if (isMobile) {
      setMobileOpen(prev => !prev)
    } else {
      setSidebarExpanded(prev => !prev)
    }
  }

  const sidebarWidth = isMobile ? '0' : sidebarExpanded ? 'var(--sidebar-width)' : '72px'

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'var(--font-family)',
      background: 'var(--surface)',
      color: 'var(--on-surface)'
    }}>
      {/* Overlay mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'var(--backdrop)', zIndex: 45
          }}
        />
      )}

      <Sidebar
        expanded={sidebarExpanded}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
         onExpand={() => setSidebarExpanded(true)}   // ← ADICIONE esta linha
        isMobile={isMobile}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease'
      }}>
        <Topbar
          onMenuClick={toggleSidebar}
          sidebarExpanded={sidebarExpanded}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
        />
        <main style={{
          flex: 1,
          marginTop: '64px',
          overflow: 'auto',
          background: 'var(--background)',
          padding: 'var(--space-3) var(--gutter)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}