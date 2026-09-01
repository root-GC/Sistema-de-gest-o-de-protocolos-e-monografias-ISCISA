import { req } from './apiClient'
import type { AgendaEvent } from '../types/agenda'

interface AgendaApiEvent {
  id: string
  type: 'deliberation_meeting'
  title: string
  starts_at: string
  location?: string
  status?: string
  meeting_id: number
  protocol_count: number
  url?: string
}

function datePart(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function toAgendaEvent(event: AgendaApiEvent): AgendaEvent {
  const startsAt = new Date(event.starts_at)
  const maputoParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Maputo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, hourCycle: 'h23',
  }).formatToParts(startsAt)
  const value = (type: Intl.DateTimeFormatPartTypes) => maputoParts.find(part => part.type === type)?.value || ''

  return {
    id: event.id,
    title: event.title,
    type: 'deliberation',
    date: `${value('year')}-${value('month')}-${value('day')}`,
    start: `${value('hour')}:${value('minute')}`,
    location: event.location,
    status: event.status,
    description: `${event.protocol_count} protocolo(s)`,
    link: event.url,
  }
}

async function requestEvents(from: Date, to: Date): Promise<AgendaEvent[]> {
  const query = new URLSearchParams({ from: datePart(from), to: datePart(to) })
  const response = await req('GET', `/api/v1/agenda/events?${query.toString()}`) as { events: AgendaApiEvent[] }
  return response.events.map(toAgendaEvent)
}

export const agendaService = {
  async loadEvents(): Promise<AgendaEvent[]> {
    const now = new Date()
    return requestEvents(new Date(now.getFullYear() - 1, 0, 1), new Date(now.getFullYear() + 1, 11, 31))
  },

  async loadUpcomingEvents(limit = 5): Promise<AgendaEvent[]> {
    const now = new Date()
    const events = await requestEvents(now, new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()))
    return events.sort((a, b) => `${a.date}T${a.start || ''}`.localeCompare(`${b.date}T${b.start || ''}`)).slice(0, limit)
  },

  async loadEventsForMonth(year: number, month: number): Promise<AgendaEvent[]> {
    return requestEvents(new Date(year, month, 1), new Date(year, month + 1, 0))
  },
}
