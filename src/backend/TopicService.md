# O que já tenho e espero do backend:
// src/services/topicService.ts
import { req } from './apiClient';

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
  document_path?: string | null;       // 🆕 Caminho do documento .docx anexado
  document_name?: string | null;       // 🆕 Nome original do arquivo
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
  scientific_area?: { id: number; name: string };
  course?: { id: number; name: string; code?: string };
}

export interface SimilarTopicsWarning {
  has_similar: boolean;
  items: { id: number; title: string }[];
}

// ============ TOPIC SERVICE ============

export const topicService = {

  // ---------------------------------------------------------------------------
  // ESTUDANTE - Submeter novo tema
  // POST /api/v1/topics
  // Body: { title, scientific_area_id, course_id, justification?, document? }
  // ---------------------------------------------------------------------------
  /**
   * Submete um novo tema.
   * 
   * 📤 Request (multipart/form-data):
   *   - title: string (obrigatório)
   *   - scientific_area_id: number (obrigatório)
   *   - course_id: number (obrigatório)
   *   - justification: string (opcional)
   *   - document: File (opcional, .docx, máx 10MB)
   * 
   * 📥 Response:
   *   {
   *     "message": "Tema submetido com sucesso.",
   *     "topic": { ...Topic },
   *     "similar_topics_warning": {
   *       "has_similar": true/false,
   *       "items": [{ "id": 1, "title": "Tema similar..." }]
   *     }
   *   }
   */
  submit: (payload: {
    title: string;
    scientific_area_id: number;
    course_id: number;
    justification?: string | null;
    document?: File;  // 🆕 Suporte a upload
  }) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('scientific_area_id', String(payload.scientific_area_id));
    formData.append('course_id', String(payload.course_id));
    if (payload.justification) formData.append('justification', payload.justification);
    if (payload.document) formData.append('document', payload.document);
    
    return req('POST', '/api/v1/topics', formData, true) as Promise<{
      message: string;
      topic: Topic;
      similar_topics_warning: SimilarTopicsWarning;
    }>;
  },

  // ---------------------------------------------------------------------------
  // ESTUDANTE - Listar meus temas
  // GET /api/v1/topics
  // ---------------------------------------------------------------------------
  /**
   * Lista os temas do estudante logado.
   * 
   * 📥 Response:
   *   {
   *     "topics": [ ...Topic[] ]  // Array de temas do estudante
   *   }
   * 
   * Cada Topic deve incluir:
   *   - id, title, status, status_label, submitted_at
   *   - justification (se existir)
   *   - scientific_area: { id, name }
   *   - course: { id, name, code }
   *   - document_path, document_name (se documento anexado)
   */
  list: () =>
    req('GET', '/api/v1/topics') as Promise<{ topics: Topic[] }>,

  // ---------------------------------------------------------------------------
  // ESTUDANTE - Temas aprovados (para submeter protocolo)
  // GET /api/v1/topics/my-approved
  // ---------------------------------------------------------------------------
  /**
   * Lista temas aprovados do estudante para submissão de protocolo.
   * 
   * 📥 Response:
   *   {
   *     "success": true,
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "...",
   *         "justification": "...",
   *         "status": "topic_approved_nucleo",
   *         "status_label": "Aprovado",
   *         "submitted_at": "2024-01-15",
   *         "has_protocol": false,        // ⚠️ true se já tem protocolo ativo
   *         "scientific_area": { "id": 1, "name": "Ciências Biomédicas" },
   *         "course": { "id": 1, "name": "Medicina", "code": "MED" }
   *       }
   *     ]
   *   }
   */
  getMyApprovedTopics: () =>
    req('GET', '/api/v1/topics/my-approved') as Promise<{
      success: boolean;
      data: ApprovedTopic[];
    }>,

  // ---------------------------------------------------------------------------
  // SUPERVISOR - Listar temas dos tutorandos
  // GET /api/v1/supervisor/topics
  // ---------------------------------------------------------------------------
  /**
   * Lista temas dos estudantes supervisionados.
   * 
   * 📥 Response:
   *   {
   *     "topics": [ ...Topic[] ],
   *     "total": 5
   *   }
   * 
   * Cada Topic deve incluir:
   *   - student: { id, name, email }
   *   - status = "topic_pending_supervisor" para temas pendentes de aprovação
   */
  listForSupervisor: () =>
    req('GET', '/api/v1/supervisor/topics') as Promise<{ topics: Topic[]; total: number }>,

  // Alias para compatibilidade
  getForSupervisor: () =>
    req('GET', '/api/v1/supervisor/topics') as Promise<{ topics: Topic[]; total: number }>,

  // ---------------------------------------------------------------------------
  // SUPERVISOR - Aprovar tema
  // PATCH /api/v1/topics/{topicId}/supervisor-approve
  // ---------------------------------------------------------------------------
  /**
   * Supervisor aprova um tema.
   * 
   * 📥 Response:
   *   {
   *     "message": "Tema aprovado com sucesso."
   *   }
   */
  approveBySupervisor: (topicId: number) =>
    req('PATCH', `/api/v1/topics/${topicId}/supervisor-approve`),

  // ---------------------------------------------------------------------------
  // SUPERVISOR - Rejeitar tema
  // PATCH /api/v1/topics/{topicId}/supervisor-reject
  // Body: { justification }
  // ---------------------------------------------------------------------------
  /**
   * Supervisor rejeita um tema com justificativa.
   * 
   * 📤 Request: { "justification": "Motivo da rejeição" }
   * 
   * 📥 Response:
   *   {
   *     "message": "Tema rejeitado."
   *   }
   */
  rejectBySupervisor: (topicId: number, justification: string) =>
    req('PATCH', `/api/v1/topics/${topicId}/supervisor-reject`, { justification }),

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Listar temas para o núcleo
  // GET /api/v1/secretary/topics
  // ---------------------------------------------------------------------------
  /**
   * Lista todos os temas que chegaram ao núcleo.
   * 
   * 📥 Response:
   *   {
   *     "topics": [ ...Topic[] ],
   *     "total": 10
   *   }
   * 
   * Status relevantes:
   *   - "topic_pending_nucleo" → Pendente de atribuição de revisores
   *   - "topic_assigned_for_review" → Revisores já atribuídos
   *   - "topic_in_review" → Em processo de revisão
   *   - "topic_approved_nucleo" → Aprovado pelo núcleo
   *   - "topic_rejected" → Rejeitado
   */
  listForSecretary: () =>
    req('GET', '/api/v1/secretary/topics') as Promise<{ topics: Topic[]; total: number }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Revisores elegíveis para um tema
  // GET /api/v1/topics/{topicId}/eligible-reviewers
  // ---------------------------------------------------------------------------
  /**
   * Lista revisores elegíveis para avaliar um tema.
   * 
   * 📥 Response:
   *   {
   *     "reviewers": [
   *       { "id": 1, "name": "Prof. Doutor Armando Macuácua" },
   *       { "id": 2, "name": "Dra. Carla Mondlane" }
   *     ],
   *     "total": 2
   *   }
   */
  eligibleReviewers: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/eligible-reviewers`) as Promise<{
      reviewers: { id: number; name: string }[];
      total: number;
    }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Revisores já atribuídos a um tema
  // GET /api/v1/topics/{topicId}/reviewers
  // ---------------------------------------------------------------------------
  /**
   * Lista revisores já atribuídos a um tema.
   * 
   * 📥 Response:
   *   {
   *     "reviewers": [
   *       {
   *         "id": 1,
   *         "name": "Prof. Doutor Armando Macuácua",
   *         "email": "armando@iscisa.ac.mz",
   *         "assignment_id": 10,
   *         "assigned_at": "2024-02-15",
   *         "evaluation": null  // ou { decision: "approved", ... }
   *       }
   *     ],
   *     "total": 2
   *   }
   */
  getAssignedReviewers: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/reviewers`) as Promise<{
      reviewers: AssignedTopicReviewer[];
      total: number;
    }>,

  // ---------------------------------------------------------------------------
  // SECRETÁRIO - Atribuir revisores a um tema
  // POST /api/v1/topics/{topicId}/assign-reviewers
  // Body: { reviewer_ids: number[] }
  // ---------------------------------------------------------------------------
  /**
   * Atribui revisores a um tema.
   * 
   * 📤 Request: { "reviewer_ids": [1, 2, 3] }
   * 
   * 📥 Response:
   *   {
   *     "message": "Revisores atribuídos com sucesso."
   *   }
   */
  assignReviewers: (topicId: number, reviewerIds: number[]) =>
    req('POST', `/api/v1/topics/${topicId}/assign-reviewers`, { reviewer_ids: reviewerIds }),

  // ---------------------------------------------------------------------------
  // REVISOR - Listar temas para revisão
  // GET /api/v1/reviewer/topics
  // ---------------------------------------------------------------------------
  /**
   * Lista temas atribuídos ao revisor logado.
   * 
   * 📥 Response:
   *   {
   *     "topics": [
   *       {
   *         ...Topic,
   *         "my_assignment": {
   *           "id": 10,
   *           "assigned_at": "2024-02-15",
   *           "evaluation": null  // ou { decision: "approved", ... }
   *         }
   *       }
   *     ]
   *   }
   */
  listForReviewer: () =>
    req('GET', '/api/v1/reviewer/topics') as Promise<{ topics: Topic[] }>,

  // ---------------------------------------------------------------------------
  // REVISOR - Comentários de um tema
  // GET /api/v1/topics/{topicId}/comments
  // ---------------------------------------------------------------------------
  /**
   * Lista comentários/revisões de um tema.
   * 
   * 📥 Response:
   *   {
   *     "success": true,
   *     "comments": [
   *       {
   *         "id": 1,
   *         "content": "Metodologia bem estruturada...",
   *         "created_at": "2024-02-15",
   *         "user": { "id": 1, "name": "Prof. Armando" }
   *       }
   *     ]
   *   }
   */
  getComments: (topicId: number) =>
    req('GET', `/api/v1/topics/${topicId}/comments`) as Promise<{
      success: boolean;
      comments: TopicReviewComment[];
    }>,

  // ---------------------------------------------------------------------------
  // REVISOR - Submeter comentário
  // POST /api/v1/topics/{topicId}/comments
  // Body: { content }
  // ---------------------------------------------------------------------------
  /**
   * Submete um comentário de revisão.
   * 
   * 📤 Request: { "content": "Texto do comentário..." }
   * 
   * 📥 Response:
   *   {
   *     "message": "Comentário submetido.",
   *     "comment": { ...TopicReviewComment }
   *   }
   */
  submitComment: (topicId: number, content: string) =>
    req('POST', `/api/v1/topics/${topicId}/comments`, { content }),

  // ---------------------------------------------------------------------------
  // REVISOR - Submeter avaliação final
  // POST /api/v1/topics/{topicId}/evaluations
  // Body: { decision, comment_id? }
  // ---------------------------------------------------------------------------
  /**
   * Submete a avaliação final (aprovar/rejeitar).
   * 
   * 📤 Request: { "decision": "approved" | "rejected", "comment_id": null }
   * 
   * 📥 Response:
   *   {
   *     "message": "Avaliação submetida.",
   *     "evaluation": { ...TopicReviewEvaluation }
   *   }
   */
  submitEvaluation: (topicId: number, decision: 'approved' | 'rejected', comment_id: number | null = null) =>
    req('POST', `/api/v1/topics/${topicId}/evaluations`, { decision, comment_id }) as Promise<{
      message: string;
      topic: Topic;
      evaluation: TopicReviewEvaluation;
    }>,
};






# Resumo:
#	Método	Endpoint	Quem usa	O que retorna
1	POST	/api/v1/topics	Estudante	{ message, topic, similar_topics_warning }
2	GET	/api/v1/topics	Estudante	{ topics: Topic[] }
3	GET	/api/v1/topics/my-approved	Estudante	{ success, data: ApprovedTopic[] }
4	GET	/api/v1/supervisor/topics	Supervisor	{ topics: Topic[], total }
5	PATCH	/api/v1/topics/{id}/supervisor-approve	Supervisor	{ message }
6	PATCH	/api/v1/topics/{id}/supervisor-reject	Supervisor	{ message }
7	GET	/api/v1/secretary/topics	Secretário	{ topics: Topic[], total }
8	GET	/api/v1/topics/{id}/eligible-reviewers	Secretário	{ reviewers: [{id,name}], total }
9	GET	/api/v1/topics/{id}/reviewers	Secretário	{ reviewers: AssignedReviewer[], total }
10	POST	/api/v1/topics/{id}/assign-reviewers	Secretário	{ message }
11	GET	/api/v1/reviewer/topics	Revisor	{ topics: Topic[] }
12	GET	/api/v1/topics/{id}/comments	Revisor	{ success, comments }
13	POST	/api/v1/topics/{id}/comments	Revisor	{ message, comment }
14	POST	/api/v1/topics/{id}/evaluations	Revisor	{ message, evaluation }
