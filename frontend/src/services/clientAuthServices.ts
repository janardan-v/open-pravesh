import { api, setClientToken, removeClientToken } from './api'
import type {
  ApiResponse,
  ClientApplication,
  DeveloperProfile,
  CreateApplicationInput,
  CreateApplicationResult,
} from '../types/api'

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
  clientName?: string
  email?: string
  hostedUri: string
  redirectUri: string
  token?: string
  accessToken?: string
}

export async function registerClient(
  data: ClientRegisterInput,
): Promise<ApiResponse<ClientRegisterResult>> {
  const response = await api.post<ApiResponse<ClientRegisterResult>>(
    '/client-register',
    data,
  )

  if (response.data.success && response.data.data?.token) {
    setClientToken(response.data.data.token)
  }

  return response.data
}

export type ClientLoginInput = {
  email: string
  password: string
}

export type ClientLoginResult = {
  token: string
  accessToken?: string
  email: string
  clientId: string
  clientName?: string
  clientSecret?: string
  clientSecrert?: string
  redirectUri: string
  hostedUri: string
  totalApplications?: number
}

export async function loginClient(
  data: ClientLoginInput,
): Promise<ApiResponse<ClientLoginResult>> {
  const response = await api.post<ApiResponse<ClientLoginResult>>(
    '/client-login',
    data,
  )

  if (response.data.success && response.data.data?.token) {
    setClientToken(response.data.data.token)
  }

  return response.data
}

export async function getDeveloperProfile(): Promise<ApiResponse<DeveloperProfile>> {
  const response = await api.get<ApiResponse<DeveloperProfile>>('/client/me')
  return response.data
}

export async function getRegisteredApplications(): Promise<
  ApiResponse<ClientApplication[]>
> {
  const response = await api.get<ApiResponse<ClientApplication[]>>(
    '/client/applications',
  )
  return response.data
}

export async function getApplicationById(
  clientId: string,
): Promise<ApiResponse<ClientApplication>> {
  const response = await api.get<ApiResponse<ClientApplication>>(
    `/client/applications/${encodeURIComponent(clientId)}`,
  )
  return response.data
}

export async function createNewApplication(
  data: CreateApplicationInput,
): Promise<ApiResponse<CreateApplicationResult>> {
  const response = await api.post<ApiResponse<CreateApplicationResult>>(
    '/client/applications',
    data,
  )
  return response.data
}

export function logoutClient(): void {
  removeClientToken()
}
