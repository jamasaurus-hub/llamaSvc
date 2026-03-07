# Auth: Chrome Extension and React Web App

The backend uses **provider-agnostic** JWT verification. You can use Auth0, AWS Cognito, or any OIDC provider. The backend only needs the provider’s JWKS URI, issuer, and audience; it does not depend on any provider SDK.

Clients must send a valid **access token** (JWT) on every request to protected endpoints.

**Auth0 users:** The backend expects the access token to include the user's `email` claim for JIT provisioning. Auth0 does not add this by default. See [auth0-email-in-access-token.md](auth0-email-in-access-token.md) for the one-time Auth0 configuration.

---

## Protected endpoints

These routes require `Authorization: Bearer <access_token>`:

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/collections` | List collections for the current user |
| POST   | `/api/collections` | (Future) Create collection |
| POST   | `/api/learning-items/batch` | Save learning items to a collection |

**Public** (no auth):

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/translate` | Translation (no auth for MVP) |

---

## Sending the token

Every request to a protected endpoint must include:

```http
Authorization: Bearer <your_access_token>
```

If the token is missing or invalid, the API returns `401` with a JSON body like:

```json
{
  "error": "Invalid or missing token",
  "message": "Authorization header must be: Bearer <access_token>"
}
```

---

## Chrome extension (MVP)

1. **Use Authorization Code Flow with PKCE** with your identity provider (e.g. Auth0). Do not use Implicit Flow.
2. Use the provider’s **SPA / client SDK** in the extension context (e.g. Auth0 SPA JS SDK) to:
   - Open the provider’s login page (Universal Login or hosted UI).
   - After redirect, exchange the code for tokens and get an **access token** (JWT).
3. Store the access token securely (e.g. extension storage). Optionally store a refresh token if the provider supports it.
4. On each API call to this backend, set the header:
   - `Authorization: Bearer <access_token>`
5. When the token expires, use the refresh token (if available) or prompt the user to log in again.

The backend will:

- Verify the JWT (signature, issuer, audience, expiration).
- Resolve the user by `(auth_provider, auth_provider_id)` from the token’s `sub` claim.
- Create the user in the database on first login (Just-In-Time provisioning).
- Attach the user to the request so protected routes see `req.user`.

No `auth0Id` or `email` in query or body: identity comes only from the token.

---

## React web app (future)

1. Use the provider’s **React SDK** (e.g. Auth0 React SDK, or Cognito’s) for login and token acquisition.
2. After login, get the **access token** from the SDK (e.g. `getAccessTokenSilently()` or equivalent).
3. Send it on every request to this backend:
   - `Authorization: Bearer <access_token>`
4. Same backend, same database. The same user (same `auth_provider` + `auth_provider_id`) can use both the extension and the web app; no duplicate user rows.

---

## Backend configuration (env)

The backend reads these environment variables (see `.env.example` or `config/auth.js`):

| Variable | Description | Example (Auth0) |
|----------|-------------|-----------------|
| `AUTH_ISSUER` | Token issuer URL (trailing slash as required by provider) | `https://your-tenant.auth0.com/` |
| `AUTH_AUDIENCE` | API identifier (audience claim in the token) | Your Auth0 API identifier |
| `AUTH_JWKS_URI` | JWKS endpoint for signature verification | `https://your-tenant.auth0.com/.well-known/jwks.json` |
| `AUTH_PROVIDER_NAME` | Name stored in DB as `auth_provider` | `auth0` |

To switch providers later, change these four variables and point clients to the new provider; the database schema and backend code stay the same.
