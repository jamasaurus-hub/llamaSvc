/**
 * Require a valid JWT and resolve user (JIT provisioning).
 * Expects Authorization: Bearer <access_token>. Sets req.user = { id, email, authProvider, authProviderId, plan? }.
 */
const authConfig = require('../config/auth');
const { verifyAccessToken } = require('../services/auth');
const { findOrCreateUser } = require('../services/user');

function getBearerToken(req) {
  const header = req.headers && req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Access token expired or missing.',
    });
  }

  try {
    const { sub, email } = await verifyAccessToken(token);
    const authProvider = authConfig.providerName;
    const authProviderId = sub;

    const user = await findOrCreateUser({
      authProvider,
      authProviderId,
      email: email || '',
    });

    req.user = {
      id: user.id,
      email: user.email,
      authProvider: user.authProvider,
      authProviderId: user.authProviderId,
      plan: user.plan ?? undefined,
    };
    next();
  } catch (err) {
    console.error('[requireAuth] token verification failed', err.name, err.message);
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Access token expired or missing.',
    });
  }
}

module.exports = { requireAuth };
