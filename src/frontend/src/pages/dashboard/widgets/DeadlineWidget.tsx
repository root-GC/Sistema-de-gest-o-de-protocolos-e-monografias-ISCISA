// pages/dashboard/widgets/DeadlineWidget.tsx
// import React from 'react';
import type { WidgetProps } from '../../../types/dashboard';

interface Deadline {
  id: string;
  title: string;
  date: string;
  type: 'protocol' | 'review' | 'defense' | 'document' | 'general';
  days_remaining: number;
  is_overdue: boolean;
}

export function DeadlineWidget({ data }: WidgetProps) {
  const deadlines: Deadline[] = data?.deadlines || [];

  const typeIcons: Record<string, string> = {
    protocol: 'description',
    review: 'rate_review',
    defense: 'school',
    document: 'upload_file',
    general: 'event'
  };

  return (
    <div className="notification-widget">
      {deadlines.length === 0 ? (
        <div className="empty-state-small">
          <span className="material-symbols-outlined">event_available</span>
          <p>Nenhum prazo próximo</p>
        </div>
      ) : (
        <div className="notification-list">
          {deadlines.slice(0, 5).map((deadline) => (
            <div
              key={deadline.id}
              className={`notification-item ${deadline.is_overdue ? 'notification-error' : deadline.days_remaining <= 3 ? 'notification-warning' : 'notification-info'}`}
            >
              <span className="material-symbols-outlined notification-icon">
                {typeIcons[deadline.type] || 'event'}
              </span>
              <div className="notification-content">
                <p className="notification-message">{deadline.title}</p>
                <span className={`notification-time ${deadline.is_overdue ? 'text-error' : ''}`}>
                  {deadline.is_overdue 
                    ? `Atrasado - ${deadline.date}` 
                    : deadline.days_remaining === 0 
                      ? 'Hoje' 
                      : `${deadline.days_remaining} dias - ${deadline.date}`
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}