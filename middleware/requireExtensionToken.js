/**
 * Require a valid backend-issued extension JWT.
 * Reads Authorization: Bearer <token>, verifies with EXTENSION_JWT_SECRET, sets req.user = { id }.
 */
const jwt = require('jsonwebtoken');

const EXTENSION_JWT_SECRET =
  process.env.EXTENSION_JWT_SECRET || 'replace-me-in-prod';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireExtensionToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) {
    return res.status(401).json({ error: 'missing_token' });
  }
  try {
    const payload = jwt.verify(token, EXTENSION_JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    console.error('[requireExtensionToken] JWT verification failed:', err.message);
    return res.status(401).json({ error: 'invalid_token' });
  }
}

module.exports = { requireExtensionToken };
