import { apiFetch } from './client'
import type { ScheduleEntry, ScheduleResponse } from '../types/Schedule'

export const getSchedule = (from: string, to: string) =>
  apiFetch<ScheduleResponse>(`/api/schedule?from=${from}&to=${to}`)

export const generateSchedule = (from: string, to: string) =>
  apiFetch<ScheduleResponse>(`/api/schedule/generate?from=${from}&to=${to}`, { method: 'POST' })

export const setWorking = (driverId: number, date: string, working: boolean) =>
  apiFetch<ScheduleEntry>(`/api/schedule/${driverId}/${date}?working=${working}`, { method: 'PUT' })
