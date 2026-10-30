import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'

import type { ApiErrorResponse } from '../types/api'
import { OpenPraveshLogo } from '../components/OpenPraveshLogo'
import {
  registerUser,
  type RegisterInput,
} from '../services/userAuthServices'
import '../styles/pages/auth.css'

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
          'Unable to connect to the authentication server. Please try again.'
        : 'An unexpected network error occurred.'

      setError('root.server', {
        type: 'server',
        message,
      })
    }
  }

  return (
    <div className="merc-page-shell">
      {/* Top Navbar */}
      <header className="merc-nav-header">
        <div className="merc-nav-inner">
          <Link to="/" className="merc-brand-link">
            <OpenPraveshLogo size={28} />
            <span>OpenPravesh</span>
          </Link>
          <nav className="merc-nav-links">
            <Link to="/" className="merc-nav-link">
              Home
            </Link>
            <Link to="/developer" className="merc-nav-link">
              Developer Portal
            </Link>
            <Link to="/docs" className="merc-nav-link">
              Docs
            </Link>
            <Link to="/client/register" className="merc-btn-secondary">
              Register Client
            </Link>
          </nav>
        </div>
      </header>

      <main className="merc-auth-wrap">
        <section className="merc-glass-card merc-auth-card">
          {isRegistered ? (
            <div>
              <header className="merc-auth-header">
                <div
                  className="merc-auth-icon-wrap"
                  style={{ background: 'radial-gradient(circle at 35% 35%, #10B981 0%, #059669 60%, #064E3B 100%)' }}
                  aria-hidden="true"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="merc-badge merc-badge-green" style={{ marginBottom: '8px' }}>
                  Identity Registered
                </span>
                <h1 className="merc-auth-title">Registration Successful</h1>
                <p className="merc-auth-subtitle">
                  Your OpenPravesh user identity has been securely created. You can now use these credentials to authenticate on any application integrated with OpenPravesh.
                </p>
              </header>

              <div className="merc-success-box">
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--merc-signal-green)', fontSize: '0.86rem' }}>
                  Zero-Knowledge Password Hashing
                </p>
                <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--merc-text-secondary)' }}>
                  Your password is cryptographically hashed with Argon2id. Client applications will never have access to your raw credentials.
                </p>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <Link to="/" className="merc-btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                  Return to Home
                </Link>
                <Link to="/docs" className="merc-btn-secondary">
                  Read Protocol Docs
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <header className="merc-auth-header">
                <div className="merc-auth-icon-wrap" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p className="merc-auth-eyebrow">OPENID CONNECT USER IDENTITY</p>
                <h1 className="merc-auth-title">Create Identity</h1>
                <p className="merc-auth-subtitle">
                  Register a single decentralized identity to access multiple apps without exposing your password.
                </p>
              </header>

              <form onSubmit={handleSubmit(onSubmit)} className="merc-auth-form" noValidate>
                {errors.root?.server && (
                  <div className="merc-alert-error" role="alert">
                    {errors.root.server.message}
                  </div>
                )}

                <div className="merc-form-group">
                  <label htmlFor="name" className="merc-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    className="merc-input"
                    aria-invalid={!!errors.name}
                    {...register('name', {
                      required: 'Full name is required.',
                    })}
                  />
                  {errors.name && <p className="merc-error-text">{errors.name.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="email" className="merc-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ada@example.com"
                    className="merc-input"
                    aria-invalid={!!errors.email}
                    {...register('email', {
                      required: 'Email address is required.',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address.',
                      },
                    })}
                  />
                  {errors.email && <p className="merc-error-text">{errors.email.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="password" className="merc-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className="merc-input"
                    aria-invalid={!!errors.password}
                    {...register('password', {
                      required: 'Password is required.',
                      minLength: {
                        value: 8,
                        message: 'Password must contain at least 8 characters.',
                      },
                    })}
                  />
                  {errors.password && <p className="merc-error-text">{errors.password.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="dateOfBirth" className="merc-label">
                    Date of Birth *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    autoComplete="bday"
                    className="merc-input"
                    aria-invalid={!!errors.dateOfBirth}
                    {...register('dateOfBirth', {
                      required: 'Date of birth is required.',
                    })}
                  />
                  {errors.dateOfBirth && <p className="merc-error-text">{errors.dateOfBirth.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="phoneNumber" className="merc-label">
                    Phone Number <span style={{ color: 'var(--merc-text-muted)', fontSize: '0.78rem' }}>(optional)</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (555) 000-0000"
                    className="merc-input"
                    aria-invalid={!!errors.phoneNumber}
                    {...register('phoneNumber')}
                  />
                  {errors.phoneNumber && <p className="merc-error-text">{errors.phoneNumber.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="merc-btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {isSubmitting ? 'Creating Identity...' : 'Register Identity'}
                </button>
              </form>

              <footer className="merc-auth-footer">
                <p>
                  Are you a developer?{' '}
                  <Link to="/client/register">Register an application client</Link>
                </p>
              </footer>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
