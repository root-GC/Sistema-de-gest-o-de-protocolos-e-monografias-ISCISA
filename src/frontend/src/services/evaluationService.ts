import { downloadApiFile, openApiFile, req } from './apiClient';

export interface EvaluationForm {
  id: number;
  protocol_id: number;
  version: string;
  organ: string;
  status: string;
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
  recommendation?: string | null;
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

export const evaluationService = {
  getForm: (formId: number) =>
    req('GET', `/api/v1/evaluation-forms/${formId}`) as Promise<{
      evaluation_form: EvaluationForm;
    }>,

  saveCriterionReview: (formId: number, formCriterionId: number, comment: string | null) =>
    req('POST', `/api/v1/evaluation-forms/${formId}/criteria/${formCriterionId}/review`, { comment }) as Promise<{
      message: string;
      criterion_review: CriterionReview;
    }>,

  submit: (formId: number, recommendation: string, overallComment?: string | null) =>
    req('POST', `/api/v1/evaluation-forms/${formId}/submit`, {
      recommendation,
      overall_comment: overallComment || null,
    }) as Promise<{
      message: string;
      reviewer_evaluation: ReviewerEvaluation;
    }>,

  decide: (formId: number, decision: string, conclusionSummary?: string | null) =>
    req('POST', `/api/v1/evaluation-forms/${formId}/decide`, {
      decision,
      conclusion_summary: conclusionSummary || null,
    }) as Promise<{
      message: string;
      evaluation_form: EvaluationForm;
      opinion: EvaluationOpinionResult;
    }>,

  listForReviewer: () =>
    req('GET', '/api/v1/reviewer/evaluations') as Promise<{
      evaluation_forms: EvaluationForm[];
    }>,

  openFile: (url: string, fallbackFilename?: string) => openApiFile(url, fallbackFilename),

  downloadFile: (url: string, fallbackFilename?: string) => downloadApiFile(url, fallbackFilename),
};
