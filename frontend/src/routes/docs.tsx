import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { OpenPraveshLogo } from '../components/OpenPraveshLogo'
import '../styles/pages/docs.css'

export const Route = createFileRoute('/docs')({
  component: DocumentationPage,
})

function DocumentationPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedSection(id)
    setTimeout(() => setCopiedSection(null), 2000)
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
            <Link to="/developer" className="merc-nav-link">
              Developer Portal
            </Link>
            <Link to="/client/register" className="merc-btn-primary">
              Register Client
            </Link>
          </nav>
        </div>
      </header>

      {/* Docs Grid Layout */}
      <div className="merc-docs-layout">
        {/* Sidebar Nav */}
        <aside className="merc-docs-sidebar">
          <div>
            <p className="merc-docs-sidebar-title">Getting Started</p>
            <ul className="merc-docs-nav-list">
              <li className="merc-docs-nav-item">
                <a href="#overview">Architecture Overview</a>
              </li>
              <li className="merc-docs-nav-item">
                <a href="#setup">Local Setup & Bun</a>
              </li>
            </ul>
          </div>

          <div>
            <p className="merc-docs-sidebar-title">OIDC Protocol Flow</p>
            <ul className="merc-docs-nav-list">
              <li className="merc-docs-nav-item">
                <a href="#flow">3-Step Authorization Flow</a>
              </li>
              <li className="merc-docs-nav-item">
                <a href="#authorize">Step 1: Redirect & Login</a>
              </li>
              <li className="merc-docs-nav-item">
                <a href="#token">Step 2: Token Exchange</a>
              </li>
              <li className="merc-docs-nav-item">
                <a href="#userinfo">Step 3: UserInfo Claims</a>
              </li>
            </ul>
          </div>

          <div>
            <p className="merc-docs-sidebar-title">Endpoints & Keys</p>
            <ul className="merc-docs-nav-list">
              <li className="merc-docs-nav-item">
                <a href="#discovery">Service Discovery</a>
              </li>
              <li className="merc-docs-nav-item">
                <a href="#jwks">RS256 Public JWKS</a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Documentation Content */}
        <main className="merc-docs-content">
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontFamily: 'var(--merc-font-mono)', fontSize: '0.78rem', color: 'var(--merc-signal-cyan)', margin: '0 0 8px' }}>
              SPECIFICATION & REFERENCE · RFC 6749 & OIDC CORE 1.0
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
              OpenPravesh Protocol Documentation
            </h1>
            <p style={{ color: 'var(--merc-text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '720px' }}>
              A technical guide to integrating your client applications with OpenPravesh: endpoints, cryptographic token signatures, and authorization workflows.
            </p>
          </div>

          {/* Section 1: Overview */}
          <section id="overview" className="merc-docs-section">
            <h2>Architecture Overview</h2>
            <p>
              OpenPravesh is an educational, production-patterned OpenID Connect (OIDC) identity provider implemented in TypeScript. It is designed to expose every state transition of the authorization grant without opaque framework magic.
            </p>
            <p>
              The system cleanly separates two distinct classes of accounts in PostgreSQL:
            </p>
            <ul>
              <li>
                <strong>Client Applications (<code>clientsTable</code>):</strong> Developers who register an application with a name, redirect URI, and contact email. They receive a <code>clientId</code> and confidential <code>clientSecret</code>.
              </li>
              <li>
                <strong>End-Users (<code>usersTable</code>):</strong> Individuals who hold an identity and password. Users sign in and grant consent, prompting OpenPravesh to redirect to the client with a cryptographic authorization code.
              </li>
            </ul>
          </section>

          {/* Section 2: 3-Step Flow */}
          <section id="flow" className="merc-docs-section">
            <h2>3-Step Authorization Code Flow</h2>
            <p>
              The standard Authorization Code grant executes across three distinct phases:
            </p>
            <ol>
              <li>
                <strong>Browser Redirect:</strong> Client application sends the user to <code>/login/:clientId</code>.
              </li>
              <li>
                <strong>Authentication & Consent:</strong> The user verifies credentials at OpenPravesh. OpenPravesh generates a single-use authorization code with a 60-second TTL and redirects to <code>{`{redirectUri}?code={code}`}</code>.
              </li>
              <li>
                <strong>Back-Channel Exchange:</strong> Client backend sends a confidential POST request to <code>/v1/token/:clientId/:clientSecret/:code</code> to receive RS256 signed Access & ID tokens.
              </li>
            </ol>
          </section>

          {/* Section 3: Discovery */}
          <section id="discovery" className="merc-docs-section">
            <h2>Service Discovery</h2>
            <p>
              OpenPravesh exposes standard OIDC discovery metadata to enable zero-configuration client integration.
            </p>

            <div className="merc-endpoint-spec-card">
              <div className="merc-endpoint-spec-header">
                <span className="merc-method-tag merc-method-get">GET</span>
                <span className="merc-endpoint-path">/.well-known/openid-configuration</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Returns JSON metadata detailing all provider endpoints and cryptographic capabilities.
              </p>
            </div>

            <div className="merc-docs-code-block">
              <div className="merc-code-header">
                <span>JSON Response · 200 OK</span>
                <button
                  type="button"
                  onClick={() =>
                    copySnippet(
                      JSON.stringify(
                        {
                          issuer: 'http://localhost:3000',
                          authorization_endpoint: 'http://localhost:3000/v1/auth',
                          token_endpoint: 'http://localhost:3000/v1/token',
                          userinfo_endpoint: 'http://localhost:3000/v1/userinfo',
                          jwks_uri: 'http://localhost:3000/v1/certs',
                        },
                        null,
                        2
                      ),
                      'discovery'
                    )
                  }
                  className="merc-btn-ghost"
                  style={{ fontSize: '0.74rem', padding: '2px 8px' }}
                >
                  {copiedSection === 'discovery' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre>
                <code>{`{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/v1/auth",
  "token_endpoint": "http://localhost:3000/v1/token",
  "userinfo_endpoint": "http://localhost:3000/v1/userinfo",
  "jwks_uri": "http://localhost:3000/v1/certs"
}`}</code>
              </pre>
            </div>
          </section>

          {/* Section 4: JWKS */}
          <section id="jwks" className="merc-docs-section">
            <h2>Public JWKS Keys (RS256)</h2>
            <p>
              All tokens issued by OpenPravesh are signed with an asymmetric 2048-bit RSA private key using the <code>RS256</code> algorithm. The corresponding public keys are published in standard JWK Set format.
            </p>

            <div className="merc-endpoint-spec-card">
              <div className="merc-endpoint-spec-header">
                <span className="merc-method-tag merc-method-get">GET</span>
                <span className="merc-endpoint-path">/v1/certs</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Returns the public key set containing the RSA modulus (<code>n</code>), exponent (<code>e</code>), and key ID (<code>kid: &quot;openpravesh-key-1&quot;</code>).
              </p>
            </div>

            <p>
              Clients can statelessly verify signatures by caching the public key from this endpoint, preventing unnecessary database roundtrips.
            </p>
          </section>

          {/* Section 5: Step 1 Redirect */}
          <section id="authorize" className="merc-docs-section">
            <h2>Step 1: User Login & Authorization</h2>
            <div className="merc-endpoint-spec-card">
              <div className="merc-endpoint-spec-header">
                <span className="merc-method-tag merc-method-post">POST</span>
                <span className="merc-endpoint-path">/login/:clientId</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Authenticates user credentials, generates a 60-second cryptographic authorization code, and returns the registered redirect target.
              </p>
            </div>

            <div className="merc-docs-code-block">
              <div className="merc-code-header">
                <span>Request Body (JSON)</span>
              </div>
              <pre>
                <code>{`{
  "email": "user@example.com",
  "password": "user_password_here"
}`}</code>
              </pre>
            </div>

            <div className="merc-docs-code-block">
              <div className="merc-code-header">
                <span>Response (200 OK)</span>
              </div>
              <pre>
                <code>{`{
  "redirectTo": "http://localhost:5173/callback?code=e67df4807469a9b8..."
}`}</code>
              </pre>
            </div>
          </section>

          {/* Section 6: Token Exchange */}
          <section id="token" className="merc-docs-section">
            <h2>Step 2: Token Exchange</h2>
            <p>
              The client backend exchanges the single-use authorization code and confidential client secret directly with the token endpoint.
            </p>

            <div className="merc-endpoint-spec-card">
              <div className="merc-endpoint-spec-header">
                <span className="merc-method-tag merc-method-post">POST</span>
                <span className="merc-endpoint-path">/v1/token/:clientId/:clientSecret/:authCode</span>
              </div>
            </div>

            <div className="merc-docs-code-block">
              <div className="merc-code-header">
                <span>cURL Request Example</span>
                <button
                  type="button"
                  onClick={() =>
                    copySnippet(
                      'curl -X POST "http://localhost:3000/v1/token/<CLIENT_ID>/<CLIENT_SECRET>/<AUTH_CODE>"',
                      'curl-token'
                    )
                  }
                  className="merc-btn-ghost"
                  style={{ fontSize: '0.74rem', padding: '2px 8px' }}
                >
                  {copiedSection === 'curl-token' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre>
                <code>{`curl -X POST "http://localhost:3000/v1/token/{clientId}/{clientSecret}/{authCode}"`}</code>
              </pre>
            </div>

            <div className="merc-docs-code-block">
              <div className="merc-code-header">
                <span>Token Response (200 OK)</span>
              </div>
              <pre>
                <code>{`{
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Im9wZW5wcmF2ZXNoLWtleS0xIiw...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
}`}</code>
              </pre>
            </div>
          </section>

          {/* Section 7: UserInfo */}
          <section id="userinfo" className="merc-docs-section">
            <h2>Step 3: UserInfo Endpoint</h2>
            <div className="merc-endpoint-spec-card">
              <div className="merc-endpoint-spec-header">
                <span className="merc-method-tag merc-method-get">GET</span>
                <span className="merc-endpoint-path">/userInfo</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Validates the RS256 Bearer access token and returns verified identity claims.
              </p>
            </div>

            <div className="merc-docs-code-block">
              <div className="merc-code-header">
                <span>HTTP Request</span>
              </div>
              <pre>
                <code>{`GET /userInfo HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...`}</code>
              </pre>
            </div>
          </section>

          {/* Section 8: Local Setup */}
          <section id="setup" className="merc-docs-section">
            <h2>Local Setup & Self-Hosting</h2>
            <p>
              To run the OpenPravesh backend locally:
            </p>
            <div className="merc-docs-code-block">
              <pre>
                <code>{`# 1. Install dependencies with Bun
bun install

# 2. Run Drizzle database migrations
bun run migrate

# 3. Start development server on port 3000
bun run dev`}</code>
              </pre>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
