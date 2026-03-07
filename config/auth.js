/**
 * Auth configuration (provider-agnostic).
 * Set via env: AUTH_ISSUER, AUTH_AUDIENCE, AUTH_JWKS_URI, AUTH_PROVIDER_NAME.
 * When switching providers (e.g. Auth0 → Cognito), change these only; DB schema stays the same.
 */
module.exports = {
  issuer: process.env.AUTH_ISSUER || '',
  audience: process.env.AUTH_AUDIENCE || '',
  jwksUri: process.env.AUTH_JWKS_URI || '',
  providerName: process.env.AUTH_PROVIDER_NAME || 'auth0',
};
