import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WidgetProps } from '../../../types/dashboard';
import { agendaService } from '../../../services/agendaService';
import type { AgendaEvent } from '../../../types/agenda';
import { getTypeMeta } from '../../../types/agenda';

export function AgendaWidget({ isLoading: externalLoading }: WidgetProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agendaService.loadUpcomingEvents(5).then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || externalLoading) {
    return (
      <div className="notification-widget" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
        <span className="inline-loader" />
      </div>
    );
  }

  return (
    <div className="notification-widget">
      {events.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">event_available</span>
          <p>Sem eventos próximos</p>
        </div>
      ) : (
        <div className="notification-list">
          {events.map(event => {
            const meta = getTypeMeta(event.type);
            const dateStr = new Date(event.date + 'T' + (event.start || '00:00'));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((dateStr.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={event.id}
                className="notification-item"
                style={{ cursor: 'default' }}
              >
                <span className="material-symbols-outlined notification-icon" style={{ color: meta.color }}>
                  {meta.icon}
                </span>
                <div className="notification-content">
                  <p className="notification-message">{event.title}</p>
                  <span className={`notification-time ${diffDays <= 0 ? 'text-error' : diffDays <= 3 ? 'text-warning' : ''}`}>
                    {diffDays === 0
                      ? 'Hoje' + (event.start ? ` às ${event.start}` : '')
                      : diffDays === 1
                        ? 'Amanhã' + (event.start ? ` às ${event.start}` : '')
                        : `${diffDays} dias · ${event.date}`
                    }
                    {event.start && diffDays > 1 ? ` ${event.start}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--surface-variant)' }}>
        <button
          className="btn btn-sm btn-block"
          onClick={() => navigate('/agenda')}
          style={{ fontSize: 'var(--body-md)', width: '100%' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>calendar_month</span>
          Ver agenda completa
        </button>
      </div>
    </div>
  );
}
