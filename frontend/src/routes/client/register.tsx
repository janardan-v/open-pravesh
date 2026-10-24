import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'

import {
  registerClient,
  type ClientRegisterInput,
  type ClientRegisterResult,
} from '../../services/clientAuthServices'
import type { ApiErrorResponse } from '../../types/api'

export const Route = createFileRoute('/client/register')({
  component: ClientRegister,
})

function ClientRegister() {
  const [result, setResult] = useState<ClientRegisterResult | null>(null)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterInput>()

  const onSubmit: SubmitHandler<ClientRegisterInput> = async (data) => {
    setSubmitError('')
    setResult(null)

    try {
      const response = await registerClient(data)

      if (!response.success) {
        setSubmitError(response.message)
        return
      }

      setResult(response.data)
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message ??
        'Unable to register the client. Please try again.'
        : 'An unexpected error occurred.'

      setSubmitError(message)
    }
  }

  if (result) {
    return (
      <main>
        <h1>Client registered successfully</h1>
        <p>Save your client credentials securely.</p>

        <dl>
          <dt>Client ID</dt>
          <dd>{result.clientId}</dd>

          <dt>Client Secret</dt>
          <dd>{result.clientSecret}</dd>

          <dt>Hosted URI</dt>
          <dd>{result.hostedUri}</dd>

          <dt>Redirect URI</dt>
          <dd>{result.redirectUri}</dd>
        </dl>
      </main>
    )
  }

  return (
    <main>
      <h1>Register a client</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="clientName">Client name</label>
          <input
            id="clientName"
            autoComplete="organization"
            {...register('clientName', {
              required: 'Client name is required.',
            })}
            aria-invalid={!!errors.clientName}
          />
          {errors.clientName && <p>{errors.clientName.message}</p>}
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email', {
              required: 'Email is required.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address.',
              },
            })}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: 'Password is required.',
              minLength: {
                value: 8,
                message: 'Password must contain at least 8 characters.',
              },
            })}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="redirectUri">Redirect URI</label>
          <input
            id="redirectUri"
            type="url"
            placeholder="https://example.com/callback"
            {...register('redirectUri', {
              required: 'Redirect URI is required.',
              pattern: {
                value: /^https?:\/\/.+/i,
                message: 'Enter a valid HTTP or HTTPS URL.',
              },
            })}
            aria-invalid={!!errors.redirectUri}
          />
          {errors.redirectUri && <p>{errors.redirectUri.message}</p>}
        </div>

        <div>
          <label htmlFor="hostedUri">Hosted URI</label>
          <input
            id="hostedUri"
            type="url"
            placeholder="https://example.com"
            {...register('hostedUri', {
              required: 'Hosted URI is required.',
              pattern: {
                value: /^https?:\/\/.+/i,
                message: 'Enter a valid HTTP or HTTPS URL.',
              },
            })}
            aria-invalid={!!errors.hostedUri}
          />
          {errors.hostedUri && <p>{errors.hostedUri.message}</p>}
        </div>

        {submitError && <p role="alert">{submitError}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering client...' : 'Register client'}
        </button>
      </form>
    </main>
  )
}