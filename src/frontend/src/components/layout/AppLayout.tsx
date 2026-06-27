import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import '../../styles/global.css'

export function AppLayout() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'var(--font-family)',
      background: 'var(--surface)',
      color: 'var(--on-surface)'
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main style={{
          flex: 1,
          padding: 'var(--space-5) var(--gutter) var(--space-5)',
          marginLeft: 'var(--sidebar-width)',
          marginTop: '64px',
          overflow: 'auto',
          background: 'var(--background)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}