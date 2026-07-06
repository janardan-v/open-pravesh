class ApiResponse<T = null> {
  statusCode: number
  message: string
  data: T | null
  success: boolean

  constructor(
    statusCode: number,
    message: string,
    data: T | null = null
  ) {
    this.statusCode = statusCode
    this.message = message
    this.data = data
    this.success = statusCode < 400
  }

  static success<T>(
    message = "Success",
    data: T | null = null
  ) {
    return new ApiResponse<T>(200, message, data)
  }

  static created<T>(
    message = "Created",
    data: T | null = null
  ) {
    return new ApiResponse<T>(201, message, data)
  }
}

export default ApiResponse