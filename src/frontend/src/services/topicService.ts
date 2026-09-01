// src/services/topicService.ts
import { req, reqFormData } from './apiClient';

// ============ INTERFACES ============

export interface Topic {
  id: number;
  title: string;
  justification?: string | null;
  status: string;
  status_label: string;
  submitted_at: string;
  scientific_area?: { id: number; name: string };
  course?: { id: number; name: string; code?: string };
  student?: { id: string; name: string; email: string };
  has_document?: boolean;
  document_name?: string | null;
  my_assignment?: TopicReviewAssignment | null;
  review_assignments?: TopicReviewAssignment[];
  histories?: TopicHistory[];
}

export interface TopicReviewComment {
  id: number;
  content: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface TopicReviewEvaluation {
  id?: number;
  decision: 'approved' | 'rejected' | null;
  comment?: TopicReviewComment | null;
  comments?: string | null;
  evaluated_at?: string | null;
}

export interface TopicReviewAssignment {
  id: number;
  assigned_at?: string;
  reviewer?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
  evaluation?: TopicReviewEvaluation | null;
}

export interface TopicHistory {
  id: number;
  organ_id?: number | null;
  action: string;
  action_label?: string | null;
  description?: string | null;
  old_status?: string | null;
  old_status_label?: string | null;
  new_status?: string | null;
  new_status_label?: string | null;
  metadata?: Record<string, unknown> | null;
  occurred_at: string;
  actor?: {
    id: number;
    name: string;
    email?: string;
  } | null;
}

export interface AssignedTopicReviewer {
  id: number;
  name: string | null;
  email?: string | null;
  assignment_id: number;
  assigned_at?: string;
  evaluation?: TopicReviewEvaluation | null;
}

export interface ApprovedTopic {
  id: number;
  title: string;
  justification?: string | null;
  status: string;
  status_label: string;
  submitted_at: string;
  has_protocol?: boolean;
  has_any_protocol?: boolean;
  can_resubmit_protocol?: boolean;
  latest_protocol_id?: number | null;
  latest_protocol_status?: string | null;
  latest_protocol_status_label?: string | null;
  scientific_area?: { id: number; name: string };
  course?: { id: number; name: string; code?: string };
}

export interface SimilarTopicsWarning {
  has_similar: boolean;
  items: { id: number; title: string }[];
}

// 🆕 Interface para revisores elegíveis com contagem de pendências
export interface EligibleReviewer {
  id: number;
  name: string;
  email?: string | null;
  pending_reviews_count?: number;
  pending_topic_reviews_count?: number;
  pending_protocol_reviews_count?: number;
}

// ============ TOPIC SERVICE ============

export const topicService = {

  // ---------------------------------------------------------------------------
  // ESTUDANTE - Submeter novo tema
  // POST /api/v1/topics
  // ---------------------------------------------------------------------------
  submit: (payload: {
    title: string;
    scientific_area_id: number;
    course_id: number;
    justification?: string | null;
    document?: File;
  }) => {
    const formData = new FormData();
    
    // 🐛 DEBUG
    console.log('📤 Enviando payload:', {
      title: payload.title,
      scientific_area_id: payload.scientific_area_id,
      course_id: payload.course_id,
      justification: payload.justification,
      document: payload.document?.name
    });
    
    formData.append('title', payload.title);
    formData.append('scientific_area_id', String(payload.scientific_area_id));
    formData.append('course_id', String(payload.course_id));
    
    if (payload.justification) {
      formData.append('justification', payload.justification);
    }
    
    if (payload.document) {
      formData.append('document', payload.document);
    }
    
    // 🆕 Use reqFormData para multipart/form-data
    return reqFormData('POST', '/api/v1/topics', formData) as Promise<{
      message: string;
      topic: Topic;
      similar_topics_warning: SimilarTopicsWarning;
    }>;
  },

  // ---------------------------------------------------------------------------
  // ESTUDANTE - Listar meus temas
  // GET /api/v1/topics
  // ---------------------------------------------------------------------------
  list: () =>
    req('GET', '/api/v1/topics') as Promise<{ topics: Topic[] }>,

  downloadDocument: (topicId: number) =>
    `/api/v1/topics/${topicId}/document`,

  // ---------------------------------------------------------------------------
  // ESTUDANTE - Temas aprovados (para submeter protocolo)
  // GET /api/v1/topics/my-approved
  // ---------------------------------------------------------------------------
  getMyApprovedTopics: () =>
    req('GET', '/api/v1/topics/my-approved') as Promise<{
      success: boolean;
      data: ApprovedTopic[];
    }>,

  // ---------------------------------------------------------------------------
  // SUPERVISOR - Listar temas dos tutorandos
  // GET /api/v1/supervisor/topics
  // ---------------------------------------------------------------------------
  listForSupervisor: () =>
    req('GET', '/api/v1/supervisor/topics') as Promise<{ topics: Topic[]; total: number }>,

  getForSupervisor: () =>
    req('GET', '/api/v1/supervisor/topics') as Promise<{ topics: Topic[]; total: number }>,

  // ---------------------------------------------------------------------------
  // SUPERVISOR - Aprovar tema
  // PATCH /api/v1/topics/{topicId}/supervisor-approve
  // ---------------------------------------------------------------------------
  approveBySupervisor: (topicId: number, comment?: string) =>
    req('PATCH', `/api/v1/topics/${topicId}/supervisor-approve`, { comment }),

  // ---------------------------------------------------------------------------
  // SUPERVISOR - Não Aprovar tema
  // PATCH /api/v1/topics/{topicId}/supervisor-reject
  // ---------------------------------------------------------------------------
  rejectBySupervisor: (topicId: number, justification: string) =>
    req('PATCH', `/api/v1/topics/${topicId}/supervisor-reject`, { comment: justification }),

  submitSupervisorComment: (topicId: number, content: string) =>
    req('POST', `/api/v1/topics/${topicId}/supervisor-comments`, { content }) as Promise<{
      message: string;
      comment: TopicReviewComment;
    }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Listar temas para o núcleo
  // GET /api/v1/secretary/topics
  // ---------------------------------------------------------------------------
  listForSecretary: () =>
    req('GET', '/api/v1/secretary/topics') as Promise<{ topics: Topic[]; total: number }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Revisores elegíveis para um tema
  // GET /api/v1/topics/{topicId}/eligible-reviewers
  // ---------------------------------------------------------------------------
  eligibleReviewers: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/eligible-reviewers`) as Promise<{
      reviewers: EligibleReviewer[];
      total: number;
    }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Revisores já atribuídos a um tema
  // GET /api/v1/topics/{topicId}/reviewers
  // ---------------------------------------------------------------------------
  getAssignedReviewers: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/reviewers`) as Promise<{
      reviewers: AssignedTopicReviewer[];
      total: number;
    }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Atribuir revisores a um tema
  // POST /api/v1/topics/{topicId}/assign-reviewers
  // ---------------------------------------------------------------------------
  assignReviewers: (topicId: number, reviewerIds: number[]) =>
    req('POST', `/api/v1/topics/${topicId}/assign-reviewers`, { reviewer_ids: reviewerIds }),

  // ---------------------------------------------------------------------------
  // REVISOR - Listar temas para revisão
  // GET /api/v1/reviewer/topics
  // ---------------------------------------------------------------------------
  listForReviewer: () =>
    req('GET', '/api/v1/reviewer/topics') as Promise<{ topics: Topic[] }>,

  // ---------------------------------------------------------------------------
  // REVISOR - Comentários de um tema
  // GET /api/v1/topics/{topicId}/comments
  // ---------------------------------------------------------------------------
  getComments: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/comments`) as Promise<{
      success: boolean;
      comments: TopicReviewComment[];
    }>,

  // ---------------------------------------------------------------------------
  // REVISOR - Submeter comentário
  // POST /api/v1/topics/{topicId}/comments
  // ---------------------------------------------------------------------------
  submitComment: (topicId: number, content: string) =>
    req('POST', `/api/v1/topics/${topicId}/comments`, { content }),

  // ---------------------------------------------------------------------------
  // REVISOR - Submeter avaliação final
  // POST /api/v1/topics/{topicId}/evaluations
  // ---------------------------------------------------------------------------
  submitEvaluation: (topicId: number, decision: 'approved' | 'rejected', comment_id: number | null = null) =>
    req('POST', `/api/v1/topics/${topicId}/evaluations`, { decision, comment_id }) as Promise<{
      message: string;
      topic: Topic;
      evaluation: TopicReviewEvaluation;
    }>,
};
