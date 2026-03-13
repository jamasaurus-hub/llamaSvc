/**
 * Extension-facing auth API: status and token.
 * Mount under /api so paths are GET /api/auth/status, POST /api/auth/token.
 */
const jwt = require('jsonwebtoken');
const { getSession } = require('../auth/session');

const EXTENSION_JWT_SECRET =
  process.env.EXTENSION_JWT_SECRET || 'replace-me-in-prod';

/**
 * GET /api/auth/status – return signed-in state and email from session.
 */
function handleAuthStatus(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.json({ signedIn: false });
  }
  res.json({
    signedIn: true,
    email: session.email || null,
  });
}

/**
 * POST /api/auth/token – mint short-lived JWT for extension to call llamaSvc APIs.
 */
function handleAuthToken(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'not_authenticated' });
  }

  const token = jwt.sign(
    { sub: session.userId },
    EXTENSION_JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ accessToken: token, expiresIn: 900 });
}

module.exports = {
  handleAuthStatus,
  handleAuthToken,
};
