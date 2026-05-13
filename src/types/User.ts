export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  role: string
  driverId: number | null
  username: string
  driver: import('./Driver').Driver | null
}

export interface UserInfo {
  id: number
  username: string
  role: string
  driverId: number | null
  driverName: string | null
}

export interface CreateUserRequest {
  username: string
  password: string
  driverId?: number
}
