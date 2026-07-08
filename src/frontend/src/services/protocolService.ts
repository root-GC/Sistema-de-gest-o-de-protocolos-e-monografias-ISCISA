import { req } from './apiClient';

export interface ProtocolDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  version: number;
  status: 'active' | 'inactive';
  submitted_at: string;
}

export interface Protocol {
  id: number;
  code: string;
  status: string;
  status_label: string;
  protocol_type?: string;
  submission_number?: number;
  version?: string;
  submitted_at: string;
  supervisor_decision_at?: string | null;
  justification?: string | null;
  topic: { id: number; title: string; status: string };
  documents: ProtocolDocument[];
  review_assignments?: {
    id: number;
    reviewer_one?: { user: { name: string } } | number;
    reviewer_two?: { user: { name: string } } | number;
    status: string;
  }[];
}

export const protocolService = {
  submit: (topicId: number, protocolType: string, file: File) => {
    const form = new FormData();
    form.append('topic_id', String(topicId));
    form.append('protocol_type', protocolType);
    form.append('document', file);
    return req('POST', '/api/v1/protocols', form) as Promise<{ message: string; protocol: Protocol }>;
  },

  list: () => req('GET', '/api/v1/protocols') as Promise<{ protocols: Protocol[] }>,

  show: (id: number) => req('GET', `/api/v1/protocols/${id}`) as Promise<{ protocol: Protocol }>,

  approveBySupervisor: (id: number) =>
    req('PATCH', `/api/v1/protocols/${id}/supervisor-approve`) as Promise<{ message: string; protocol: Protocol }>,

  rejectBySupervisor: (id: number, justification: string) =>
    req('PATCH', `/api/v1/protocols/${id}/supervisor-reject`, { justification }) as Promise<{ message: string; protocol: Protocol }>,

  listForSecretary: () => req('GET', '/api/v1/secretary/protocols') as Promise<{ protocols: Protocol[] }>,

  eligibleReviewers: (id: number) =>
    req('GET', `/api/v1/protocols/${id}/eligible-reviewers`) as Promise<{
      reviewers: { id: number; name: string; email: string; scientific_area_name: string }[];
    }>,

  assignReviewers: (id: number, reviewerOneId: number, reviewerTwoId: number) =>
    req('POST', `/api/v1/protocols/${id}/assign-reviewers`, {
      reviewer_one_id: reviewerOneId,
      reviewer_two_id: reviewerTwoId,
    }) as Promise<{ message: string; protocol: Protocol }>,

  listForReviewer: () => req('GET', '/api/v1/reviewer/protocols') as Promise<{ protocols: Protocol[] }>,
};