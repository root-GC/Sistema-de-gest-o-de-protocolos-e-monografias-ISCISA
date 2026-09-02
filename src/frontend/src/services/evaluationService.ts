// src/services/evaluationService.ts
import { downloadApiFile, openApiFile, req } from './apiClient'

// ═══════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════

export type EvaluationOrgan = 'comite-cientifico' | 'comite-bioetica'

const committeeOrgans: EvaluationOrgan[] = ['comite-cientifico', 'comite-bioetica']

function organBase(organ: EvaluationOrgan): string {
  return `/api/v1/${organ}`
}

export interface FormCriterion {
  id: number
  evaluation_form_id: number
  criterion_name: string
  group_name: string | null
  description: string | null
  max_score: number
  weight: number
  sort_order: number
}

export interface CriterionReview {
  id: number
  reviewer_evaluation_id: number
  evaluation_form_criterion_id: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface ReviewerEvaluation {
  id: number
  evaluation_form_id: number
  reviewer: {
    id: number
    user: {
      id: number
      name: string
      email: string
    }
  }
  status: string
  is_evaluated?: boolean
  is_primary?: boolean
  role?: 'primary' | 'reviewer' | string
  decision: string | null
  preliminary_decision?: string | null
  overall_comment?: string | null
  deliberation_submitted?: boolean
  submitted_at: string | null
  evaluated_at?: string | null
  assigned_at?: string | null
  due_at?: string | null
  days_remaining?: number | null
  overdue?: boolean
  review_status?: 'reviewed' | 'not_reviewed'
  criterion_reviews?: CriterionReview[]
}

export interface CriteriaComment {
  form_criterion_id?: number
  criterion_id: number
  criterion_name: string
  group_name: string | null
  order_column: number
  reviews: Array<{
    reviewer_id: number | null
    reviewer_name: string
    comment: string | null
    is_shared?: boolean
  }>
}

export interface EvaluationForm {
  id: number
  protocol_id: number
  topic_id?: number
  version: number
  form_type: 'evaluation' | 'deliberation'
  parent_form_id: number | null
  organ: string
  is_shared_form?: boolean
  is_primary_reviewer?: boolean
  can_access_form?: boolean
  status: string
  final_decision: string | null
  harmonized_decision?: string | null
  harmonized_at?: string | null
  decided_by: number | null
  decided_at: string | null
  conclusion_summary: string | null
  deliberation_date: string | null
  deliberation_location: string | null
  deliberation_scheduled_by: number | null
  created_at: string
  updated_at: string
  protocol?: {
    id: number
    code: string
    version: string
    topic?: {
      id: number
      title: string
    }
    student?: {
      id: number
      name: string
    }
    latest_document?: {
      id: number
      file_name: string
      download_url: string
      view_url?: string
    }
  }
  topic?: {
    id: number
    title: string
  }
  form_criteria?: FormCriterion[]
  reviewer_evaluations?: ReviewerEvaluation[]
  criteria_comments?: CriteriaComment[]
  child_forms?: EvaluationForm[]
}

export interface EvaluationOpinionResult {
  id: number
  decision: string
  issued_at: string
  document_url?: string
  download_url?: string
  evaluation_form_download_url?: string
}

// ═══════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════

export const evaluationService = {
  // ── Listagens ──────────────────────────────────────

  listForReviewer: (organ: EvaluationOrgan) =>
    req('GET', `${organBase(organ)}/reviewer/evaluations`) as Promise<{
      evaluation_forms: EvaluationForm[]
    }>,

  listForReviewerAcrossCommittees: async () => {
    const responses = await Promise.all(committeeOrgans.map(organ => evaluationService.listForReviewer(organ)))
    const seen = new Set<number>()
    const evaluation_forms = responses
      .flatMap(response => response.evaluation_forms || [])
      .filter(form => !seen.has(form.id) && Boolean(seen.add(form.id)))

    return { evaluation_forms }
  },

  listForSecretary: (organ: EvaluationOrgan) =>
    req('GET', `${organBase(organ)}/secretary/evaluations`) as Promise<{
      evaluation_forms: EvaluationForm[]
    }>,

  /**
   * Lista fichas com status 'deliberated' — aguardando decisão final.
   */
  listPendingFinalDecision: (organ: EvaluationOrgan) =>
    req('GET', `${organBase(organ)}/final-decisions`) as Promise<{
      evaluation_forms: EvaluationForm[]
    }>,

  // ── Detalhe ────────────────────────────────────────

  getForm: (formId: number, organ: EvaluationOrgan) =>
    req('GET', `${organBase(organ)}/evaluation-forms/${formId}`) as Promise<{
      evaluation_form: EvaluationForm
    }>,

  getFormAcrossCommittees: async (formId: number) => {
    let lastError: unknown
    for (const organ of committeeOrgans) {
      try {
        return await evaluationService.getForm(formId, organ)
      } catch (error) {
        lastError = error
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Ficha de avaliação não encontrada.')
  },

  // ── Critérios ──────────────────────────────────────

  saveCriterionReview: (
    formId: number,
    formCriterionId: number,
    comment: string | null,
    organ: EvaluationOrgan = 'comite-cientifico'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/criteria/${formCriterionId}/review`, {
      comment,
    }) as Promise<{ message: string }>,

  // ── Submissão da Avaliação Individual ──────────────

  submit: (
    formId: number,
    decision: 'approved' | 'not_approved',
    overallComment?: string | null,
    organ: EvaluationOrgan = 'comite-cientifico'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/submit`, {
      decision,
      overall_comment: overallComment || null,
    }) as Promise<{
      message: string
      evaluation_form: EvaluationForm
    }>,

  markEvaluated: (
    formId: number,
    decision: 'approved' | 'not_approved',
    overallComment?: string | null,
    organ: EvaluationOrgan = 'comite-cientifico'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/mark-evaluated`, {
      decision,
      overall_comment: overallComment || null,
    }) as Promise<{
      message: string
      reviewer_evaluation: ReviewerEvaluation
      deliberation_pending: boolean
      evaluation_form: EvaluationForm
    }>,

  // ── Deliberação ────────────────────────────────────

  scheduleDeliberation: (
    formId: number,
    date: string,
    location: string,
    organ: EvaluationOrgan = 'comite-cientifico'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/schedule-deliberation`, {
      deliberation_date: date,
      deliberation_location: location,
    }) as Promise<{
      message: string
      evaluation_form: EvaluationForm
    }>,

  submitDeliberation: (
    formId: number,
    decision: 'approved' | 'not_approved',
    conclusionSummary?: string | null,
    organ: EvaluationOrgan = 'comite-cientifico'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/submit-deliberation`, {
      decision,
      conclusion_summary: conclusionSummary || null,
    }) as Promise<{
      message: string
      evaluation_form: EvaluationForm
      opinion?: EvaluationOpinionResult
    }>,

  /**
   * Encerra a reunião de deliberação.
   * O backend decide automaticamente:
   * - 'deliberated' se ambos os revisores submeteram a mesma decisão
   * - 'not_deliberated' se as decisões divergem
   * O resultado vem diretamente no evaluation_form.status.
   */
  closeMeeting: (formId: number, result: 'deliberated' | 'not_deliberated', organ: EvaluationOrgan = 'comite-cientifico') =>
  req('POST', `${organBase(organ)}/evaluation-forms/${formId}/close-meeting`, {
    result,
  }) as Promise<{
    message: string
    evaluation_form: EvaluationForm
  }>,

  decide: (
    formId: number,
    decision: 'approved' | 'not_approved',
    conclusionSummary?: string | null,
    organ: EvaluationOrgan = 'comite-cientifico'
  ) =>
    req('POST', `${organBase(organ)}/evaluation-forms/${formId}/decide`, {
      decision,
      conclusion_summary: conclusionSummary || null,
    }) as Promise<{
      message: string
      evaluation_form: EvaluationForm
      opinion?: EvaluationOpinionResult
    }>,

  // ── Ficheiros ──────────────────────────────────────

  openFile: (url: string, filename?: string) => openApiFile(url, filename),

  downloadFile: (url: string, filename?: string) => downloadApiFile(url, filename),
}
