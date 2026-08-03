// src/components/layout/AppLayout.tsx
import { useState, useEffect, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ContentSkeleton } from './ContentSkeleton'
import '../../styles/global.css'

export function AppLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const location = useLocation()

  // Detecta mudanças de rota para mostrar barra de progresso
  useEffect(() => {
    setNavigating(true)
    const timer = setTimeout(() => setNavigating(false), 400)
    return () => clearTimeout(timer)
  }, [location.pathname])

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
        onExpand={() => setSidebarExpanded(true)}
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

        {/* Barra de progresso ao navegar */}
        {navigating && (
          <div style={{
            position: 'fixed',
            top: '64px',
            left: sidebarWidth,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--primary), var(--tertiary))',
            zIndex: 39,
            animation: 'progressBar 0.6s ease-in-out',
            transformOrigin: 'left',
            transition: 'left 0.3s ease',
            boxShadow: '0 0 6px rgba(0, 105, 51, 0.3)'
          }} />
        )}

        <main style={{
          flex: 1,
          marginTop: '64px',
          overflow: 'auto',
          background: 'var(--background)',
          padding: 'var(--space-3) var(--gutter)'
        }}>
          <Suspense fallback={<ContentSkeleton />}>
             <Outlet />
          </Suspense>
          
        </main>
      </div>

      <style>{`
        @keyframes progressBar {
          0% { transform: scaleX(0); opacity: 1; }
          50% { transform: scaleX(0.7); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}