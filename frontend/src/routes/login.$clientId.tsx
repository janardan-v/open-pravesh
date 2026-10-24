import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'
import type { ApiErrorResponse } from '../types/api'

import {
  loginUser,
  type LoginInput,
} from '../services/userAuthServices'

export const Route = createFileRoute('/login/$clientId')({
  component: UserLogin,
})

function UserLogin() {
  const { clientId } = Route.useParams()
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>()

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    setSubmitError('')
    try {
      const result = await loginUser(clientId, data)
      window.location.assign(result.redirectTo)
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        console.error('Login request failed:', {
          message: error.message,
          status: error.response?.status,
          response: error.response?.data,
        })

        setSubmitError(
          error.response?.data?.message ??
          'Unable to sign in. Please try again.',
        )
      } else {
        console.error('Unexpected login error:', error)
        setSubmitError('An unexpected error occurred.')
      }
    }
  }

  return (
    <main>
      <h1>Sign in to OpenPravesh</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required.',
            })}
            aria-invalid={!!errors.password}
          />
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        {submitError && <p role="alert">{submitError}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}