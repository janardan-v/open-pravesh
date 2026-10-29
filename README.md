# OpenPravesh (ओपन प्रवेश)

<div align="center">

```
  ██████╗ ██████╗ ███████╗███╗   ██╗    ██████╗ ██████╗  █████╗ ██╗   ██╗███████╗███████╗██╗  ██╗
 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║    ██╔══██╗██╔══██╗██╔══██╗██║   ██║██╔════╝██╔════╝██║  ██║
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║    ██████╔╝██████╔╝███████║██║   ██║█████╗  ███████╗███████║
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║    ██╔═══╝ ██╔══██╗██╔══██║╚██╗ ██╔╝██╔══╝  ╚════██║██╔══██║
 ╚██████╔╝██║     ███████╗██║ ╚████║    ██║     ██║  ██║██║  ██║ ╚████╔╝ ███████╗███████║██║  ██║
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚══════╝╚═╝  ╚═╝
```

### An OIDC and OAuth Identity Provider Proof of Concept

*A hands-on implementation exploring authorization codes, asymmetric JWT signing, JWKS, discovery metadata, and the authentication lifecycle.*

[![GitHub Repository](https://img.shields.io/badge/GitHub-janardan--v%2Fopen--pravesh-181717?logo=github&logoColor=white)](https://github.com/janardan-v/open-pravesh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Runtime-Bun%20v1.2+-black?logo=bun&logoColor=white)](https://bun.sh/)
[![Express](https://img.shields.io/badge/Framework-Express%20v5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle%20ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2017-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[Project Overview](#-project-overview--educational-scope) •
[Implemented Features](#-implemented-features) •
[Project Scope & Protocol Notes](#-project-scope--protocol-notes) •
[Architecture & Protocol Flow](#-architecture--protocol-flow) •
[Technology Stack](#-technology-stack) •
[Repository Structure](#-repository-structure) •
[Quick Start](#-quick-start-guide) •
[API & Endpoints](#-api--endpoint-reference) •
[Token Lifecycle & Claims](#-token-lifecycle--claims) •
[Token Verification](#-jwks--token-verification-guide) •
[Security Notes](#-security-considerations--learning-notes) •
[Roadmap](#-roadmap)

</div>

---

## 📌 Project Overview & Educational Scope

Modern authentication platforms like Auth0, Keycloak, and Okta handle identity for millions of systems, but their internal mechanics are typically obscured behind layers of framework abstraction.

**OpenPravesh** (*"Pravesh"* meaning *Entrance* or *Gateway* in Sanskrit/Hindi) is a **personal learning project and proof of concept (PoC)** created by [janardan-v](https://github.com/janardan-v/open-pravesh) to explore how an **Identity Provider (IdP) and Authorization Server** works from the ground up.

The project demonstrates core authentication and authorization concepts in a tangible, auditable codebase:
- Relational data segregation between relying parties (clients) and end-users.
- OAuth-style authorization code issuance and consumption.
- Asymmetric cryptographic signing with RSA private keys (RS256).
- Public key exposure via a JSON Web Key Set (JWKS) endpoint.
- OIDC service discovery conventions.
- Protected claims retrieval through a UserInfo endpoint.
- An interactive developer portal and authorization-flow simulator.

> [!NOTE]
> **Proof-of-Concept Notice**: OpenPravesh is an educational demonstration designed to study protocols and cryptographic handshakes. It is **not** designed for production environments. The codebase reflects a hands-on exploration of identity concepts, featuring deliberate educational simplifications alongside documented protocol distinctions.

---

## ⚡ Implemented Features

### 1. Identity & Credential Management
- **Separate Entity Models**: Managed using Drizzle ORM on PostgreSQL with distinct tables for client applications (`clientsTable`) and end-users (`usersTable`).
- **Argon2id Password Hashing**: Uses Bun's native password hashing APIs (`password` from `"bun"` / `Bun.password`), which defaults to the Argon2id algorithm for password hashing and verification.
- **Client Provisioning**: Developers can register Relying Party applications (`POST /client-register`), generate client credentials, and record redirect targets.

### 2. Authorization Code Handshake
- **Client-Scoped Login**: Directs user authentication to the specific client ID (`POST /login/:clientId/`).
- **Ephemeral Authorization Codes**: Issues single-use 32-byte cryptographic hex codes with a 60-second time-to-live (TTL).
- **In-Memory Code Registry**: Stores active authorization codes in memory mapped to the authenticated user ID, email, and target client ID.
- **Direct Code Exchange**: Back-channel exchange (`POST /v1/token/:clientId/:clientSecret/:authCode`) verifying client ownership, comparing secrets, and destroying the authorization code upon first use.

### 3. Cryptographic Token Issuance (JOSE / RS256)
- **Asymmetric RSA 2048-Bit Signing**: Tokens are signed by OpenPravesh using an RSA private key in PEM format via the `RS256` algorithm.
- **Public JWKS Keystore (`/v1/certs`)**: Exposes the corresponding public key material formatted as a JSON Web Key Set via `node-jose`. Resource servers and clients verify token signatures using this trusted public key without needing access to the private signing key.
- **Protected UserInfo Endpoint (`/userInfo`)**: Validates the incoming RS256 Bearer access token signature and expiration, returning decoded payload identity claims.

### 4. Interactive Developer UI & Simulator
- **Visual Protocol Simulator**: Step-by-step visualizer for each phase of the authorization handshake, with cURL generators and token viewers.
- **Developer Portal**: Dashboard for managing provisioned client credentials (`clientId`, `clientSecret`, `redirectUri`).
- **Modern Frontend Shell**: Built with React 19, Vite, TanStack Router, and a custom "Liquid Mercury" dark mode UI.

---

## 📐 Project Scope & Protocol Notes

As an educational proof of concept, OpenPravesh focuses on demonstrating the core mechanics of the authorization handshake and asymmetric token cryptography. The table below details how the current PoC design relates to production OAuth 2.0 / OIDC standards:

| Protocol Dimension | OpenPravesh PoC Design | Standard Specification / Future Scope |
| :--- | :--- | :--- |
| **Token Types** | Issues `{ accessToken, refreshToken }` signed with RS256. | OpenID Connect additionally defines an **ID Token** (`id_token`) to communicate identity to the client app (planned in roadmap). |
| **Token Response Format** | Delivers `{ accessToken, refreshToken }` in camelCase with HTTP 200. | RFC 6749 defines standardized snake_case response fields, including required `access_token` and `token_type`, recommended `expires_in`, and optional `refresh_token` when issued. OpenPravesh currently returns camelCase fields as an educational simplification. |
| **Token Claims & Subject** | Returns custom claims `{ userId, userEmail, iat, exp }`. | OIDC Core 1.0 standardizes `sub` (subject identifier) alongside `iss` (issuer) and `aud` (audience). |
| **Token Endpoint Transport** | Path parameters: `/v1/token/:clientId/:clientSecret/:authCode`. | RFC 6749 specifies POST parameters in `application/x-www-form-urlencoded` bodies and separate client authentication (e.g., HTTP Basic). |
| **Client Protection (PKCE)** | Single-use 60s authorization code exchange without PKCE. | PKCE (RFC 7636): Not implemented in the current PoC. The OAuth 2.1 Internet-Draft requires PKCE by default for authorization-code flows, subject to specified exceptions. PKCE enforcement remains planned for future work. |
| **Token Refreshing** | Generates 7-day refresh tokens upon code exchange. | Implementing the refresh-token grant (`grant_type=refresh_token`) and token rotation is planned for future work. |
| **Service Discovery** | `GET /.well-known/openid-configuration` returns primary endpoints. | OIDC Discovery requires additional metadata arrays (`response_types_supported`, etc.) and dynamic port alignment. |
| **Code Storage** | In-memory JavaScript dictionary (`inMemoryTable`) with 60s TTL. | Multi-instance production systems typically use a distributed store (e.g., Redis cluster) with automated key expiration. |

---

## 🔄 Architecture & Protocol Flow

The proof of concept implements an educational authorization-code grant flow. Client credentials and token exchange take place over a direct back-channel between the client application and OpenPravesh.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as End User (Browser)
    participant RP as Relying Party (Client App)
    participant IdP as OpenPravesh IdP (/login/:clientId)
    participant Token as OpenPravesh Token API (/v1/token/...)
    participant RS as Resource Server / UserInfo (/userInfo)

    Note over User,RP: 1. Authorization Request
    User->>RP: Click login in Client Application
    RP-->>User: Navigate to OpenPravesh login screen for client

    Note over User,IdP: 2. Authentication & Code Issuance
    User->>IdP: POST /login/:clientId/ with { email, password }
    IdP->>IdP: Validate credentials via Bun password API (Argon2id) against PostgreSQL
    IdP->>IdP: Generate 32-byte hex authorization code (TTL: 60s)
    IdP->>IdP: Store code in inMemoryTable with userId and clientId
    IdP-->>User: 200 OK JSON { redirectTo: "redirectUri?code={authCode}" }
    User-->>RP: Browser follows redirectTo URL to Client callback

    Note over RP,Token: 3. Back-Channel Code Exchange
    RP->>Token: POST /v1/token/:clientId/:clientSecret/:authCode
    Token->>Token: Verify clientId and clientSecret against database
    Token->>Token: Check code existence and TTL (<= 60s)
    Token->>Token: Consume authorization code (delete inMemoryTable[authCode])
    Token->>Token: Sign RS256 Access & Refresh tokens using private_key.pem
    Token-->>RP: Return 200 OK JSON { accessToken, refreshToken }

    Note over RP,RS: 4. User Claims / Token Verification
    RP->>RS: GET /userInfo with Bearer <accessToken>
    RS->>RS: Verify the RS256 signature using the trusted public key obtained from JWKS (/v1/certs)
    RS-->>RP: Return 200 OK JSON { userId, userEmail, iat, exp }
```

---

## 💻 Technology Stack

### Backend Engine
- **Runtime**: [Bun](https://bun.sh/) (v1.2+) & Node.js
- **Web Framework**: [Express.js v5](https://expressjs.com/)
- **Programming Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL 17](https://www.postgresql.org/)
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- **Cryptography & Tokens**: [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [node-jose](https://github.com/cisco/node-jose), native Node.js `crypto`
- **Password Security**: Bun's native password API (`password` from `"bun"` / `Bun.password`), utilizing the default **Argon2id** algorithm
- **Schema Validation**: [Zod v4](https://zod.dev/)
- **CORS & Utilities**: `cors`, `dotenv`

### Frontend Application
- **UI Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Routing**: [TanStack Router v1](https://tanstack.com/router) (file-based routing with code splitting)
- **CSS Engine**: [Tailwind CSS v4](https://tailwindcss.com/) & Custom Theme System
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)

---

## 📂 Repository Structure

```tree
open-pravesh/
├── backend/
│   ├── drizzle/                     # Drizzle SQL schema migration snapshots
│   ├── src/
│   │   ├── app/
│   │   │   ├── client/              # Relying party client registration & login routes
│   │   │   ├── oauth/               # Authorization code issuance & token exchange routes
│   │   │   ├── oidc/                # Service discovery & JWKS public key handlers
│   │   │   ├── user/                # User registration, authentication & /userInfo
│   │   │   └── app.ts               # Express application middleware pipeline
│   │   ├── common/
│   │   │   ├── middlewares/         # verifyClient and global error handling
│   │   │   └── utils/               # JWT sign/verify, PEM-to-JWKS loader, response wrappers
│   │   ├── db/
│   │   │   ├── index.ts             # PostgreSQL client pool initialization
│   │   │   ├── inMemory.ts          # In-memory dictionary for active authorization codes
│   │   │   └── schema.ts            # Drizzle table schemas (usersTable, clientsTable)
│   │   ├── keys/
│   │   │   ├── private_key.pem      # RSA 2048-bit Private Key (used for token signing)
│   │   │   └── public_key.pem       # RSA 2048-bit Public Key (exposed via JWKS)
│   │   └── server.ts                # HTTP server bootstrap & keystore initialization
│   ├── docker-compose.yml           # Local PostgreSQL 17 database service
│   ├── drizzle.config.ts            # Drizzle Kit CLI configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/                      # Static branding assets
│   ├── src/
│   │   ├── components/              # Canvases, logos, simulator components
│   │   ├── routes/
│   │   │   ├── client/              # /client/login and /client/register pages
│   │   │   ├── developer.tsx        # Developer portal & sandbox client view
│   │   │   ├── docs.tsx             # Protocol reference documentation page
│   │   │   ├── index.tsx            # Landing page & 5-step interactive flow visualizer
│   │   │   ├── login.$clientId.tsx  # End-user authentication form for client apps
│   │   │   ├── register.tsx         # End-user account registration
│   │   │   └── __root.tsx           # TanStack Router root layout
│   │   ├── services/                # Axios API client integrations
│   │   └── styles/                  # Custom theme variables and stylesheets
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Bun](https://bun.sh/) (v1.2+) *or* Node.js (v20+)
- [Docker & Docker Compose](https://www.docker.com/) (for PostgreSQL)
- [OpenSSL](https://www.openssl.org/) (optional, if generating custom RSA keys)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/janardan-v/open-pravesh.git
cd open-pravesh
```

---

### Step 2: Provision Local PostgreSQL

Start the PostgreSQL 17 database container using Docker Compose:

```bash
cd backend
docker compose up -d
```

This launches a containerized PostgreSQL instance listening on port `5432`.

---

### Step 3: Configure and Run Backend

1. **Create Backend Environment File**:
   Create a `.env` file inside `backend/`:

   ```env
   # Database connection string matching docker-compose.yml
   DATABASE_URL=postgresql://janardan:postgres@localhost:5432/openpravesh

   # Backend listening port
   PORT=8000

   # Client token secret
   CLIENT_TOKEN_SECRET=your_access_token_secret

   # Relative paths to cryptographic key pair
   PUBLIC_KEY_PATH=./src/keys/public_key.pem
   PRIVATE_KEY_PATH=./src/keys/private_key.pem
   ```

2. **Cryptographic Key Pairs**:
   The repository includes development keys under `backend/src/keys/`. If you wish to generate new keys:

   ```bash
   # Generate 2048-bit RSA private key
   openssl genrsa -out src/keys/private_key.pem 2048

   # Extract public key in PEM format
   openssl rsa -in src/keys/private_key.pem -pubout -out src/keys/public_key.pem
   ```

3. **Install Dependencies & Run Migrations**:

   ```bash
   bun install
   bun run migrate
   ```

4. **Start the Development Server**:

   ```bash
   bun run dev
   ```

   The server initializes the JWKS keystore and listens on `http://localhost:8000`.

---

### Step 4: Configure and Run Frontend

1. In a separate terminal, navigate to the frontend directory:

   ```bash
   cd ../frontend
   ```

2. **Configure Frontend Environment**:
   Ensure `frontend/.env` points to the backend server:

   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Install Dependencies & Start Vite**:

   ```bash
   bun install
   bun run dev
   ```

   The frontend client will be available at `http://localhost:5173`.

---

## 📡 API & Endpoint Reference

### 1. OpenID Connect Discovery & JWKS

#### `GET /.well-known/openid-configuration`
Returns JSON metadata describing provider endpoints.

> [!NOTE]
> **Discovery Note**: The endpoint returns core endpoint paths on port 3000 (`/v1/auth`, `/v1/token`, `/v1/userinfo`), which differ from the actual Express routes on port 8000. Full specification arrays (such as `response_types_supported`, `subject_types_supported`, and `id_token_signing_alg_values_supported`) are planned for future alignment.

**Response (`200 OK`)**:
```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/v1/auth",
  "token_endpoint": "http://localhost:3000/v1/token",
  "userinfo_endpoint": "http://localhost:3000/v1/userinfo",
  "jwks_uri": "http://localhost:3000/v1/certs"
}
```

#### `GET /v1/certs`
Returns the public JSON Web Key Set (JWKS) converted from `public_key.pem` using `node-jose`.

**Response (`200 OK`)**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "...",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

---

### 2. Client Application Registration

#### `POST /client-register`
Registers a new Relying Party client application in `clientsTable`.

**Request Body**:
```json
{
  "clientName": "Demo Relying Party",
  "email": "developer@example.com",
  "password": "ClientPassword123!",
  "redirectUri": "http://localhost:5173/callback",
  "hostedUri": "http://localhost:5173"
}
```

**Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "message": "Client registered successfully",
  "data": {
    "clientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "clientSecret": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "hostedUri": "http://localhost:5173",
    "redirectUri": "http://localhost:5173/callback"
  }
}
```

#### `POST /client-login`
Authenticates a client developer and retrieves their registered client credentials.

**Request Body**:
```json
{
  "email": "developer@example.com",
  "password": "ClientPassword123!"
}
```

---

### 3. User Authentication & Authorization Flow

#### `POST /register`
Creates a new end-user identity in `usersTable`.

**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "UserSecurePassword123!",
  "dateOfBirth": "1995-10-20",
  "phoneNumber": "+1234567890"
}
```

**Response (`201 Created`)**:
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "id": "c4d3b2a1-1234-5678-9abc-def012345678"
  }
}
```

#### `POST /login/:clientId/`
Authenticates an end-user for the specified client application, generates an authorization code, and returns the redirect destination.

**Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "UserSecurePassword123!"
}
```

**Response (`200 OK`)**:
```json
{
  "redirectTo": "http://localhost:5173/callback?code=7a6b5c4d3e2f109876543210abcdef0123456789abcdef0123456789abcdef01"
}
```

> [!NOTE]
> The backend responds with HTTP 200 containing a `redirectTo` JSON property rather than issuing an HTTP 302 redirect directly. The frontend application reads this URL and performs the browser navigation.

---

### 4. Token Exchange & UserInfo

#### `POST /v1/token/:clientId/:clientSecret/:authCode`
Exchanges the single-use authorization code and client secret for signed JWT tokens.

> [!NOTE]
> **Token Endpoint Protocol Design**: In standard OAuth 2.0 (RFC 6749 §4.1.3), protocol parameters (`grant_type`, `code`, `redirect_uri`) are transmitted in an `application/x-www-form-urlencoded` HTTP POST body. Client authentication (`client_id`, `client_secret`) is a separate mechanism (RFC 6749 §2.3), typically handled via HTTP Basic Authentication headers (`Authorization: Basic ...`) or in the POST body for confidential clients. In OpenPravesh, both the client credentials and the authorization code are passed as URL path parameters as an educational simplification.

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/v1/token/3fa85f64-5717-4562-b3fc-2c963f66afa6/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855/7a6b5c4d3e2f109876543210abcdef0123456789abcdef0123456789abcdef01"
```

**HTTP Response (`200 OK`)**:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNGQzYjJhMS0xMjM0LTU2NzgtOWFiYy1kZWYwMTIzNDU2NzgiLCJ1c2VyRW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIiwiaWF0IjoxNzQwMDAwMDAwLCJleHAiOjE3NDAwODY0MDB9.sample_signature...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNGQzYjJhMS0xMjM0LTU2NzgtOWFiYy1kZWYwMTIzNDU2NzgiLCJ1c2VyRW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIiwiaWF0IjoxNzQwMDAwMDAwLCJleHAiOjE3NDA2MDQ4MDB9.sample_signature..."
}
```

> [!NOTE]
> **Response Format Note**: The controller delivers `{ accessToken, refreshToken }` in camelCase with HTTP status 200. Standard OAuth 2.0 (RFC 6749 §5.1) defines top-level snake_case fields (`access_token`, `token_type: "Bearer"`, `expires_in`, `refresh_token`). (Internally, the service layer wraps this in an `ApiResponse.created` envelope with `statusCode: 201` and message `"Tokens generated successfully"`, which the controller unwraps for the HTTP response).

#### `GET /userInfo`
Returns user identity claims. The endpoint extracts the Bearer token from the `Authorization` header, verifies the RS256 cryptographic signature and token expiration (`exp`), and returns the decoded payload claims.

> [!NOTE]
> **Validation Scope**: In the backend implementation, `jwt.verify` validates the RS256 signature and expiration timestamp (`exp`). It does not perform issuer (`iss`) or audience (`aud`) checks because those claims are not currently included in the token payload. Cryptographic verification of the signature and expiration is performed rather than simple token decoding.

**Request Header**:
```http
Authorization: Bearer <accessToken>
```

**Response (`200 OK`)**:
```json
{
  "userId": "c4d3b2a1-1234-5678-9abc-def012345678",
  "userEmail": "jane@example.com",
  "iat": 1740000000,
  "exp": 1740086400
}
```

---

## 🔑 Token Lifecycle & Claims

### Token Comparison

Understanding the distinction between token types in OAuth 2.0 and OpenID Connect is central to this project:

- **ID Token (OIDC)**: Identifies the authenticated end-user to the client application and describes the authentication event. Formatted as a signed JWT containing standard claims such as `iss` (issuer), `sub` (subject identifier), `aud` (audience), `iat`, and `exp`.
  *(Planned for future exploration).*
- **Access Token (OAuth 2.0)**: Authorizes a client application or bearer to access specific protected resources or endpoints (such as `/userInfo`).
  *(Implemented with 1-day expiration).*
- **Refresh Token (OAuth 2.0)**: A credential used to obtain a new access token when the current access token expires.
  *(Generated with 7-day expiration; refresh-token grant endpoint is planned for future work).*

### Actual Claims Structure

When decoded, the tokens issued by OpenPravesh contain the following payload:

```json
{
  "userId": "c4d3b2a1-1234-5678-9abc-def012345678",
  "userEmail": "jane@example.com",
  "iat": 1740000000,
  "exp": 1740086400
}
```

### Explaining the Standard OIDC `sub` Claim

In OpenID Connect, `sub` (subject identifier) identifies the authenticated end user within the issuer's identifier namespace. Under the OIDC specification:
- An OIDC UserInfo response must include `sub`.
- The `sub` claim value must match the `sub` claim in the corresponding ID Token.
- The identifier must be unique and stable across authentication sessions.

In the current OpenPravesh proof of concept:
- OpenPravesh currently uses custom claims (`userId` and `userEmail`) rather than the standardized `sub` claim.
- ID Token issuance and standardized `sub` claims are not implemented.
- Claim standardization (`sub`, `email`, `email_verified`) remains planned future work.

---

## 🔍 JWKS & Token Verification Guide

Because tokens are signed asymmetrically with RS256, consuming services and client applications can verify tokens mathematically using public keys retrieved from `/v1/certs` without querying the authorization server database.

### Understanding Verification Layers

A comprehensive token verification pipeline distinguishes between:
- **RS256 Signature Verification**: Verifying the cryptographic signature using the trusted public key obtained from JWKS (`/v1/certs`).
- **Expiration Validation (`exp`)**: Rejecting tokens whose lifetime has elapsed.
- **Issuer Validation (`iss`)**: Verifying that the token was signed by the expected authority (omitted in current PoC tokens).
- **Audience Validation (`aud`)**: Verifying that the token was minted specifically for the consuming client or resource server (omitted in current PoC tokens).

### Node.js Verification Example (using `jose`)

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

// 1. Retrieve the trusted public key set published by OpenPravesh
const JWKS = createRemoteJWKSet(new URL('http://localhost:8000/v1/certs'));

export async function verifyAccessToken(token: string) {
  try {
    // 2. Verify the RS256 signature using the trusted public key obtained from JWKS (/v1/certs)
    // and check token expiration (exp)
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
    });

    // 3. Extract custom claims present in OpenPravesh tokens
    const userId = payload.userId as string;
    const userEmail = payload.userEmail as string;

    console.log(`Token verified successfully for user: ${userEmail} (${userId})`);
    return { userId, userEmail };
  } catch (error) {
    console.error('RS256 token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}
```

> [!NOTE]
> **Validation Scope Note**: Standard token verification additionally validates the `issuer` (`iss`) and `audience` (`aud`). Because OpenPravesh tokens currently omit `iss` and `aud` from the payload, issuer and audience validation cannot currently be performed as intended. This example verifies the cryptographic RS256 signature against the trusted public JWKS key and checks the token expiration (`exp`) claim.

---

## 🖥️ Interactive Developer Portal & Simulator

The frontend includes dedicated views designed to help developers visualize and test the authorization flow:

1. **Protocol Simulator (`/`)**:
   - Interactive 5-step walkthrough of the OAuth grant flow.
   - Shows live parameter inspection (path, query, body, headers).
   - Generates working `curl` commands for each phase.
   - Displays real-time JSON payloads and decoded token structures.
2. **Developer Portal (`/developer`)**:
   - Manages client applications and credentials.
   - Displays `clientId`, masked `clientSecret`, and configured `redirectUri`.
   - Offers an in-browser sandbox mode to test client integration flows without manual database provisioning.
3. **Interactive Documentation (`/docs`)**:
   - Technical documentation of endpoints, payloads, and local setup steps.

---

## 🔒 Security Considerations & Learning Notes

This project provides practical lessons in identity system architecture, including several design trade-offs:

1. **URL Path Parameters vs. POST Bodies**:
   In standard OAuth 2.0 (RFC 6749 §4.1.3 & §2.3), protocol parameters are passed in an `application/x-www-form-urlencoded` POST body, and client credentials are authenticated separately (e.g., via HTTP Basic Authentication). Passing `:clientId`, `:clientSecret`, and `:authCode` as URL path parameters is an educational simplification convenient for cURL exploration, but in real deployments, URLs can appear in server access logs, reverse proxies, and telemetry traces.
2. **In-Memory Authorization Code Table**:
   The current store (`inMemoryTable`) holds authorization codes with a 60-second TTL in process memory. Codes are deleted when exchanged. In distributed architectures, an external cache like Redis with native TTL eviction is used to share state across multiple instances.
3. **Role of PKCE (RFC 7636)**:
   In production implementations with public clients (such as Single Page Apps or native mobile clients), Proof Key for Code Exchange (PKCE) prevents authorization code interception attacks. PKCE is planned as an architectural extension.
4. **Asymmetric Key Trust Model**:
   Tokens are signed by the authorization server using its private RSA key (`private_key.pem`). Relying parties, resource servers, and consumers verify signatures using the corresponding trusted public key obtained from JWKS (`/v1/certs`), ensuring private signing material never leaves the identity provider.

---

## 🗺️ Roadmap

Architectural enhancements planned for future exploration:

- [ ] **RFC 7636 PKCE Enforcement**: Implement `code_challenge` and `code_verifier` checking using SHA-256 (`S256`).
- [ ] **OIDC ID Token Issuance**: Generate signed ID tokens with standard claims (`iss`, `sub`, `aud`, `iat`, `exp`).
- [ ] **Claim Standardization**: Adopt standard claims (`sub`, `email`, `email_verified`) across tokens and the `/userInfo` response.
- [ ] **Standard Token Endpoint**: Support `POST /v1/token` with request bodies formatted as `application/x-www-form-urlencoded` and separate client authentication.
- [ ] **Refresh Token Renewal**: Add `grant_type=refresh_token` exchange handling and token rotation.
- [ ] **Discovery Metadata Synchronization**: Dynamically synchronize `GET /.well-known/openid-configuration` with active server configuration and port settings.
- [ ] **Distributed Code Storage**: Migrate ephemeral code storage from in-memory dictionary to Redis with automated TTL expiration.
- [ ] **Automated Key Rotation**: Support multi-key JWKS publishing with scheduled `kid` rotation.

---

<div align="center">
  <sub>OpenPravesh · Personal OIDC & OAuth Identity Provider Proof of Concept · Created by <a href="https://github.com/janardan-v">janardan-v</a></sub>
</div>
