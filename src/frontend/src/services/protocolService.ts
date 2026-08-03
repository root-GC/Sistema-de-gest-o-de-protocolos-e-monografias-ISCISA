// src/services/protocolService.ts
import { downloadApiFile, openApiFile, req, reqFormData } from './apiClient';

export interface Protocol {
  id: number;
  code: string;
  topic_id: number;
  topic?: {
    id: number;
    title: string;
    justification?: string | null;
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
  protocol_document_requirements?: ProtocolDocumentRequirement[];
  histories?: ProtocolHistory[];
  organ_tracking?: ProtocolOrganTracking | null;
  read_only_for_organ?: boolean | null;
  is_historical_for_organ?: boolean | null;
  latest_document?: {
    id: number;
    file_name: string;
    file_url: string;
    download_url?: string;
    file_path: string;
    version: number;
    status: string;
  } | null;
  review_assignments?: ReviewAssignment[];
}

export interface ProtocolHistory {
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
  organ?: {
    id: number;
    name: string;
    type: string;
  } | null;
}

export interface ProtocolOrganTracking {
  organ_id: number;
  organ_name: string;
  organ_type: string;
  form_organ?: string | null;
  is_current: boolean;
  is_historical: boolean;
  status_label?: string | null;
  latest_action?: string | null;
  latest_action_label?: string | null;
  latest_action_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  history?: ProtocolHistory[];
  latest_opinion?: {
    id: number;
    decision: string;
    issued_at: string;
    version: string;
    download_url?: string | null;
    evaluation_form_download_url?: string | null;
  } | null;
}

export interface Document {
  id: number;
  file_name: string;
  file_url: string;
  file_path: string;
  download_url?: string;
  status: string;
  version: number;
  version_label?: string | null;
  rejected_by?: {
    id: number;
    name: string;
    email?: string | null;
  } | null;
  rejected_at?: string | null;
  submitted_at?: string;
}

export const CC_REQUIRED_DOCUMENTS = [
  { key: 'cover_letter', name: 'Carta de cobertura' },
  { key: 'credentials', name: 'Credenciais' },
  { key: 'originality_declaration', name: 'Declaração de originalidade' },
  { key: 'academic_record_declaration', name: 'Declaração do registo académico' },
  { key: 'financial_statement_declaration', name: 'Declaração do extracto financeiro' },
  { key: 'authors_responsibility_list', name: 'Lista de autores e responsabilidade' },
] as const;

export type CCRequiredDocumentKey = typeof CC_REQUIRED_DOCUMENTS[number]['key'];

export type CCRequiredDocumentFiles = Record<CCRequiredDocumentKey, File | null>;

export interface ProtocolDocumentRequirement {
  id: number;
  protocol_id: number;
  document_key: CCRequiredDocumentKey | string;
  nome: string;
  required_for_organ: string;
  file_path?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  download_url?: string | null;
  enviado: boolean;
  aprovado: boolean | null;
  rejection_reason?: string | null;
  status_label?: string;
  reviewed_at?: string | null;
  reviewer?: {
    id: number;
    name: string;
    email?: string;
  } | null;
}

export interface ReviewAssignment {
  id: number;
  is_primary?: boolean;
  reviewer_one?: {
    id: number;
    name?: string | null;
    email?: string | null;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  reviewer_two?: {
    id: number;
    name?: string | null;
    email?: string | null;
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
  scientific_area_id?: number;
  scientific_area_name?: string | null;
  is_same_scientific_area?: boolean;
  active_works?: number;
}

export interface AssignedProtocolReviewer {
  id: number;
  name: string | null;
  email?: string | null;
  slot: 'reviewer_one' | 'reviewer_two';
  assignment_id: number;
  organ_id?: number;
  organ?: {
    id: number;
    name: string;
    type: string;
  } | null;
  status?: string;
  review_order?: boolean;
  is_primary?: boolean;
  role?: 'primary' | 'reviewer' | string;
  assigned_at?: string;
}

export interface ProtocolOpinion {
  id: number;
  version: string;
  organ: string;
  decision: string;
  observations?: string | null;
  issued_at: string;
  issued_by?: {
    id: number;
    name: string;
  } | null;
  document_url?: string | null;
  download_url?: string | null;
  evaluation_form_download_url?: string | null;
}

// Tipo para o documento revisado enviado pelo revisor
export interface ReviewedDocument {
  id: number;
  file_name: string;
  file_url: string;
  download_url?: string;
  file_path: string;
  version: number;
  status: string;
  uploaded_at: string;
}

export const protocolService = {
  // ── Submissão de protocolo ──────────────────────────
  submit: (topicId: number, protocolType: string, file: File, requiredDocuments: CCRequiredDocumentFiles) => {
    const formData = new FormData();
    formData.append('topic_id', String(topicId));
    formData.append('protocol_type', protocolType);
    formData.append('document', file);
    CC_REQUIRED_DOCUMENTS.forEach(doc => {
      const attachment = requiredDocuments[doc.key];
      if (attachment) {
        formData.append(`required_documents[${doc.key}]`, attachment);
      }
    });
    return reqFormData('POST', '/api/v1/protocols', formData) as Promise<{
      message: string;
      protocol: Protocol;
    }>;
  },

  // ── Listagem e consulta ─────────────────────────────
  list: () => req('GET', '/api/v1/protocols') as Promise<{ protocols: Protocol[] }>,

  getById: (id: number) => req('GET', `/api/v1/protocols/${id}`) as Promise<{ protocol: Protocol }>,

  history: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/history`) as Promise<{ history: ProtocolHistory[] }>,

  listRequiredDocuments: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/required-documents`) as Promise<{
      documents: ProtocolDocumentRequirement[];
    }>,

  uploadRequiredDocument: (protocolId: number, requirementId: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return reqFormData('POST', `/api/v1/protocols/${protocolId}/required-documents/${requirementId}/upload`, formData) as Promise<{
      message: string;
      document: ProtocolDocumentRequirement;
    }>;
  },

  approveRequiredDocument: (protocolId: number, requirementId: number) =>
    req('PATCH', `/api/v1/protocols/${protocolId}/required-documents/${requirementId}/approve`) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  rejectRequiredDocument: (protocolId: number, requirementId: number, rejectionReason: string) =>
    req('PATCH', `/api/v1/protocols/${protocolId}/required-documents/${requirementId}/reject`, {
      rejection_reason: rejectionReason,
    }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  listOpinions: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/opinions`) as Promise<{ opinions: ProtocolOpinion[] }>,

  // ── Ficheiros ───────────────────────────────────────
  openFile: (url: string, fallbackFilename?: string) => openApiFile(url, fallbackFilename),

  downloadFile: (url: string, fallbackFilename?: string) => downloadApiFile(url, fallbackFilename),

  // ── Upload de documento revisado pelo revisor ───────
  uploadReviewedDocument: (protocolId: number, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('protocol_id', String(protocolId));
    formData.append('type', 'reviewed');
    return reqFormData('POST', `/api/v1/protocols/${protocolId}/upload-reviewed`, formData) as Promise<{
      message: string;
      document: ReviewedDocument;
    }>;
  },

  removeReviewedDocument: (protocolId: number, documentId: number) =>
    req('DELETE', `/api/v1/protocols/${protocolId}/reviewed-documents/${documentId}`) as Promise<{
      message: string;
    }>,

  listReviewedDocuments: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/reviewed-documents`) as Promise<{
      documents: ReviewedDocument[];
    }>,

  // ── Supervisor ──────────────────────────────────────
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

  // ── Secretary ───────────────────────────────────────
  listForSecretary: () =>
    req('GET', '/api/v1/nucleo/secretary/protocols') as Promise<{ protocols: Protocol[] }>,

  getEligibleReviewers: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/eligible-reviewers`) as Promise<{
      reviewers: EligibleReviewer[];
    }>,

  getAssignedReviewers: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/reviewers`) as Promise<{
      reviewers: AssignedProtocolReviewer[];
      review_assignments: ReviewAssignment[];
      total: number;
    }>,

  assignReviewers: (protocolId: number, reviewerOneId: number, reviewerTwoId: number) =>
    req('POST', `/api/v1/protocols/${protocolId}/assign-reviewers`, {
      reviewer_one_id: reviewerOneId,
      reviewer_two_id: reviewerTwoId,
    }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  // ── Núcleo Científico ───────────────────────────────
  getEligibleReviewersNucleo: (protocolId: number) =>
    req('GET', `/api/v1/nucleo/protocols/${protocolId}/eligible-reviewers`) as Promise<{
      reviewers: EligibleReviewer[];
    }>,

  getAssignedReviewersNucleo: (protocolId: number) =>
    req('GET', `/api/v1/nucleo/protocols/${protocolId}/reviewers`) as Promise<{
      reviewers: AssignedProtocolReviewer[];
      review_assignments: ReviewAssignment[];
      total: number;
    }>,

  assignReviewersNucleo: (protocolId: number, reviewerOneId: number, reviewerTwoId: number) =>
    req('POST', `/api/v1/nucleo/protocols/${protocolId}/assign-reviewers`, {
      reviewer_one_id: reviewerOneId,
      reviewer_two_id: reviewerTwoId,
    }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  // ── Comité Científico (CC) ──────────────────────────
  listForSecretaryCC: () =>
    req('GET', '/api/v1/comite-cientifico/secretary/protocols') as Promise<{ protocols: Protocol[] }>,

  getEligibleReviewersCC: (protocolId: number) =>
    req('GET', `/api/v1/comite-cientifico/protocols/${protocolId}/eligible-reviewers`) as Promise<{
      reviewers: EligibleReviewer[];
    }>,

  getAssignedReviewersCC: (protocolId: number) =>
    req('GET', `/api/v1/comite-cientifico/protocols/${protocolId}/reviewers`) as Promise<{
      reviewers: AssignedProtocolReviewer[];
      review_assignments: ReviewAssignment[];
      total: number;
    }>,

  assignReviewersCC: (protocolId: number, reviewerOneId: number, reviewerTwoId: number) =>
    req('POST', `/api/v1/comite-cientifico/protocols/${protocolId}/assign-reviewers`, {
      reviewer_one_id: reviewerOneId,
      reviewer_two_id: reviewerTwoId,
    }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  // ── Comité de Bioética ──────────────────────────────
  listForSecretaryBioetica: () =>
    req('GET', '/api/v1/comite-bioetica/secretary/protocols') as Promise<{ protocols: Protocol[] }>,

  getEligibleReviewersBioetica: (protocolId: number) =>
    req('GET', `/api/v1/comite-bioetica/protocols/${protocolId}/eligible-reviewers`) as Promise<{
      reviewers: EligibleReviewer[];
    }>,

  getAssignedReviewersBioetica: (protocolId: number) =>
    req('GET', `/api/v1/comite-bioetica/protocols/${protocolId}/reviewers`) as Promise<{
      reviewers: AssignedProtocolReviewer[];
      review_assignments: ReviewAssignment[];
      total: number;
    }>,

  assignReviewersBioetica: (protocolId: number, primaryReviewerId: number, reviewerIds: number[]) =>
    req('POST', `/api/v1/comite-bioetica/protocols/${protocolId}/assign-reviewers`, {
      primary_reviewer_id: primaryReviewerId,
      reviewer_ids: reviewerIds,
    }) as Promise<{
      message: string;
      protocol: Protocol;
    }>,

  // ── Reviewer ────────────────────────────────────────
  listForReviewer: () =>
    req('GET', '/api/v1/nucleo/reviewer/protocols') as Promise<{ protocols: Protocol[] }>,
};
