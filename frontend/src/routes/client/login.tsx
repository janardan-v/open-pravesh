import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'
import { OpenPraveshLogo } from '../../components/OpenPraveshLogo'
import { loginClient, type ClientLoginInput } from '../../services/clientAuthServices'
import '../../styles/pages/auth.css'

export const Route = createFileRoute('/client/login')({
  component: ClientLoginPage,
})

function ClientLoginPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      // Store in session with clientSecret and redirect to developer dashboard
      sessionStorage.setItem(
        'developerClient',
        JSON.stringify({
          clientId: result.data.clientId,
          clientSecret: result.data.clientSecret || (result.data as unknown as { clientSecrert?: string }).clientSecrert || '',
          hostedUri: result.data.hostedUri,
          redirectUri: result.data.redirectUri,
        }),
      )
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
                Developer Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="developer@yourdomain.com"
                className="merc-input"
                aria-invalid={!!errors.email}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
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
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="merc-input"
                aria-invalid={!!errors.password}
                {...register('password', {
                  required: 'Password is required',
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
              {isSubmitting ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign In to Console'
              )}
            </button>
          </form>

          <footer className="merc-auth-footer">
            <p>
              New to OpenPravesh?{' '}
              <Link to="/client/register">Register a client application</Link>
            </p>
          </footer>
        </section>
      </main>
    </div>
  )
}
