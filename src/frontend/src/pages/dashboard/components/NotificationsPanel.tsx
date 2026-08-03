// src/components/dashboard/NotificationsPanel.tsx
import type { NotificationItem } from '../../../types/dashboard';

export function NotificationsPanel({ items }: { items: NotificationItem[] }) {
  if (items.length === 0) {
    return (
      <section className="card suave-card">
        <h2 className="section-title section-title-deco">Notificações</h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-4) var(--space-3)',
          color: 'var(--on-surface-variant)',
          textAlign: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--outline-variant)' }}>
            notifications_off
          </span>
          <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)' }}>
            Sem novidades por agora.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card suave-card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-3)'
      }}>
        <h2 className="section-title section-title-deco" style={{ marginBottom: 0 }}>Notificações</h2>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          fontWeight: 'var(--font-medium)',
          background: 'var(--surface-container)',
          color: 'var(--on-surface-variant)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>notifications</span>
          {items.length}
        </span>
      </div>
      
      <ul className="notifications-list suave-scroll" style={{
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)'
      }}>
        {items.map(n => (
          <li
            key={n.id}
            className={`notification-item list-item-hover ${n.read ? 'notification-item--read' : 'notification-item--unread'}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              background: n.read ? 'transparent' : 'var(--primary-container)',
              border: n.read ? '1px solid var(--outline-variant)' : '1px solid var(--primary)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', flex: 1 }}>
              {!n.read && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary)',
                  flexShrink: 0,
                  marginTop: '6px'
                }} />
              )}
              <p className="notification-message" style={{
                fontSize: 'var(--body-md)',
                color: n.read ? 'var(--on-surface-variant)' : 'var(--on-primary-container)',
                fontWeight: n.read ? 'var(--font-regular)' : 'var(--font-medium)',
                flex: 1
              }}>
                {n.message}
              </p>
            </div>
            <span className="notification-date" style={{
              fontSize: 'var(--label-sm)',
              color: 'var(--on-surface-variant)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              {new Date(n.created_at).toLocaleString('pt-MZ')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}