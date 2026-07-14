// src/services/protocolService.ts
import { req, reqFormData } from './apiClient';

export interface Protocol {
  id: number;
  code: string;
  topic_id: number;
  topic?: {
    id: number;
    title: string;
    status: string;
  };
  status: string;
  status_label: string;
  protocol_type: string;
  submission_number: number;
  version: string;
  submitted_at: string;
  justification?: string;
  supervisor_id?: number;
  student?: {
    id: number;
    name: string;
    email: string;
  };
  supervisor?: {
    id: number;
    name: string;
    email: string;
  };
  documents?: Document[];
  review_assignments?: ReviewAssignment[];
}

export interface Document {
  id: number;
  file_name: string;
  file_url: string;
  file_path: string;
  status: string;
  version: number;
}

export interface ReviewAssignment {
  id: number;
  reviewer_one?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  reviewer_two?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export interface EligibleReviewer {
  id: number;
  name: string;
  email: string;
  scientific_area_name: string;
}

export const protocolService = {
  submit: (topicId: number, protocolType: string, file: File) => {
    const formData = new FormData();
    formData.append('topic_id', String(topicId));
    formData.append('protocol_type', protocolType);
    formData.append('document', file);
    return reqFormData('POST', '/api/v1/protocols', formData) as Promise<{
      message: string;
      protocol: Protocol;
    }>;
  },

  list: () => req('GET', '/api/v1/protocols') as Promise<{ protocols: Protocol[] }>,

  getById: (id: number) => req('GET', `/api/v1/protocols/${id}`) as Promise<{ protocol: Protocol }>,

  // Supervisor
  listForSupervisor: () => 
    req('GET', '/api/v1/supervisor/protocols') as Promise<{ protocols: Protocol[] }>,

  approveBySupervisor: (protocolId: number) =>
    req('PATCH', `/api/v1/protocols/${protocolId}/supervisor-approve`) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  rejectBySupervisor: (protocolId: number, justification?: string) =>
    req('PATCH', `/api/v1/protocols/${protocolId}/supervisor-reject`, { justification }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  // Secretary
  listForSecretary: () =>
    req('GET', '/api/v1/secretary/protocols') as Promise<{ protocols: Protocol[] }>,

  getEligibleReviewers: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/eligible-reviewers`) as Promise<{
      reviewers: EligibleReviewer[];
    }>,

  assignReviewers: (protocolId: number, reviewerOneId: number, reviewerTwoId: number) =>
    req('POST', `/api/v1/protocols/${protocolId}/assign-reviewers`, {
      reviewer_one_id: reviewerOneId,
      reviewer_two_id: reviewerTwoId,
    }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  // Reviewer
  listForReviewer: () =>
    req('GET', '/api/v1/reviewer/protocols') as Promise<{ protocols: Protocol[] }>,
};