// src/services/evaluationService.ts
import { downloadApiFile, openApiFile, req } from './apiClient';

export type EvaluationOrgan = 'nucleo' | 'comite-cientifico';

export interface EvaluationForm {
  id: number;
  protocol_id: number;
  version: string;
  organ: string;
  form_type?: 'evaluation' | 'deliberation';
  status: string;
  auto_approved?: boolean;
  deliberation_pending?: boolean;
  final_decision?: string | null;
  decided_by?: number | null;
  decided_at?: string | null;
  conclusion_summary?: string | null;
  created_at: string;
  protocol?: {
    id: number;
    code: string;
    version: string;
    status: string;
    status_label: string;
    submitted_at: string;
    topic?: {
      id: number;
      title: string;
      status: string;
      scientific_area?: { id: number; name: string };
      course?: { id: number; name: string; code: string };
    };
  };
  form_criteria?: FormCriterion[];
  reviewer_evaluations?: ReviewerEvaluation[];
  parent_form?: EvaluationForm | null;
  child_forms?: EvaluationForm[];
}

export interface FormCriterion {
  id: number;
  evaluation_form_id: number;
  criterion_id: number;
  group_name: string;
  criterion_name: string;
  order_column: number;
}

export interface ReviewerEvaluation {
  id: number;
  evaluation_form_id: number;
  reviewer_id: number;
  status: string;
  decision?: 'approved' | 'not_approved' | null;
  overall_comment?: string | null;
  submitted_at?: string | null;
  reviewer?: { user?: { id: number; name: string } };
  criterion_reviews?: CriterionReview[];
}

export interface CriterionReview {
  id: number;
  reviewer_evaluation_id: number;
  evaluation_form_criterion_id: number;
  comment?: string | null;
  form_criterion?: FormCriterion;
}

export interface EvaluationOpinionResult {
  id: number;
  decision: string;
  issued_at: string;
  document_url?: string;
  download_url?: string;
  evaluation_form_download_url?: string;
}

export interface SubmitEvaluationResponse {
  message: string;
  reviewer_evaluation: ReviewerEvaluation;
  auto_approved: boolean;
  deliberation_pending: boolean;
  evaluation_form: EvaluationForm;
  opinion?: EvaluationOpinionResult;
}

/**
 * Todas as rotas de ficha de avaliação vivem sob /api/v1/{organ}/...
 * (nucleo, comite-cientifico). Por agora só 'nucleo' está implementado
 * no backend — o parâmetro já existe para quando 'comite-cientifico' entrar.
 */
function organBase(organ: EvaluationOrgan = 'nucleo') {
  return `/api/v1/${organ}`;
}

export const evaluationService = {
  getForm: (formId: number, organ: EvaluationOrgan = 'nucleo') =>
    req('GET', `${organBase(organ)}/evaluation-forms/${formId}`) as Promise<{
      evaluation_form: EvaluationForm;
    }>,

  saveCriterionReview: (
    formId: number,
    formCriterionId: number,
    comment: string | null,
    organ: EvaluationOrgan = 'nucleo'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/criteria/${formCriterionId}/review`, { comment }) as Promise<{
      message: string;
      criterion_review: CriterionReview;
    }>,

  submit: (
    formId: number,
    decision: 'approved' | 'not_approved',
    overallComment?: string | null,
    organ: EvaluationOrgan = 'nucleo'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/submit`, {
      decision,
      overall_comment: overallComment || null,
    }) as Promise<SubmitEvaluationResponse>,

  decide: (
    formId: number,
    decision: string,
    conclusionSummary?: string | null,
    organ: EvaluationOrgan = 'nucleo'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/decide`, {
      decision,
      conclusion_summary: conclusionSummary || null,
    }) as Promise<{
      message: string;
      evaluation_form: EvaluationForm;
      opinion: EvaluationOpinionResult;
    }>,

  listForReviewer: (organ: EvaluationOrgan = 'nucleo') =>
    req('GET', `${organBase(organ)}/reviewer/evaluations`) as Promise<{
      evaluation_forms: EvaluationForm[];
    }>,

  listForSecretary: (organ: EvaluationOrgan = 'nucleo') =>
    req('GET', `${organBase(organ)}/secretary/evaluations`) as Promise<{
      evaluation_forms: EvaluationForm[];
    }>,

  // ── Rotas partilhadas (fora do prefixo de órgão) ──
  listOpinionsForProtocol: (protocolId: number) =>
    req('GET', `/api/v1/protocols/${protocolId}/opinions`) as Promise<{
      opinions: EvaluationOpinionResult[];
    }>,

  openFile: (url: string, fallbackFilename?: string) => openApiFile(url, fallbackFilename),
  downloadFile: (url: string, fallbackFilename?: string) => downloadApiFile(url, fallbackFilename),
};