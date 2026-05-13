export interface Driver {
  id: number
  driverName: string
  car: string
  licensePlate: string
  workStart: string
  workEnd: string
  fridayWorkStart: string
  fridayWorkEnd: string
}

export interface CreateDriverResponse {
  driver: Driver
  username: string
  generatedPassword: string
}
