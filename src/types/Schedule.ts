export interface ScheduleEntry {
  driverId: number
  date: string
  working: boolean
  shiftHours: number
  pinned: boolean
}

export interface ScheduleResponse {
  entries: ScheduleEntry[]
  monthlyHoursPerDriver: Record<string, number>
}
