// pages/dashboard/widgets/PendingReviewsWidget.tsx
// import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WidgetProps } from '../../../types/dashboard';

interface Review {
  id: string;
  protocol_code: string;
  title: string;
  review_type: string;
  deadline: string;
  is_overdue: boolean;
  student_name: string;
  organ: string;
}

export function PendingReviewsWidget({ data }: WidgetProps) {
  const navigate = useNavigate();
  const reviews: Review[] = data?.reviews || [];

  return (
    <div className="pending-reviews-widget">
      {reviews.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined">task_alt</span>
          <p>Todas as revisões em dia!</p>
          <span className="text-small text-muted">
            Você não possui revisões pendentes no momento.
          </span>
        </div>
      ) : (
        <div className="reviews-table">
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Tipo</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className={review.is_overdue ? 'overdue' : ''}>
                  <td>
                    <span className="protocol-code">#{review.protocol_code}</span>
                    <span className="protocol-title">{review.title}</span>
                    <span className="text-small text-muted">{review.student_name}</span>
                  </td>
                  <td>
                    <span className="badge badge-warning">{review.review_type}</span>
                  </td>
                  <td className={review.is_overdue ? 'text-error' : ''}>
                    {review.deadline}
                    {review.is_overdue && (
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', marginLeft: '4px', verticalAlign: 'middle' }}>
                        warning
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${review.is_overdue ? 'badge-error' : 'badge-success'}`}>
                      {review.is_overdue ? 'Atrasada' : 'Em dia'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => navigate(`/reviews/protocols/${review.id}`)}
                    >
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}