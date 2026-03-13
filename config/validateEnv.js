/**
 * Validate required environment variables at startup.
 * Exits with code 1 and a clear message if any are missing (production-safe).
 * Backend-owned auth: BASE_URL, EXTENSION_JWT_SECRET, AUTH0_*.
 */
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'BASE_URL',
    'EXTENSION_JWT_SECRET',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
  ];

  const missing = required.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    console.error('[validateEnv] Missing required environment variables:', missing.join(', '));
    console.error('Set them in Render Environment or in .env for local development.');
    process.exit(1);
  }
}

module.exports = { validateEnv };
