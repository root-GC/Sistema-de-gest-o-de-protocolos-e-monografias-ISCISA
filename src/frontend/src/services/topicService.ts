import { req } from './apiClient';

export interface Topic {
  id: number;
  title: string;
  status: string;
  status_label: string;
  submitted_at: string;
  scientific_area?: { id: number; name: string };
  course?: { id: number; name: string };
  student?: { id: string; name: string; email: string };
}

export interface SimilarTopicsWarning {
  has_similar: boolean;
  items: { id: number; title: string }[];
}

export const topicService = {
  submit: (payload: { title: string; scientific_area_id: number; course_id: number }) =>
    req('POST', '/api/v1/topics', payload) as Promise<{
      message: string;
      topic: Topic;
      similar_topics_warning: SimilarTopicsWarning;
    }>,

  list: () => req('GET', '/api/v1/topics') as Promise<{ topics: Topic[] }>,

  getForSupervisor: () =>
    req('GET', '/api/v1/supervisor/topics') as Promise<{ topics: Topic[]; total: number }>,

  approveBySupervisor: (topicId: number) =>
    req('PATCH', `/api/v1/topics/${topicId}/supervisor-approve`),

  rejectBySupervisor: (topicId: number, justification: string) =>
    req('PATCH', `/api/v1/topics/${topicId}/supervisor-reject`, { justification }),

  listForSecretary: () =>
    req('GET', '/api/v1/secretary/topics') as Promise<{ topics: Topic[]; total: number }>,

  eligibleReviewers: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/eligible-reviewers`) as Promise<{
      reviewers: { id: number; name: string }[];
      total: number;
    }>,

  assignReviewers: (topicId: number, reviewerIds: number[]) =>
    req('POST', `/api/v1/topics/${topicId}/assign-reviewers`, { reviewer_ids: reviewerIds }),

  listForReviewer: () =>
    req('GET', '/api/v1/reviewer/topics') as Promise<{ topics: Topic[] }>,

  getComments: (topicId: number, filters: Record<string, string> = {}) =>
    req('GET', `/api/v1/topics/${topicId}/comments?${new URLSearchParams(filters)}`),

  submitComment: (topicId: number, content: string) =>
    req('POST', `/api/v1/topics/${topicId}/comments`, { content }),

  submitEvaluation: (topicId: number, decision: 'approved' | 'rejected', comment_id: number | null = null) =>
    req('POST', `/api/v1/topics/${topicId}/evaluations`, { decision, comment_id }),
};