import {api} from './api'
import type { ApiResponse } from '../types/api'

export type ClientRegisterInput = {
  clientName: string
  email: string
  password: string
  redirectUri: string
  hostedUri: string
}

export type ClientRegisterResult = {
  clientId: string
  clientSecret: string
  hostedUri: string
  redirectUri: string
}


export async function registerClient(
  data: ClientRegisterInput,
): Promise<ApiResponse<ClientRegisterResult>> {
  const response = await api.post<ApiResponse<ClientRegisterResult>>(
    '/client-register',
    data,
  )

  return response.data
}