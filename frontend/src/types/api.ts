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

export type ClientApplication = {
  clientId: string
  clientName: string
  email?: string
  redirectUri: string
  hostedUri?: string
}

export type DeveloperProfile = {
  email: string
  totalApplications: number
  applications: ClientApplication[]
}

export type CreateApplicationInput = {
  clientName: string
  redirectUri: string
  hostedUri?: string
}

export type CreateApplicationResult = {
  clientId: string
  clientSecret: string
  clientName: string
  email: string
  redirectUri: string
  hostedUri?: string
}
