// src/services/deliberationService.ts
//
// Camada dedicada ao fluxo de "Reunião de Deliberação" do Núcleo Científico.
// Constrói-se em cima dos endpoints reais já existentes no EvaluationFormController:
//   POST /api/v1/nucleo/evaluation-forms/{form}/schedule-deliberation
//   POST /api/v1/nucleo/evaluation-forms/{form}/start-deliberation
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
   * FLUXO: Se ambos revisores aprovam → auto-approve.
   *        Se algum revisor não aprova → deliberation_pending → reunião obrigatória.
   * 
   * Usa a rota existente da secretaria e filtra por status.
   */
  async listPendingForMeeting(): Promise<EvaluationForm[]> {
    try {
      const { evaluation_forms } = await req<{ evaluation_forms: EvaluationForm[] }>(
        'GET',
        '/api/v1/nucleo/secretary/evaluations'
      );
      
      // Todos os formulários em deliberation_pending precisam de reunião
      const pending = evaluation_forms.filter(f => f.status === 'deliberation_pending');
      
      console.log('📋 Formulários pendentes de deliberação:', pending.length, 
        pending.map(f => ({
          id: f.id,
          code: f.protocol?.code,
          status: f.status,
          title: f.protocol?.topic?.title?.substring(0, 50)
        }))
      );
      
      return pending;
    } catch (error) {
      console.error('Erro ao carregar formulários pendentes:', error);
      throw error;
    }
  },

  /**
   * Agenda uma reunião para um conjunto de protocolos em `deliberation_pending`.
   * 
   * Passo 1: Marca a deliberação (schedule-deliberation) para cada formulário
   * Passo 2: Agrupa os resultados localmente sob uma única reunião
   */
  async scheduleMeeting(params: {
    date: string;
    time: string;
    organ: string;
    notes?: string;
    formIds: number[];
  }): Promise<DeliberationMeeting> {
    // Agenda a deliberação para cada formulário selecionado
    const scheduledForms = await Promise.all(
      params.formIds.map(formId => 
        req('POST', `/api/v1/nucleo/evaluation-forms/${formId}/schedule-deliberation`, {
          deliberation_date: `${params.date} ${params.time}`,
          deliberation_location: params.organ,
        })
      )
    );

    const meeting: DeliberationMeeting = {
      id: `meeting-${Date.now()}`,
      date: params.date,
      time: params.time,
      organ: params.organ,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      deliberationForms: scheduledForms.map((r: any) => r.evaluation_form),
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
   * Gera parecer PDF e avança/não aprova o protocolo automaticamente no backend.
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