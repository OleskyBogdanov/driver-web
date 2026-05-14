import { apiFetch } from './client'
import type { DayEvent, EventType } from '../types/Event'

export interface CreateEventPayload {
  driverId: number
  date: string
  name: string
  type: EventType
  departurePoint?: string
  arrivalPoint?: string
  timeFrom?: string
  timeTo?: string
  assignedBy?: string
}

export const getEvents = (from: string, to: string) =>
  apiFetch<DayEvent[]>(`/api/events?from=${from}&to=${to}`)

export const createEvent = (payload: CreateEventPayload) =>
  apiFetch<DayEvent>('/api/events', { method: 'POST', body: JSON.stringify(payload) })

export const deleteEvent = (id: number) =>
  apiFetch<void>(`/api/events/${id}`, { method: 'DELETE' })
