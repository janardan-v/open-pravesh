class ApiError extends Error {
  statusCode: number
  success: boolean

  constructor(statusCode: number, message: string) {
    super(message)

    this.statusCode = statusCode
    this.success = false

    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = "Bad Request") {
    return new ApiError(400, message)
  }
  static conflit(message = "Conflict") {
    return new ApiError(409, message)
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message)
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message)
  }

  static notFound(message = "Not Found") {
    return new ApiError(404, message)
  }

  static internalServerError(message = "Internal Server Error") {
    return new ApiError(500, message)
  }
}

export default ApiError