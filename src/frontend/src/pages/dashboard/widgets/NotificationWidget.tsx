// pages/dashboard/widgets/NotificationWidget.tsx
// /
import type { WidgetProps } from '../../../types/dashboard';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  icon: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationWidget({ data }: WidgetProps) {
  const notifications: Notification[] = data?.notifications || [];

  return (
    <div className="notification-widget">
      {notifications.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">notifications_off</span>
          <p>Sem notificações</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`notification-item notification-${notification.type}`}
              style={{ opacity: notification.read ? 0.7 : 1 }}
            >
              <span className="material-symbols-outlined notification-icon">
                {notification.icon || 'circle'}
              </span>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
              {!notification.read && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary)',
                  borderRadius: 'var(--radius-full)'
                }} />
              )}
            </div>
          ))}
        </div>
      )}
      
      {notifications.length > 5 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
          <button className="btn-text">Ver todas ({notifications.length})</button>
        </div>
      )}
    </div>
  );
}