export type ApiResponse<T> = {
  statusCode: number
  message: string
  data: T
  success: boolean
}

export type ApiErrorResponse = {
  success: false
  message: string
}