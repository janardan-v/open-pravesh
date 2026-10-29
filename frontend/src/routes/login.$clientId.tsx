import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'

import type { ApiErrorResponse } from '../types/api'
import { OpenPraveshLogo } from '../components/OpenPraveshLogo'
import {
  loginUser,
  type LoginInput,
} from '../services/userAuthServices'
import '../styles/pages/auth.css'

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
      if (result.redirectTo) {
        window.location.assign(result.redirectTo)
      } else {
        setSubmitError('Authentication succeeded, but redirect target was missing.')
      }
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setSubmitError(
          error.response?.data?.message ??
            'Unable to sign in. Please check your credentials.',
        )
      } else {
        setSubmitError('An unexpected authentication error occurred.')
      }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="merc-badge merc-badge-cyan">OIDC 1.0 Authorization</span>
          </div>
        </div>
      </header>

      <main className="merc-auth-wrap">
        <section className="merc-glass-card merc-auth-card">
          <header className="merc-auth-header">
            <div className="merc-auth-icon-wrap" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <p className="merc-auth-eyebrow">IDENTITY PROVIDER CONSENT</p>
            <h1 className="merc-auth-title">Sign in to Authorize</h1>
            <p className="merc-auth-subtitle">
              An application is requesting your authorization to verify your identity via OpenPravesh.
            </p>
          </header>

          {/* Client Identity Box */}
          <div className="merc-consent-client-card">
            <div className="merc-client-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--merc-text-primary)' }}>
                  Registered Application
                </span>
                <span className="merc-badge merc-badge-green" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  Verified
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--merc-font-mono)',
                  color: 'var(--merc-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Client ID: {clientId}
              </p>
            </div>
          </div>

          {/* Scopes granted */}
          <ul className="merc-scope-list">
            <li className="merc-scope-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--merc-signal-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Verify your decentralized unique user ID</span>
            </li>
            <li className="merc-scope-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--merc-signal-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Read your primary email address for profile linking</span>
            </li>
          </ul>

          <form onSubmit={handleSubmit(onSubmit)} className="merc-auth-form" noValidate>
            {submitError && (
              <div className="merc-alert-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="merc-form-group">
              <label htmlFor="email" className="merc-label">
                OpenPravesh Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
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
              {isSubmitting ? 'Verifying & Redirecting...' : 'Authorize & Return to App'}
            </button>
          </form>

          <footer className="merc-auth-footer">
            <p>
              Don&apos;t have an OpenPravesh account?{' '}
              <Link to="/register">Create an identity</Link>
            </p>
          </footer>
        </section>
      </main>
    </div>
  )
}
