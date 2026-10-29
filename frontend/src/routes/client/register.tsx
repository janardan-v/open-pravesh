import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'
import { OpenPraveshLogo } from '../../components/OpenPraveshLogo'

import {
  registerClient,
  type ClientRegisterInput,
  type ClientRegisterResult,
} from '../../services/clientAuthServices'
import type { ApiErrorResponse } from '../../types/api'
import '../../styles/pages/auth.css'

export const Route = createFileRoute('/client/register')({
  component: ClientRegister,
})

function ClientRegister() {
  const navigate = useNavigate()
  const [result, setResult] = useState<ClientRegisterResult | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterInput>()

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const onSubmit: SubmitHandler<ClientRegisterInput> = async (data) => {
    setSubmitError('')
    setResult(null)

    try {
      const response = await registerClient(data)

      if (!response.success || !response.data) {
        setSubmitError(response.message || 'Error occurred while registering client.')
        return
      }

      setResult(response.data)
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message ??
          'Unable to register the client. Please try again.'
        : 'An unexpected network error occurred.'

      setSubmitError(message)
    }
  }

  const handleProceedToDashboard = async () => {
    if (!result) return
    sessionStorage.setItem(
      'developerClient',
      JSON.stringify({
        clientId: result.clientId,
        clientSecret: result.clientSecret,
        hostedUri: result.hostedUri,
        redirectUri: result.redirectUri,
      }),
    )
    await navigate({ to: '/developer' })
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
            <Link to="/client/login" className="merc-btn-secondary">
              Client Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="merc-auth-wrap">
        <section className={`merc-glass-card merc-auth-card ${result ? 'merc-auth-card-wide' : ''}`}>
          {result ? (
            /* Success State with Generated Credentials */
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
                  Client Provisioned
                </span>
                <h1 className="merc-auth-title">Application Registered</h1>
                <p className="merc-auth-subtitle">
                  Store your client secret in a secure environment. It will not be displayed again.
                </p>
              </header>

              <div className="merc-success-box">
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--merc-signal-green)', fontSize: '0.86rem' }}>
                  Confidential Client Secret Generated
                </p>
                <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--merc-text-secondary)' }}>
                  Use this secret only in your backend service when calling the <code>/v1/token</code> endpoint. Never expose it in client-side code.
                </p>
              </div>

              <div className="merc-cred-block">
                <span className="merc-cred-label">Client ID (Public UUID)</span>
                <div className="merc-cred-val-row">
                  <div className="merc-cred-code">{result.clientId}</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.clientId, 'id')}
                    className="merc-copy-btn"
                  >
                    {copiedKey === 'id' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="merc-cred-block">
                <span className="merc-cred-label">Client Secret (Confidential)</span>
                <div className="merc-cred-val-row">
                  <div className="merc-cred-code" style={{ color: '#FCD34D' }}>
                    {result.clientSecret}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.clientSecret, 'secret')}
                    className="merc-copy-btn"
                  >
                    {copiedKey === 'secret' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="merc-cred-block">
                <span className="merc-cred-label">Registered Redirect URI</span>
                <div className="merc-cred-code" style={{ color: 'var(--merc-text-primary)' }}>
                  {result.redirectUri}
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleProceedToDashboard}
                  className="merc-btn-primary"
                  style={{ flex: 1 }}
                >
                  Open Developer Console
                </button>
                <Link to="/" className="merc-btn-secondary">
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div>
              <header className="merc-auth-header">
                <div className="merc-auth-icon-wrap" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <p className="merc-auth-eyebrow">OIDC CLIENT REGISTRATION</p>
                <h1 className="merc-auth-title">Register Application</h1>
                <p className="merc-auth-subtitle">
                  Provision an OAuth 2.0 / OpenID Connect client to authenticate users and receive signed RS256 identity tokens.
                </p>
              </header>

              <form onSubmit={handleSubmit(onSubmit)} className="merc-auth-form" noValidate>
                {submitError && (
                  <div className="merc-alert-error" role="alert">
                    {submitError}
                  </div>
                )}

                <div className="merc-form-group">
                  <label htmlFor="clientName" className="merc-label">
                    Application Name
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    autoComplete="organization"
                    placeholder="Acme Analytics Platform"
                    className="merc-input"
                    aria-invalid={!!errors.clientName}
                    {...register('clientName', {
                      required: 'Application name is required.',
                    })}
                  />
                  {errors.clientName && <p className="merc-error-text">{errors.clientName.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="email" className="merc-label">
                    Developer Contact Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="developer@acme.com"
                    className="merc-input"
                    aria-invalid={!!errors.email}
                    {...register('email', {
                      required: 'Developer email is required.',
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
                    Console Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password for this client account"
                    className="merc-input"
                    aria-invalid={!!errors.password}
                    {...register('password', {
                      required: 'Password is required.',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters.',
                      },
                    })}
                  />
                  {errors.password && <p className="merc-error-text">{errors.password.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="redirectUri" className="merc-label">
                    Authorized Redirect URI
                  </label>
                  <input
                    id="redirectUri"
                    type="url"
                    placeholder="http://localhost:5173/callback"
                    className="merc-input"
                    aria-invalid={!!errors.redirectUri}
                    {...register('redirectUri', {
                      required: 'Redirect URI is required for OIDC redirection.',
                    })}
                  />
                  {errors.redirectUri && <p className="merc-error-text">{errors.redirectUri.message}</p>}
                </div>

                <div className="merc-form-group">
                  <label htmlFor="hostedUri" className="merc-label">
                    Hosted Application Domain
                  </label>
                  <input
                    id="hostedUri"
                    type="url"
                    placeholder="http://localhost:5173"
                    className="merc-input"
                    aria-invalid={!!errors.hostedUri}
                    {...register('hostedUri', {
                      required: 'Hosted application URI is required.',
                    })}
                  />
                  {errors.hostedUri && <p className="merc-error-text">{errors.hostedUri.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="merc-btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {isSubmitting ? 'Registering Application...' : 'Provision Client Credentials'}
                </button>
              </form>

              <footer className="merc-auth-footer">
                <p>
                  Already have a registered client?{' '}
                  <Link to="/client/login">Sign in to console</Link>
                </p>
              </footer>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
