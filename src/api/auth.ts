import { apiFetch } from './client'
import type { LoginRequest, LoginResponse, UserInfo, CreateUserRequest } from '../types/User'

export const login = (req: LoginRequest) =>
  apiFetch<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(req) })

export const getUsers = () =>
  apiFetch<UserInfo[]>('/api/auth/users')

export const createUser = (req: CreateUserRequest) =>
  apiFetch<UserInfo>('/api/auth/users', { method: 'POST', body: JSON.stringify(req) })

export const deleteUser = (id: number) =>
  apiFetch<void>(`/api/auth/users/${id}`, { method: 'DELETE' })
