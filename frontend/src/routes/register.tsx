
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'
import '../styles/pages/register.css'
import type { ApiErrorResponse } from '../types/api'

import {
  registerUser,
  type RegisterInput,
} from '../services/userAuthServices'

export const Route = createFileRoute('/register')({
  component: UserRegister,
})

function UserRegister() {
  const [isRegistered, setIsRegistered] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>()

  const onSubmit: SubmitHandler<RegisterInput> = async (data) => {
    clearErrors('root.server')

    try {
      const result = await registerUser(data)

      if (result.success) {
        setIsRegistered(true)
      } else {
        setError('root.server', {
          type: 'server',
          message: result.message,
        })
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message ??
        'Unable to connect to the server. Please try again.'
        : 'An unexpected error occurred.'

      setError('root.server', {
        type: 'server',
        message,
      })
    }
  }

  if (isRegistered) {
    return (
      <main className="register-page">
        <div className="register-card register-success">
          <h1>Registration successful!</h1>
          <p>Your account has been created successfully.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              {...register('name', {
                required: 'Name is required.',
              })}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address.',
                },
              })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password
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
            </label>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="dateOfBirth">Date of birth
              <input
                id="dateOfBirth"
                type="date"
                autoComplete="bday"
                {...register('dateOfBirth', {
                  required: 'Date of birth is required.',
                })}
                aria-invalid={!!errors.dateOfBirth}
              />
            </label>
            {errors.dateOfBirth && <p className="field-error">{errors.dateOfBirth.message}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="phoneNumber">Phone number
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                {...register('phoneNumber', {
                  required: 'Phone number is required.',
                })}
                aria-invalid={!!errors.phoneNumber}
              />
            </label>
            {errors.phoneNumber && <p className="field-error">{errors.phoneNumber.message}</p>}
          </div>


          {errors.root?.server && (
            <p className="form-error" role="alert">{errors.root.server.message}</p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  )
}
