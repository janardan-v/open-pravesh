import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { OpenPraveshLogo } from '../components/OpenPraveshLogo'
import '../styles/pages/developer.css'

export type DeveloperClient = {
  clientId: string
  clientSecret?: string
  hostedUri: string
  redirectUri: string
}

export const Route = createFileRoute('/developer')({
  component: DeveloperDashboard,
})

function DeveloperDashboard() {
  const navigate = useNavigate()
  const [showSecret, setShowSecret] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [sandboxActive, setSandboxActive] = useState(false)

  // Read stored client from session
  let storedClient: DeveloperClient | null = null
  try {
    const raw = sessionStorage.getItem('developerClient')
    if (raw) {
      storedClient = JSON.parse(raw) as DeveloperClient
    }
  } catch {
    storedClient = null
  }

  // Fallback demo/sandbox client if developer tests directly
  const demoClient: DeveloperClient = {
    clientId: 'openpravesh-client-demo-9921',
    clientSecret: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    redirectUri: 'http://localhost:5173/callback',
    hostedUri: 'http://localhost:5173',
  }

  const client = storedClient || (sandboxActive ? demoClient : null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('developerClient')
    setSandboxActive(false)
    await navigate({ to: '/client/login' })
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
              Documentation
            </Link>
            {client ? (
              <button
                type="button"
                onClick={handleLogout}
                className="merc-btn-ghost"
                title="Sign out of developer account"
              >
                Sign Out
              </button>
            ) : (
              <Link to="/client/login" className="merc-btn-primary">
                Client Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="merc-dev-container">
        {/* Page Header */}
        <section className="merc-dev-header">
          <p className="merc-dev-eyebrow">Developer Portal · OIDC Client Management</p>
          <div className="merc-dev-title-row">
            <div>
              <h1 className="merc-dev-title">Application Console</h1>
              <p className="merc-dev-subtitle">
                Inspect your registered client credentials, configure callback URIs, and test OpenID Connect authentication flows against OpenPravesh.
              </p>
            </div>
            {client && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="merc-badge merc-badge-green">OIDC Core 1.0</span>
                <span className="merc-badge merc-badge-cyan">RS256</span>
              </div>
            )}
          </div>
        </section>

        {client ? (
          <>
            {/* Overview Stats */}
            <section className="merc-dev-stats-grid">
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

              <article className="merc-dev-stat-card">
                <p className="merc-dev-stat-label">Code TTL</p>
                <p className="merc-dev-stat-value">60s</p>
                <span className="merc-dev-stat-meta">Single-use authorization code</span>
              </article>
            </section>

            {/* Application Credentials */}
            <section className="merc-glass-card merc-dev-card">
              <div className="merc-dev-card-header">
                <div>
                  <h2 className="merc-dev-card-title">Client Credentials</h2>
                  <p className="merc-dev-card-desc">
                    Use these credentials in your application backend to request tokens via back-channel exchange.
                  </p>
                </div>
                <Link
                  to="/login/$clientId"
                  params={{ clientId: client.clientId }}
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
              </div>

              <div className="merc-dev-fields">
                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Client ID (UUID)</label>
                  <div className="merc-dev-input-group">
                    <div className="merc-dev-code-val">{client.clientId}</div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(client.clientId, 'id')}
                      className="merc-copy-btn"
                    >
                      {copiedKey === 'id' ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                </div>

                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Client Secret</label>
                  <div className="merc-dev-input-group">
                    <div className="merc-dev-code-val">
                      {client.clientSecret
                        ? showSecret
                          ? client.clientSecret
                          : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                        : 'Securely stored on server (available on registration)'}
                    </div>
                    {client.clientSecret && (
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="merc-copy-btn"
                      >
                        {showSecret ? 'Hide' : 'Reveal'}
                      </button>
                    )}
                    {client.clientSecret && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(client.clientSecret!, 'secret')}
                        className="merc-copy-btn"
                      >
                        {copiedKey === 'secret' ? 'Copied!' : 'Copy Secret'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Registered Redirect Callback URI</label>
                  <div className="merc-dev-input-group">
                    <div className="merc-dev-code-val">{client.redirectUri}</div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(client.redirectUri, 'redirect')}
                      className="merc-copy-btn"
                    >
                      {copiedKey === 'redirect' ? 'Copied!' : 'Copy URI'}
                    </button>
                  </div>
                </div>

                <div className="merc-dev-field-row">
                  <label className="merc-dev-field-label">Application Hosted URI</label>
                  <div className="merc-dev-input-group">
                    <div className="merc-dev-code-val">{client.hostedUri || 'Not specified'}</div>
                    {client.hostedUri && (
                      <a
                        href={client.hostedUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="merc-copy-btn"
                      >
                        Visit App
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Back-Channel Token Exchange Code Snippet */}
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
                      `curl -X POST "http://localhost:3000/v1/token/${client.clientId}/${client.clientSecret || '<CLIENT_SECRET>'}/<AUTHORIZATION_CODE>"`,
                      'curl'
                    )
                  }
                  className="merc-copy-btn"
                >
                  {copiedKey === 'curl' ? 'Copied!' : 'Copy cURL'}
                </button>
              </div>

              <div className="merc-dev-code-box">
                <pre>
                  <code>{`# Exchange single-use auth code for Access & ID tokens
curl -X POST "http://localhost:3000/v1/token/${client.clientId}/${client.clientSecret ? client.clientSecret : '<YOUR_CLIENT_SECRET>'}/<AUTHORIZATION_CODE>"`}</code>
                </pre>
              </div>
            </section>

            {/* Supported Endpoints Directory */}
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
      </main>
    </div>
  )
}
