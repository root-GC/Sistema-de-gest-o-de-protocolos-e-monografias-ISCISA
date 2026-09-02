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
    scientific_area?: {
      id: number;
      name: string;
    } | null;
    course?: {
      id: number;
      name: string;
      code?: string | null;
    } | null;
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
    download_url?: string;
    version: number;
    status: string;
  } | null;
  my_assignment?: ReviewAssignment | null;
  review_assignments?: ReviewAssignment[];
  reviewer_attachments?: ReviewerProtocolAttachment[];
  review_history?: ReviewerProtocolHistory[];
}

export interface ReviewerProtocolAttachment {
  id: number;
  name: string;
  file_name?: string | null;
  download_url?: string | null;
  is_optional: boolean;
  uploaded: boolean;
  approved: boolean | null;
  status_label: string;
}

export interface ReviewerProtocolHistory {
  id: number;
  action: string;
  description?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  occurred_at: string;
  actor?: {
    id: number;
    name: string;
  } | null;
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
    is_signed?: boolean;
    signed_at?: string | null;
    signed_by?: string | null;
    signed_download_url?: string | null;
  } | null;
}

export interface Document {
  id: number;
  file_name: string;
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

export interface ProtocolReviewComment {
  id: number;
  content: string;
  stage: string;
  created_at: string;
  user?: { id: number; name: string; email?: string };
}

export interface ProtocolReviewContext {
  protocol: { id: number; code: string; submission_number: number; version: string };
  documents: Array<{ id: number; submission_number: number; label: string; file_name: string; created_at: string; download_url: string }>;
  topic: {
    id: number;
    title: string;
    document_name?: string | null;
    download_url?: string | null;
    comments: Array<{ id: number; content: string; created_at: string; author?: { name: string } | null }>;
    evaluations: Array<{ decision?: string | null; evaluated_at?: string | null; comment?: string | null }>;
  } | null;
  cc_context?: {
    forms: Array<{ id: number; version: string; decision?: string | null; conclusion_summary?: string | null; source_document_id?: number | null; reviews: Array<{ status?: string | null; decision?: string | null; overall_comment?: string | null; submitted_at?: string | null; reviewer?: string | null }>; evaluation_form_download_url: string; opinions: Array<{ id: number; download_url: string; signed_download_url?: string | null }> }>;
    supervisor_comments: Array<{ id: number; content: string; created_at: string; author?: string | null }>;
  };
}

export const CC_REQUIRED_DOCUMENTS = [
  { key: 'cover_letter', name: 'Carta de cobertura' },
  { key: 'credentials', name: 'Credenciais' },
  { key: 'originality_declaration', name: 'Declaração de originalidade' },
  { key: 'academic_record_declaration', name: 'Declaração do registo académico' },
  { key: 'financial_statement_declaration', name: 'Declaração do extracto financeiro' },
  { key: 'authors_responsibility_list', name: 'Lista de autores e responsabilidade' },
  { key: 'folha_info_instrucoes', name: 'Folha de informação ao participante – instruções de preenchimento' },
  { key: 'folha_info_participante', name: 'Folha de informação ao participante' },
  { key: 'consentimento_participante', name: 'Termo de consentimento livre e informado do participante' },
  { key: 'carta_autorizacao_supervisor', name: 'Carta de autorização do supervisor para a submissão do protocolo (actualizada)' },
  { key: 'cv_estudante', name: 'Curriculum Vitae do estudante ou pesquisador' },
  { key: 'cv_supervisor', name: 'Curriculum Vitae do supervisor (e do co-supervisor, caso aplicável)' },
] as const;

export type CCRequiredDocumentKey = typeof CC_REQUIRED_DOCUMENTS[number]['key'];

export type CCRequiredDocumentFiles = Record<CCRequiredDocumentKey, File | null>;

export const CIBS_REQUIRED_DOCUMENTS = [
  { key: 'carta_revisao_bioetica_cibs', name: 'Carta de solicitação de revisão bioética ao CIBS-ISCISA' },
  { key: 'declaracao_compromisso_bioetica_cibs', name: 'Declaração de compromisso do estudante ou investigador, em cumprir os princípios de bioética e aceitação das normas e procedimentos do CIBS-ISCISA' },
  { key: 'declaracao_conflito_interesses', name: 'Declaração de comunicação de conflito de interesse' },
] as const;

export type CIBSDocumentKey = typeof CIBS_REQUIRED_DOCUMENTS[number]['key'];

export type CIBSDocumentFiles = Record<CIBSDocumentKey, File | null>;

export interface SubmissionDocumentRequirement {
  id: number;
  organ_id: number;
  document_key: string;
  name: string;
  description?: string | null;
  is_optional: boolean;
  is_active: boolean;
}

export type SubmissionDocumentFiles = Record<string, File | null>;

export const OPTIONAL_DOCUMENTS = [
  { key: 'consentimento_tutor', name: 'Termo de consentimento livre e informado do pai/mãe ou tutor legal da criança menor de dezoito anos de idade (caso aplicável)' },
  { key: 'assentimento_menor', name: 'Termo de assentimento do participante menor, de doze a dezassete anos de idade (caso aplicável)' },
] as const;

export interface OtherDocument {
  name: string;
  file: File | null;
}

export interface ProtocolDocumentRequirement {
  id: number;
  protocol_id: number;
  document_key: CCRequiredDocumentKey | string;
  nome: string;
  required_for_organ: string;
  is_optional?: boolean;
  file_name?: string | null;
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
  organ_id?: number | null;
  status?: string | null;
  review_order?: boolean;
  is_primary?: boolean;
  assigned_at?: string | null;
  organ?: {
    id: number;
    name: string;
    type: string;
  } | null;
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
  is_signed?: boolean;
  signed_at?: string | null;
  signed_by?: {
    id: number;
    name: string;
  } | null;
  signed_download_url?: string | null;
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
  submissionRequirements: () =>
    req('GET', '/api/v1/protocol-submission-requirements') as Promise<{
      requirements: Record<'comite_cientifico' | 'comite_bioetica', SubmissionDocumentRequirement[]>;
    }>,

  submitDynamic: (
    topicId: number,
    protocolType: string,
    file: File,
    requiredDocuments: SubmissionDocumentFiles,
    cibsDocuments: SubmissionDocumentFiles,
    otherDocuments?: OtherDocument[],
  ) => {
    const formData = new FormData();
    formData.append('topic_id', String(topicId));
    formData.append('protocol_type', protocolType);
    formData.append('document', file);
    Object.entries(requiredDocuments).forEach(([key, attachment]) => {
      if (attachment) formData.append('required_documents[' + key + ']', attachment);
    });
    Object.entries(cibsDocuments).forEach(([key, attachment]) => {
      if (attachment) formData.append('cibs_documents[' + key + ']', attachment);
    });
    (otherDocuments ?? []).forEach((other, index) => {
      if (other.file) {
        formData.append('other_documents[' + index + ']', other.file);
        formData.append('other_document_names[' + index + ']', other.name);
      }
    });
    return reqFormData('POST', '/api/v1/protocols', formData) as Promise<{ message: string; protocol: Protocol }>;
  },

  // ── Submissão de protocolo ──────────────────────────
  submit: (
    topicId: number,
    protocolType: string,
    file: File,
    requiredDocuments: CCRequiredDocumentFiles,
    cibsDocuments?: CIBSDocumentFiles,
    otherDocuments?: OtherDocument[],
  ) => {
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
    CIBS_REQUIRED_DOCUMENTS.forEach(doc => {
      const attachment = cibsDocuments?.[doc.key];
      if (attachment) {
        formData.append(`cibs_documents[${doc.key}]`, attachment);
      }
    });
    (otherDocuments ?? []).forEach((other, index) => {
      if (other.file) {
        formData.append(`other_documents[${index}]`, other.file);
        formData.append(`other_document_names[${index}]`, other.name);
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

  submitSignedParecer: (protocolId: number, opinionId: number, signedFile: File) => {
    const formData = new FormData();
    formData.append('signed_document', signedFile);
    return reqFormData('POST', `/api/v1/protocols/${protocolId}/opinions/${opinionId}/sign`, formData) as Promise<{
      message: string;
      protocol: {
        id: number;
        status: string;
        status_label: string;
      };
    }>;
  },

  downloadSignedOpinion: (opinionId: number) =>
    downloadApiFile(`/api/v1/opinions/${opinionId}/signed-download`, 'parecer-assinado.pdf'),

  openSignedOpinion: (opinionId: number) =>
    openApiFile(`/api/v1/opinions/${opinionId}/signed-download?inline=1`, 'parecer-assinado.pdf'),

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

  getReviewContext: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/review-context`) as Promise<{ review_context: ProtocolReviewContext }>,

  listReviewComments: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/review-comments`) as Promise<{ comments: ProtocolReviewComment[] }>,

  addReviewComment: (protocolId: number, content: string) =>
    req('POST', `/api/v1/protocols/${protocolId}/review-comments`, { content }) as Promise<{ comment: ProtocolReviewComment }>,

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
    req('GET', '/api/v1/reviewer/protocols') as Promise<{ protocols: Protocol[] }>,
};
