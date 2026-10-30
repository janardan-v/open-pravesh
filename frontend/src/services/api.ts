import axios from 'axios'

export const CLIENT_TOKEN_KEY = 'openpravesh_client_token'

export function getClientToken(): string | null {
  try {
    return localStorage.getItem(CLIENT_TOKEN_KEY) || sessionStorage.getItem(CLIENT_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setClientToken(token: string): void {
  try {
    localStorage.setItem(CLIENT_TOKEN_KEY, token)
    sessionStorage.setItem(CLIENT_TOKEN_KEY, token)
  } catch (e) {
    console.error('Failed to save client auth token:', e)
  }
}

export function removeClientToken(): void {
  try {
    localStorage.removeItem(CLIENT_TOKEN_KEY)
    sessionStorage.removeItem(CLIENT_TOKEN_KEY)
    sessionStorage.removeItem('developerClient')
  } catch (e) {
    console.error('Failed to remove client auth token:', e)
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Automatically attach Client Bearer token if present
api.interceptors.request.use((config) => {
  const token = getClientToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: Handle unauthorized session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // If unauthorized on protected client route, clear stale token
      const isClientProtectedRoute = error.config?.url?.includes('/client/')
      if (isClientProtectedRoute) {
        removeClientToken()
      }
    }
    return Promise.reject(error)
  },
)
