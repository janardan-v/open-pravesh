import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm, type SubmitHandler } from 'react-hook-form'
import axios from 'axios'
import { OpenPraveshLogo } from '../components/OpenPraveshLogo'
import {
  getDeveloperProfile,
  getRegisteredApplications,
  createNewApplication,
  logoutClient,
} from '../services/clientAuthServices'
import { getClientToken } from '../services/api'
import type { ClientApplication, CreateApplicationResult } from '../types/api'
import '../styles/pages/developer.css'

export type TabKey = 'overview' | 'applications' | 'register' | 'endpoints' | 'account'

interface NewAppFormData {
  clientName: string
  redirectUri: string
  hostedUri: string
}

export const Route = createFileRoute('/developer')({
  component: DeveloperDashboard,
})

function DeveloperDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [developerEmail, setDeveloperEmail] = useState<string | null>(null)
  const [applications, setApplications] = useState<ClientApplication[]>([])
  const [selectedApp, setSelectedApp] = useState<ClientApplication | null>(null)
  const [inspectModalOpen, setInspectModalOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [sandboxActive, setSandboxActive] = useState(false)
  const [createdAppResult, setCreatedAppResult] = useState<CreateApplicationResult | null>(null)
  const [createAppError, setCreateAppError] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)

  // Demo fallback client for sandbox exploration
  const demoClient: ClientApplication = {
    clientId: 'openpravesh-client-demo-9921',
    clientName: 'Sandbox Demo Application',
    redirectUri: 'http://localhost:5173/callback',
    hostedUri: 'http://localhost:5173',
  }

  const {
    register: registerNewApp,
    handleSubmit: handleNewAppSubmit,
    reset: resetNewAppForm,
    formState: { isSubmitting: isCreatingApp, errors: newAppErrors },
  } = useForm<NewAppFormData>()

  // Load authenticated developer profile and applications from PostgreSQL
  const loadDashboardData = useCallback(async () => {
    const token = getClientToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [profileRes, appsRes] = await Promise.all([
        getDeveloperProfile(),
        getRegisteredApplications(),
      ])

      if (profileRes.success && profileRes.data) {
        setDeveloperEmail(profileRes.data.email)
      }

      if (appsRes.success && appsRes.data) {
        setApplications(appsRes.data)
        if (appsRes.data.length > 0 && !selectedApp) {
          setSelectedApp(appsRes.data[0] || null)
        }
      }
    } catch (error) {
      console.error('Error fetching developer dashboard data:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logoutClient()
        setDeveloperEmail(null)
        setApplications([])
      }
    } finally {
      setLoading(false)
    }
  }, [selectedApp])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleLogout = async () => {
    logoutClient()
    setDeveloperEmail(null)
    setApplications([])
    setSelectedApp(null)
    setSandboxActive(false)
    await navigate({ to: '/client/login' })
  }

  const onRegisterNewApp: SubmitHandler<NewAppFormData> = async (data) => {
    setCreateAppError(null)
    setCreatedAppResult(null)

    try {
      const response = await createNewApplication(data)
      if (response.success && response.data) {
        setCreatedAppResult(response.data)
        resetNewAppForm()
        // Refresh application list from server
        const updatedAppsRes = await getRegisteredApplications()
        if (updatedAppsRes.success && updatedAppsRes.data) {
          setApplications(updatedAppsRes.data)
        }
      } else {
        setCreateAppError(response.message || 'Unable to register application.')
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setCreateAppError(err.response?.data?.message || 'Failed to create application.')
      } else {
        setCreateAppError('An unexpected network error occurred.')
      }
    }
  }

  const isAuthenticated = Boolean(developerEmail || getClientToken())
  const displayedApps = sandboxActive ? [demoClient] : applications
  const primaryApp = selectedApp || displayedApps[0] || (sandboxActive ? demoClient : null)

  return (
    <div className="merc-page-shell">
      {/* Top Navigation Bar */}
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
              Documentation
            </Link>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {developerEmail && (
                  <div className="merc-nav-user-chip" title="Authenticated developer account">
                    <span className="merc-nav-user-dot" />
                    <span>{developerEmail}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="merc-btn-ghost"
                  title="Sign out of developer console"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/client/login" className="merc-btn-secondary">
                  Sign In
                </Link>
                <Link to="/client/register" className="merc-btn-primary">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Developer Container */}
      <main className="merc-dev-container">
        {/* Page Header */}
        <section className="merc-dev-header">
          <p className="merc-dev-eyebrow">Developer Portal · OIDC Client Management</p>
          <div className="merc-dev-title-row">
            <div>
              <h1 className="merc-dev-title">Developer Console</h1>
              <p className="merc-dev-subtitle">
                Manage your OpenID Connect client applications, inspect credentials, and configure redirect URIs.
              </p>
            </div>
            {isAuthenticated && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="merc-badge merc-badge-green">OIDC Core 1.0</span>
                <span className="merc-badge merc-badge-cyan">RS256</span>
              </div>
            )}
          </div>
        </section>

        {loading ? (
          /* Loading State */
          <div className="merc-loading-wrap">
            <div className="merc-spinner" />
            <p>Loading developer console and applications from OpenPravesh...</p>
          </div>
        ) : isAuthenticated || sandboxActive ? (
          <>
            {/* Developer Console Navigation Tabs */}
            <nav className="merc-dev-nav-tabs" aria-label="Console Navigation">
              <button
                type="button"
                className={`merc-dev-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Dashboard Overview
              </button>
              <button
                type="button"
                className={`merc-dev-nav-tab ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                My Applications
                <span className="merc-dev-tab-count">{displayedApps.length}</span>
              </button>
              <button
                type="button"
                className={`merc-dev-nav-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                + Register New Client
              </button>
              <button
                type="button"
                className={`merc-dev-nav-tab ${activeTab === 'endpoints' ? 'active' : ''}`}
                onClick={() => setActiveTab('endpoints')}
              >
                OIDC Endpoints
              </button>
              <button
                type="button"
                className={`merc-dev-nav-tab ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Account
              </button>
            </nav>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <section className="merc-dev-stats-grid">
                  <article className="merc-dev-stat-card">
                    <p className="merc-dev-stat-label">Total Applications</p>
                    <p className="merc-dev-stat-value" style={{ color: 'var(--merc-signal-cyan)' }}>
                      {displayedApps.length}
                    </p>
                    <span className="merc-dev-stat-meta">Persisted in PostgreSQL</span>
                  </article>

                  <article className="merc-dev-stat-card">
                    <p className="merc-dev-stat-label">Client Status</p>
                    <p className="merc-dev-stat-value" style={{ color: 'var(--merc-signal-green)' }}>
                      Active
                    </p>
                    <span className="merc-dev-stat-meta">Verified in OpenPravesh registry</span>
                  </article>

                  <article className="merc-dev-stat-card">
                    <p className="merc-dev-stat-label">Token Signature</p>
                    <p className="merc-dev-stat-value">RS256</p>
                    <span className="merc-dev-stat-meta">Asymmetric 2048-bit RSA keys</span>
                  </article>

                  <article className="merc-dev-stat-card">
                    <p className="merc-dev-stat-label">JWKS Public Key</p>
                    <p className="merc-dev-stat-value" style={{ fontSize: '1.15rem' }}>
                      openpravesh-key-1
                    </p>
                    <span className="merc-dev-stat-meta">Live at /v1/certs</span>
                  </article>
                </section>

                {/* Primary Application Credentials Card */}
                {primaryApp && (
                  <section className="merc-glass-card merc-dev-card">
                    <div className="merc-dev-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 className="merc-dev-card-title">{primaryApp.clientName}</h2>
                          <span className="merc-app-badge">Active</span>
                        </div>
                        <p className="merc-dev-card-desc">
                          Primary credentials for initiating OpenID Connect authorization handshakes.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link
                          to="/login/$clientId"
                          params={{ clientId: primaryApp.clientId }}
                          className="merc-btn-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Launch Test Login Flow
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(primaryApp)
                            setInspectModalOpen(true)
                          }}
                          className="merc-btn-secondary"
                        >
                          Inspect Application
                        </button>
                      </div>
                    </div>

                    <div className="merc-dev-fields">
                      <div className="merc-dev-field-row">
                        <label className="merc-dev-field-label">Client ID (UUID)</label>
                        <div className="merc-dev-input-group">
                          <div className="merc-dev-code-val">{primaryApp.clientId}</div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(primaryApp.clientId, 'primary-id')}
                            className="merc-copy-btn"
                          >
                            {copiedKey === 'primary-id' ? 'Copied!' : 'Copy Client ID'}
                          </button>
                        </div>
                      </div>

                      <div className="merc-dev-field-row">
                        <label className="merc-dev-field-label">Registered Redirect Callback URI</label>
                        <div className="merc-dev-input-group">
                          <div className="merc-dev-code-val">{primaryApp.redirectUri}</div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(primaryApp.redirectUri, 'primary-redirect')}
                            className="merc-copy-btn"
                          >
                            {copiedKey === 'primary-redirect' ? 'Copied!' : 'Copy URI'}
                          </button>
                        </div>
                      </div>

                      {primaryApp.hostedUri && (
                        <div className="merc-dev-field-row">
                          <label className="merc-dev-field-label">Application Hosted URI</label>
                          <div className="merc-dev-input-group">
                            <div className="merc-dev-code-val">{primaryApp.hostedUri}</div>
                            <a
                              href={primaryApp.hostedUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="merc-copy-btn"
                            >
                              Visit Application
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Back-Channel Token Exchange Code Snippet */}
                {primaryApp && (
                  <section className="merc-glass-card merc-dev-card">
                    <div className="merc-dev-card-header">
                      <div>
                        <h2 className="merc-dev-card-title">Token Exchange (cURL)</h2>
                        <p className="merc-dev-card-desc">
                          Execute this command from your server backend to exchange the single-use authorization code for RS256 JWT tokens.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `curl -X POST "http://localhost:8000/v1/token/${primaryApp.clientId}/<CLIENT_SECRET>/<AUTHORIZATION_CODE>"`,
                            'curl-overview',
                          )
                        }
                        className="merc-copy-btn"
                      >
                        {copiedKey === 'curl-overview' ? 'Copied!' : 'Copy cURL'}
                      </button>
                    </div>

                    <div className="merc-dev-code-box">
                      <pre>
                        <code>{`# Back-channel token exchange using client credentials & auth code
curl -X POST "http://localhost:8000/v1/token/${primaryApp.clientId}/<YOUR_CLIENT_SECRET>/<AUTHORIZATION_CODE>"`}</code>
                      </pre>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* TAB 2: MY APPLICATIONS */}
            {activeTab === 'applications' && (
              <section className="merc-glass-card merc-dev-card">
                <div className="merc-dev-card-header">
                  <div>
                    <h2 className="merc-dev-card-title">My Registered Applications</h2>
                    <p className="merc-dev-card-desc">
                      All OIDC relying party clients associated with your developer account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="merc-btn-primary"
                  >
                    + Register New Application
                  </button>
                </div>

                {displayedApps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--merc-text-secondary)' }}>
                    <p>No applications registered yet under this account.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="merc-btn-primary"
                      style={{ marginTop: '12px' }}
                    >
                      Register Your First Application
                    </button>
                  </div>
                ) : (
                  <div className="merc-apps-grid">
                    {displayedApps.map((app) => (
                      <article key={app.clientId} className="merc-app-card">
                        <div>
                          <div className="merc-app-card-top">
                            <h3 className="merc-app-name">{app.clientName}</h3>
                            <span className="merc-app-badge">OIDC Client</span>
                          </div>

                          <div className="merc-app-id-box" style={{ marginTop: '12px' }}>
                            <span className="merc-app-id-text" title={app.clientId}>
                              {app.clientId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(app.clientId, `app-id-${app.clientId}`)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--merc-silver)',
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                padding: '2px 6px',
                              }}
                            >
                              {copiedKey === `app-id-${app.clientId}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>

                          <div className="merc-app-meta-row" style={{ marginTop: '14px' }}>
                            <div className="merc-app-meta-item">
                              <span style={{ color: 'var(--merc-text-secondary)', fontWeight: 500 }}>
                                Callback:
                              </span>
                              <span title={app.redirectUri} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {app.redirectUri}
                              </span>
                            </div>

                            {app.hostedUri && (
                              <div className="merc-app-meta-item">
                                <span style={{ color: 'var(--merc-text-secondary)', fontWeight: 500 }}>
                                  Hosted:
                                </span>
                                <a
                                  href={app.hostedUri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--merc-signal-cyan)', textDecoration: 'none' }}
                                >
                                  {app.hostedUri}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="merc-app-actions">
                          <Link
                            to="/login/$clientId"
                            params={{ clientId: app.clientId }}
                            className="merc-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Launch Login Flow
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app)
                              setInspectModalOpen(true)
                            }}
                            className="merc-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Inspect / Manage
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB 3: REGISTER NEW CLIENT */}
            {activeTab === 'register' && (
              <section className="merc-glass-card merc-dev-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
                <div className="merc-dev-card-header">
                  <div>
                    <h2 className="merc-dev-card-title">Register New Client Application</h2>
                    <p className="merc-dev-card-desc">
                      Provision a new Relying Party application associated with your developer account.
                    </p>
                  </div>
                </div>

                {createAppError && (
                  <div className="merc-alert merc-alert-error" role="alert">
                    <span>{createAppError}</span>
                  </div>
                )}

                {createdAppResult && (
                  <div className="merc-alert merc-alert-success" style={{ flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>Application successfully provisioned!</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
                        Make sure to securely copy your Client Secret below. It will NOT be shown again.
                      </p>
                    </div>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="merc-dev-field-row">
                        <label className="merc-dev-field-label">Client ID (UUID)</label>
                        <div className="merc-dev-input-group">
                          <div className="merc-dev-code-val">{createdAppResult.clientId}</div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdAppResult.clientId, 'new-id')}
                            className="merc-copy-btn"
                          >
                            {copiedKey === 'new-id' ? 'Copied!' : 'Copy ID'}
                          </button>
                        </div>
                      </div>

                      <div className="merc-dev-field-row">
                        <label className="merc-dev-field-label">Client Secret (Save this now)</label>
                        <div className="merc-dev-input-group">
                          <div className="merc-dev-code-val">
                            {showSecret
                              ? createdAppResult.clientSecret
                              : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="merc-copy-btn"
                          >
                            {showSecret ? 'Hide' : 'Reveal'}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdAppResult.clientSecret, 'new-secret')}
                            className="merc-copy-btn"
                          >
                            {copiedKey === 'new-secret' ? 'Copied!' : 'Copy Secret'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCreatedAppResult(null)
                        setActiveTab('applications')
                      }}
                      className="merc-btn-primary"
                      style={{ marginTop: '8px', alignSelf: 'flex-start' }}
                    >
                      View in My Applications →
                    </button>
                  </div>
                )}

                {!createdAppResult && (
                  <form onSubmit={handleNewAppSubmit(onRegisterNewApp)} className="merc-dev-fields">
                    <div className="merc-dev-field-row">
                      <label className="merc-dev-field-label" htmlFor="app-name">
                        Application Name *
                      </label>
                      <input
                        id="app-name"
                        type="text"
                        placeholder="e.g. Acme Web Client"
                        className="merc-input"
                        {...registerNewApp('clientName', { required: 'Application name is required' })}
                      />
                      {newAppErrors.clientName && (
                        <p style={{ color: 'var(--merc-signal-red)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                          {newAppErrors.clientName.message}
                        </p>
                      )}
                    </div>

                    <div className="merc-dev-field-row">
                      <label className="merc-dev-field-label" htmlFor="app-redirect">
                        Redirect Callback URI *
                      </label>
                      <input
                        id="app-redirect"
                        type="url"
                        placeholder="e.g. https://my-app.com/api/auth/callback"
                        className="merc-input"
                        {...registerNewApp('redirectUri', {
                          required: 'Redirect URI is required',
                          pattern: {
                            value: /^https?:\/\/.+/i,
                            message: 'Must be a valid URL starting with http:// or https://',
                          },
                        })}
                      />
                      {newAppErrors.redirectUri && (
                        <p style={{ color: 'var(--merc-signal-red)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                          {newAppErrors.redirectUri.message}
                        </p>
                      )}
                      <p style={{ color: 'var(--merc-text-muted)', fontSize: '0.78rem', margin: '2px 0 0' }}>
                        Where OpenPravesh redirects the user with the authorization code upon successful login.
                      </p>
                    </div>

                    <div className="merc-dev-field-row">
                      <label className="merc-dev-field-label" htmlFor="app-hosted">
                        Application Hosted Website URI (Optional)
                      </label>
                      <input
                        id="app-hosted"
                        type="url"
                        placeholder="e.g. https://my-app.com"
                        className="merc-input"
                        {...registerNewApp('hostedUri')}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button
                        type="submit"
                        disabled={isCreatingApp}
                        className="merc-btn-primary"
                        style={{ padding: '10px 24px' }}
                      >
                        {isCreatingApp ? 'Registering Application...' : 'Register Application'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('applications')}
                        className="merc-btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* TAB 4: PROTOCOL ENDPOINTS */}
            {activeTab === 'endpoints' && (
              <section className="merc-glass-card merc-dev-card">
                <div className="merc-dev-card-header">
                  <div>
                    <h2 className="merc-dev-card-title">Supported OIDC Endpoints</h2>
                    <p className="merc-dev-card-desc">
                      Verified endpoint contracts implemented in the OpenPravesh backend.
                    </p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="merc-endpoints-table">
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>Endpoint</th>
                        <th>Purpose</th>
                        <th>Response Format</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className="merc-method-tag merc-method-get">GET</span>
                        </td>
                        <td>
                          <code>/.well-known/openid-configuration</code>
                        </td>
                        <td>OpenID Connect discovery document</td>
                        <td>JSON Metadata</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="merc-method-tag merc-method-get">GET</span>
                        </td>
                        <td>
                          <code>/v1/certs</code>
                        </td>
                        <td>Public JWKS key registry for RS256 validation</td>
                        <td>JWK Set</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="merc-method-tag merc-method-post">POST</span>
                        </td>
                        <td>
                          <code>/login/:clientId</code>
                        </td>
                        <td>User authentication & redirect with code</td>
                        <td>Redirect / JSON URL</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="merc-method-tag merc-method-post">POST</span>
                        </td>
                        <td>
                          <code>/v1/token/:clientId/:secret/:code</code>
                        </td>
                        <td>Code exchange for Access & ID tokens</td>
                        <td>Signed JWT Tokens</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="merc-method-tag merc-method-get">GET</span>
                        </td>
                        <td>
                          <code>/userInfo</code>
                        </td>
                        <td>Token verification & user identity claims</td>
                        <td>Bearer Claims JSON</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TAB 5: ACCOUNT */}
            {activeTab === 'account' && (
              <section className="merc-glass-card merc-dev-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
                <div className="merc-dev-card-header">
                  <div>
                    <h2 className="merc-dev-card-title">Developer Account Information</h2>
                    <p className="merc-dev-card-desc">
                      Authenticated developer profile and session management.
                    </p>
                  </div>
                </div>

                <div className="merc-dev-fields">
                  <div className="merc-dev-field-row">
                    <label className="merc-dev-field-label">Developer Email</label>
                    <div className="merc-dev-code-val">
                      {developerEmail || (sandboxActive ? 'sandbox-demo@openpravesh.local' : 'Authenticated Developer')}
                    </div>
                  </div>

                  <div className="merc-dev-field-row">
                    <label className="merc-dev-field-label">Session Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                      <span className="merc-nav-user-dot" />
                      <span style={{ fontSize: '0.9rem', color: 'var(--merc-signal-green)' }}>
                        Active Persistent Session (Valid JWT)
                      </span>
                    </div>
                  </div>

                  <div className="merc-dev-field-row">
                    <label className="merc-dev-field-label">Total Applications Registered</label>
                    <div className="merc-dev-code-val">{displayedApps.length} applications</div>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--merc-border-subtle)' }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="merc-btn-secondary"
                      style={{ color: 'var(--merc-signal-red)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      Sign Out of Developer Console
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Empty / Unauthenticated Developer State */
          <div className="merc-glass-card merc-dev-empty">
            <div className="merc-dev-empty-icon" aria-hidden="true">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '0 0 8px' }}>
              No Active Developer Session
            </h2>
            <p style={{ color: 'var(--merc-text-secondary)', fontSize: '0.92rem', margin: '0 0 24px' }}>
              Please sign in with your registered OpenPravesh client credentials to access your application dashboard and keys.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/client/login" className="merc-btn-primary">
                Client Sign In
              </Link>
              <Link to="/client/register" className="merc-btn-secondary">
                Register New Application
              </Link>
              <button
                type="button"
                onClick={() => setSandboxActive(true)}
                className="merc-btn-ghost"
              >
                Preview with Demo Client
              </button>
            </div>
          </div>
        )}

        {/* Modal: Application Details Inspector */}
        {inspectModalOpen && selectedApp && (
          <div className="merc-modal-backdrop" onClick={() => setInspectModalOpen(false)}>
            <div className="merc-modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="merc-modal-header">
                <div>
                  <h3 className="merc-modal-title">{selectedApp.clientName}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--merc-text-muted)' }}>
                    Application Details & Credentials
                  </span>
                </div>
                <button
                  type="button"
                  className="merc-modal-close-btn"
                  onClick={() => setInspectModalOpen(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="merc-dev-fields">
                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Client ID (UUID)</label>
                  <div className="merc-dev-input-group">
                    <div className="merc-dev-code-val">{selectedApp.clientId}</div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedApp.clientId, 'modal-id')}
                      className="merc-copy-btn"
                    >
                      {copiedKey === 'modal-id' ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                </div>

                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Redirect Callback URI</label>
                  <div className="merc-dev-input-group">
                    <div className="merc-dev-code-val">{selectedApp.redirectUri}</div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedApp.redirectUri, 'modal-redirect')}
                      className="merc-copy-btn"
                    >
                      {copiedKey === 'modal-redirect' ? 'Copied!' : 'Copy URI'}
                    </button>
                  </div>
                </div>

                {selectedApp.hostedUri && (
                  <div className="merc-dev-field-row">
                    <label className="merc-dev-field-label">Hosted Web URI</label>
                    <div className="merc-dev-input-group">
                      <div className="merc-dev-code-val">{selectedApp.hostedUri}</div>
                      <a
                        href={selectedApp.hostedUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="merc-copy-btn"
                      >
                        Visit
                      </a>
                    </div>
                  </div>
                )}

                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Token Exchange cURL</label>
                  <div className="merc-dev-code-box">
                    <pre>
                      <code>{`curl -X POST "http://localhost:8000/v1/token/${selectedApp.clientId}/<YOUR_CLIENT_SECRET>/<AUTHORIZATION_CODE>"`}</code>
                    </pre>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <Link
                    to="/login/$clientId"
                    params={{ clientId: selectedApp.clientId }}
                    className="merc-btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Launch Test Login Flow
                  </Link>
                  <button
                    type="button"
                    onClick={() => setInspectModalOpen(false)}
                    className="merc-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
