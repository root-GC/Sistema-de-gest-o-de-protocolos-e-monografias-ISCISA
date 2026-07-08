import { useEffect, useState } from 'react';
import { topicService, type Topic } from '../../services/topicService';

export default function ReviewsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    topicService.listForReviewer()
      .then(({ topics }) => setTopics(topics))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>A carregar...</p>;

  const assigned = topics.filter(t => t.status !== 'topic_approved_nucleo' && t.status !== 'topic_rejected_nucleo');
  const done = topics.filter(t => t.status === 'topic_approved_nucleo' || t.status === 'topic_rejected_nucleo');

  return (
    <div>
      <h1>Revisões</h1>
      {error && <p role="alert">{error}</p>}
      <h2>Atribuídas a mim</h2>
      <ul>{assigned.map(t => <li key={t.id}><a href={`/reviews/${t.id}`}>{t.title}</a> — {t.status_label}</li>)}</ul>
      <h2>Concluídas</h2>
      <ul>{done.map(t => <li key={t.id}>{t.title} — {t.status_label}</li>)}</ul>
    </div>
  );
}