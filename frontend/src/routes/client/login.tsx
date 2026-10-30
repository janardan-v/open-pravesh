import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate, redirect } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'
import { OpenPraveshLogo } from '../../components/OpenPraveshLogo'
import { loginClient, type ClientLoginInput } from '../../services/clientAuthServices'
import { getClientToken } from '../../services/api'
import '../../styles/pages/auth.css'

export const Route = createFileRoute('/client/login')({
  beforeLoad: () => {
    if (getClientToken()) {
      throw redirect({ to: '/developer' })
    }
  },
  component: ClientLoginPage,
})

function ClientLoginPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Double check on mount in case token was added in same session
  useEffect(() => {
    if (getClientToken()) {
      navigate({ to: '/developer' })
    }
  }, [navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientLoginInput>()

  const onSubmit: SubmitHandler<ClientLoginInput> = async (data) => {
    setApiError('')
    setIsSubmitting(true)

    try {
      const result = await loginClient(data)
      if (!result.success || !result.data) {
        setApiError('Unable to log in. Please check your credentials.')
        return
      }

      await navigate({ to: '/developer' })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setApiError(
          error.response?.data?.message ?? 'Login failed. Please verify your email and password.',
        )
      } else {
        setApiError('An unexpected network error occurred.')
      }
    } finally {
      setIsSubmitting(false)
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
            <Link to="/register" className="merc-nav-link">
              User Portal
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

      {/* Main Form Center */}
      <main className="merc-auth-wrap">
        <section className="merc-glass-card merc-auth-card">
          <header className="merc-auth-header">
            <div className="merc-auth-icon-wrap" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <p className="merc-auth-eyebrow">DEVELOPER PORTAL</p>
            <h1 className="merc-auth-title">Client Sign In</h1>
            <p className="merc-auth-subtitle">
              Sign in with your registered application credentials to manage keys, endpoints, and redirect URIs.
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="merc-auth-form" noValidate>
            {apiError && (
              <div className="merc-alert-error" role="alert">
                {apiError}
              </div>
            )}

            <div className="merc-form-group">
              <label htmlFor="email" className="merc-label">
                Developer Account Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="developer@openpravesh.org"
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
                Developer Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="merc-input"
                aria-invalid={!!errors.password}
                {...register('password', {
                  required: 'Password is required.',
                })}
              />
              {errors.password && <p className="merc-error-text">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="merc-btn-primary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Developer Console'}
            </button>
          </form>

          <footer className="merc-auth-footer">
            <p>
              Need to register a new application?{' '}
              <Link to="/client/register">Register Client</Link>
            </p>
          </footer>
        </section>
      </main>
    </div>
  )
}
