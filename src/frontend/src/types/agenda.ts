export type AgendaEventType = 'deliberation' | 'defense' | 'review' | 'meeting' | 'deadline';

export interface AgendaEvent {
  id: string;
  title: string;
  type: AgendaEventType;
  date: string;
  start?: string;
  end?: string;
  location?: string;
  description?: string;
  protocolCode?: string;
  status?: string;
  organ?: string;
  link?: string;
}

export const AGENDA_TYPE_META: Record<AgendaEventType, {
  label: string;
  icon: string;
  color: string;
  bg: string;
}> = {
  deliberation: {
    label: 'Deliberação',
    icon: 'gavel',
    color: 'var(--secondary)',
    bg: 'var(--secondary-container)',
  },
  defense: {
    label: 'Defesa',
    icon: 'school',
    color: '#7C4DFF',
    bg: '#F3E5FF',
  },
  review: {
    label: 'Revisão',
    icon: 'rate_review',
    color: 'var(--tertiary)',
    bg: 'var(--tertiary-container)',
  },
  meeting: {
    label: 'Reunião',
    icon: 'group',
    color: 'var(--primary)',
    bg: 'var(--primary-container)',
  },
  deadline: {
    label: 'Prazo',
    icon: 'alarm',
    color: '#C62828',
    bg: '#FFEBEE',
  },
};

export function getTypeMeta(type: AgendaEventType) {
  return AGENDA_TYPE_META[type] ?? AGENDA_TYPE_META.meeting;
}
