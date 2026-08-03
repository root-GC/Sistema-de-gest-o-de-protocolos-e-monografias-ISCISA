import { deliberationService, type DeliberationMeeting } from './deliberationService';
import type { AgendaEvent, AgendaEventType } from '../types/agenda';

function meetingToEvent(m: DeliberationMeeting): AgendaEvent {
  return {
    id: `delib-${m.id}`,
    title: `Deliberação — ${m.organ}`,
    type: 'deliberation' as AgendaEventType,
    date: m.date,
    start: m.time,
    location: m.organ,
    description: `${m.deliberationForms.length} protocolo(s) · ${m.notes || ''}`,
    organ: m.organ,
  };
}

export const agendaService = {
  async loadEvents(): Promise<AgendaEvent[]> {
    const events: AgendaEvent[] = [];

    const meetings = deliberationService.listScheduledMeetings();
    for (const m of meetings) {
      events.push(meetingToEvent(m));
    }

    return events;
  },

  async loadUpcomingEvents(limit = 5): Promise<AgendaEvent[]> {
    const events = await this.loadEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter(e => {
        const d = new Date(e.date + 'T' + (e.start || '00:00'));
        return d >= today;
      })
      .sort((a, b) => {
        const da = new Date(a.date + 'T' + (a.start || '00:00')).getTime();
        const db = new Date(b.date + 'T' + (b.start || '00:00')).getTime();
        return da - db;
      })
      .slice(0, limit);
  },

  async loadEventsForMonth(year: number, month: number): Promise<AgendaEvent[]> {
    const events = await this.loadEvents();
    return events.filter(e => {
      const [y, m] = e.date.split('-').map(Number);
      return y === year && m === month + 1;
    });
  },
};
