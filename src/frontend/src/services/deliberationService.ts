// src/services/deliberationService.ts
//
// Camada dedicada ao fluxo de "Reunião de Deliberação" do Núcleo Científico.
// Constrói-se em cima dos endpoints reais já existentes no EvaluationFormController:
//   POST /api/v1/nucleo/evaluation-forms/{form}/init-deliberation
//   POST /api/v1/nucleo/evaluation-forms/{form}/submit-deliberation
//
// ⚠️ NOTA IMPORTANTE (assumpção a validar com o backend):
// Não existe hoje um modelo "Meeting" (data/hora/notas) no backend partilhado.
// O que existe é a ficha de deliberação (EvaluationForm form_type=deliberation),
// criada 1:1 por protocolo via init-deliberation. A UI da secretaria (MeetingPage)
// permite agrupar VÁRIOS protocolos numa única reunião com data/hora/notas —
// isso é modelado aqui como um agrupamento LOCAL (guardado em localStorage),
// disparando um init-deliberation por protocolo seleccionado.
//
// Quando o backend tiver um recurso Meeting próprio, substituir loadStoredMeetings/
// persistStoredMeetings por chamadas reais à API (ex: GET/POST /api/v1/nucleo/meetings)
// e remover a dependência de localStorage.

import { req } from './apiClient';
import type { EvaluationForm, EvaluationOpinionResult } from './evaluationService';

export interface DeliberationMeeting {
  id: string;
  date: string;
  time: string;
  organ: string;
  notes?: string;
  createdAt: string;
  deliberationForms: EvaluationForm[];
}

const MEETINGS_STORAGE_KEY = 'sgpmc_scheduled_meetings';

function loadStoredMeetings(): DeliberationMeeting[] {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeliberationMeeting[]) : [];
  } catch {
    return [];
  }
}

function persistStoredMeetings(meetings: DeliberationMeeting[]) {
  localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
}

export const deliberationService = {
  /**
   * Protocolos do Núcleo cuja ficha de avaliação está em `deliberation_pending`
   * — candidatos a entrar numa reunião de deliberação.
   *
   * NOTA: EvaluationService::listForSecretary no backend filtra hoje pelo status
   * do PROTOCOLO (pending_nucleo, in_review_nucleo). Um protocolo em deliberação
   * mantém-se com status de protocolo `in_review_nucleo`, então deve continuar a
   * aparecer nessa listagem — aqui filtramos adicionalmente pelo status da FICHA
   * (`deliberation_pending`). Se o backend deixar de devolver estes casos nesta
   * rota, ajustar o filtro lá em vez de aqui.
   */
  async listPendingForMeeting(): Promise<EvaluationForm[]> {
    const { evaluation_forms } = await req<{ evaluation_forms: EvaluationForm[] }>(
      'GET',
      '/api/v1/nucleo/secretary/evaluations'
    );
    return evaluation_forms.filter(f => f.status === 'deliberation_pending');
  },

  /** Cria a ficha de deliberação para um protocolo específico (acção real de backend). */
  initDeliberation: (formId: number) =>
    req('POST', `/api/v1/nucleo/evaluation-forms/${formId}/init-deliberation`) as Promise<{
      message: string;
      deliberation_form: EvaluationForm;
      evaluation_form: EvaluationForm;
    }>,

  /**
   * Agenda uma reunião para um conjunto de protocolos em `deliberation_pending`.
   * Dispara um init-deliberation por protocolo e agrupa os resultados localmente
   * sob uma única reunião com data/hora/notas.
   */
  async scheduleMeeting(params: {
    date: string;
    time: string;
    organ: string;
    notes?: string;
    formIds: number[];
  }): Promise<DeliberationMeeting> {
    const results = await Promise.all(
      params.formIds.map(formId => this.initDeliberation(formId))
    );

    const meeting: DeliberationMeeting = {
      id: `meeting-${Date.now()}`,
      date: params.date,
      time: params.time,
      organ: params.organ,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      deliberationForms: results.map(r => r.deliberation_form),
    };

    const meetings = loadStoredMeetings();
    meetings.unshift(meeting);
    persistStoredMeetings(meetings);

    return meeting;
  },

  listScheduledMeetings(): DeliberationMeeting[] {
    return loadStoredMeetings();
  },

  /**
   * Fichas de deliberação (form_type=deliberation, ainda não concluídas)
   * atribuídas ao revisor autenticado — usado no menu "Reuniões" do revisor.
   */
  async listMyDeliberations(): Promise<EvaluationForm[]> {
    const { evaluation_forms } = await req<{ evaluation_forms: EvaluationForm[] }>(
      'GET',
      '/api/v1/nucleo/reviewer/evaluations'
    );

    const deliberations: EvaluationForm[] = [];
    for (const form of evaluation_forms) {
      for (const child of form.child_forms || []) {
        if (child.form_type === 'deliberation' && child.status !== 'concluded') {
          deliberations.push(child);
        }
      }
    }
    return deliberations;
  },

  /**
   * Submete a decisão da deliberação (qualquer um dos dois revisores pode fazê-lo).
   * Gera parecer PDF e avança/rejeita o protocolo automaticamente no backend.
   */
  submitDeliberation: (
    deliberationFormId: number,
    decision: 'approved' | 'not_approved',
    conclusionSummary?: string | null
  ) =>
    req('POST', `/api/v1/nucleo/evaluation-forms/${deliberationFormId}/submit-deliberation`, {
      decision,
      conclusion_summary: conclusionSummary || null,
    }) as Promise<{
      message: string;
      evaluation_form: EvaluationForm;
      deliberation_form: EvaluationForm;
      opinion: EvaluationOpinionResult;
    }>,
};