import { apiFetch } from './client'
import type { Driver, CreateDriverResponse } from '../types/Driver'

export const getDrivers = () =>
  apiFetch<Driver[]>('/api/drivers')

export const createDriver = (driver: Omit<Driver, 'id'>) =>
  apiFetch<CreateDriverResponse>('/api/drivers', { method: 'POST', body: JSON.stringify(driver) })

export const updateDriver = (driver: Driver) =>
  apiFetch<Driver>(`/api/drivers/${driver.id}`, { method: 'PUT', body: JSON.stringify(driver) })

export const deleteDriver = (id: number) =>
  apiFetch<void>(`/api/drivers/${id}`, { method: 'DELETE' })
