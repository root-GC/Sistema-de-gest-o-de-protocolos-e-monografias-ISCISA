// src/services/topicService.ts
import { req } from './apiClient';

// ============ Interfaces ============

export interface Topic {
  id: number;
  title: string;
  justification?: string | null;
  status: string;
  status_label: string;
  submitted_at: string;
  scientific_area?: { id: number; name: string };
  course?: { id: number; name: string };
  student?: { id: string; name: string; email: string };
  my_assignment?: TopicReviewAssignment | null;
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
  evaluation?: TopicReviewEvaluation | null;
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
  my_assignment?: any;
  course?: {
    id: number;
    name: string;
    code?: string;
  };
  scientific_area?: {
    id: number;
    name: string;
  };
}

export interface SimilarTopicsWarning {
  has_similar: boolean;
  items: { id: number; title: string }[];
}

export interface ScientificArea {
  id: number;
  name: string;
  organ_id: number;
  organ?: {
    id: number;
    name: string;
  };
}

export interface Course {
  id: number;
  name: string;
  code: string;
  scientific_area_id: number;
}

// ============ Helper para extrair dados ============

function extractData<T>(response: any): T[] {
  // Caso 1: Resposta paginada dentro de data
  if (response?.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  // Caso 2: Array direto em data
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Caso 3: Resposta paginada direta
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Fallback: array vazio
  return [];
}

// ============ Topic Service ============

export const topicService = {
  submit: (payload: { title: string; scientific_area_id: number; course_id: number; justification?: string | null }) =>
    req('POST', '/api/v1/topics', payload) as Promise<{
      message: string;
      topic: Topic;
      similar_topics_warning: SimilarTopicsWarning;
    }>,

  list: () => req('GET', '/api/v1/topics') as Promise<{ topics: Topic[] }>,

  /**
   * Busca os temas aprovados do estudante logado
   * GET /api/v1/topics/my-approved
   * Retorna: { success: true, data: ApprovedTopic[] }
   */
  getMyApprovedTopics: () =>
    req('GET', '/api/v1/topics/my-approved') as Promise<{ 
      success: boolean;
      data: ApprovedTopic[];
    }>,
 listForSupervisor: () =>
    req('GET', '/api/v1/supervisor/topics') as Promise<{ topics: Topic[]; total: number }>,
 
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

  getAssignedReviewers: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/reviewers`) as Promise<{
      reviewers: AssignedTopicReviewer[];
      review_assignments: TopicReviewAssignment[];
      total: number;
    }>,

  assignReviewers: (topicId: number, reviewerIds: number[]) =>
    req('POST', `/api/v1/topics/${topicId}/assign-reviewers`, { reviewer_ids: reviewerIds }),

  listForReviewer: () =>
    req('GET', '/api/v1/reviewer/topics') as Promise<{ topics: Topic[] }>,

  getComments: (topicId: number, filters: Record<string, string> = {}) =>
    req(
      'GET',
      `/api/v1/topics/${topicId}/comments${Object.keys(filters).length ? `?${new URLSearchParams(filters)}` : ''}`
    ) as Promise<{
      success: boolean;
      comments: TopicReviewComment[];
      pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>,

  submitComment: (topicId: number, content: string) =>
    req('POST', `/api/v1/topics/${topicId}/comments`, { content }),

  submitEvaluation: (topicId: number, decision: 'approved' | 'rejected', comment_id: number | null = null) =>
    req('POST', `/api/v1/topics/${topicId}/evaluations`, { decision, comment_id }) as Promise<{
      message: string;
      topic: Topic;
      evaluation: TopicReviewEvaluation;
    }>,
};

// ============ Scientific Area Service ============

export const scientificAreaService = {
  list: async (params?: { organ_id?: number }): Promise<ScientificArea[]> => {
    const query = params?.organ_id ? `?organ_id=${params.organ_id}` : '';
    const response = await req('GET', `/api/v1/scientific-areas${query}`);
    
    // Extrai os dados independente da estrutura
    const data = extractData<ScientificArea>(response);
    return data;
  },

  search: async (term: string): Promise<ScientificArea[]> => {
    const response = await req('GET', `/api/v1/scientific-areas/search?q=${encodeURIComponent(term)}`);
    return extractData<ScientificArea>(response);
  },

  getById: (id: number) =>
    req('GET', `/api/v1/scientific-areas/${id}`) as Promise<{
      success: boolean;
      data: ScientificArea;
    }>,
};

// ============ Course Service ============

export const courseService = {
  list: async (params?: { scientific_area_id?: number }): Promise<Course[]> => {
    const query = params?.scientific_area_id 
      ? `?scientific_area_id=${params.scientific_area_id}` 
      : '';
    const response = await req('GET', `/api/v1/courses${query}`);
    
    // Extrai os dados independente da estrutura
    const data = extractData<Course>(response);
    return data;
  },

  search: async (term: string): Promise<Course[]> => {
    const response = await req('GET', `/api/v1/courses/search?q=${encodeURIComponent(term)}`);
    return extractData<Course>(response);
  },

  getByCode: (code: string) =>
    req('GET', `/api/v1/courses/code/${encodeURIComponent(code)}`) as Promise<{
      success: boolean;
      data: Course;
    }>,

   
};
