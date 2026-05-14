export type EventType = 'TECHNICAL_INSPECTION' | 'WASHING' | 'TASK'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  TECHNICAL_INSPECTION: 'Technical inspection',
  WASHING: 'Washing',
  TASK: 'Task',
}

export interface DayEvent {
  id: number
  driverId: number
  date: string
  name: string
  type: EventType
  departurePoint?: string
  arrivalPoint?: string
}
