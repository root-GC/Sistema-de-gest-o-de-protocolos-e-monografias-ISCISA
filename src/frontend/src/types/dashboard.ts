// src/types/dashboard.ts

export type ProtocolStatus =
  | 'protocol_pending_supervisor'
  | 'protocol_rejected_supervisor'
  | 'protocol_pending_nucleo'
  | 'protocol_in_review_nucleo'
  | 'protocol_pending_comite_cientifico'
  | 'protocol_in_review_comite_cientifico'
  | 'protocol_pending_comite_bioetica'
  | 'protocol_in_review_comite_bioetica'
  | 'protocol_rejected_nucleo'
  | 'protocol_rejected_cc'
  | 'protocol_rejected_bioetica'
  | 'protocol_approved_final'
  | 'protocol_rejected_final';

export interface TimelineStep {
  stage: ProtocolStatus;
  label: string;
  done: boolean;
  current: boolean;
}

export interface TopicSummary {
  id: number;
  title: string;
  status: string;
  status_label: string;
  rejected: boolean;
}

export interface ProtocolSummary {
  id: number;
  code: string | null;
  title: string | null;
  current_stage: ProtocolStatus;
  stage_label: string;
  is_rejected: boolean;
  next_action: string | null;
  timeline: TimelineStep[];
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface StudentDashboardPayload {
  profile: {
    name: string;
    email: string;
    supervisor?: string | null;
  };
  phase: 'topic' | 'protocol' | 'none';
  topic: TopicSummary | null;
  protocol: ProtocolSummary | null;
  notifications: NotificationItem[];
}

export interface QueueItem {
  protocol_id: number;
  title: string | null;
  waiting_since: string | null;
  action_needed: string;
}

export interface SecretaryDashboardPayload {
  queue: {
    pending_nucleo: number;
    pending_comite_cientifico: number;
    pending_comite_bioetica: number;
    items: QueueItem[];
  };
  notifications: NotificationItem[];
}

export interface PendingFinalDecisionItem {
  evaluation_form_id: number;
  title: string | null;
  organ: string;
}

export interface StatsDashboardPayload {
  profile: {
    name: string;
    email: string;
    scope?: string | null;
  };
  stats: {
    total_users?: number | null;
    total_protocols: number;
    by_status: Record<string, number>;
    protocols_this_month?: number;
  };
  pending_final_decisions?: PendingFinalDecisionItem[];
  notifications: NotificationItem[];
}

export interface PendingEvaluationItem {
  evaluation_form_id: number;
  title: string | null;
  organ: string;
  status: string;
}

export interface ReviewerDashboardPayload {
  profile: {
    name: string;
    email: string;
  };
  pending_evaluations: PendingEvaluationItem[];
  notifications: NotificationItem[];
}

export interface PendingApprovalItem {
  id: number;
  title: string | null;
  submitted_at: string | null;
}

export interface SupervisorDashboardPayload {
  profile: {
    name: string;
    email: string;
  };
  supervisees_count: number;
  pending_topics: PendingApprovalItem[];
  pending_protocols: PendingApprovalItem[];
  notifications: NotificationItem[];
}