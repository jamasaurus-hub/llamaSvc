/**
 * Provider-agnostic JWT verification.
 * Verifies access token using JWKS (issuer, audience, signature). No Auth0 SDK dependency.
 */
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const authConfig = require('../config/auth');

let jwksClientInstance = null;

function getJwksClient() {
  if (!authConfig.jwksUri) {
    throw new Error('AUTH_JWKS_URI is not configured');
  }
  if (!jwksClientInstance) {
    jwksClientInstance = jwksClient({
      jwksUri: authConfig.jwksUri,
      cache: true,
      cacheMaxAge: 600000, // 10 min
      rateLimit: true,
    });
  }
  return jwksClientInstance;
}

function getSigningKey(header, callback) {
  const client = getJwksClient();
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Verify access token and return payload claims.
 * @param {string} token - JWT access token (raw string, without "Bearer " prefix)
 * @returns {Promise<{ sub: string, email: string }>}
 * @throws {Error} when token is invalid or verification fails
 */
function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    if (!authConfig.issuer || !authConfig.audience) {
      reject(new Error('Auth config missing: AUTH_ISSUER and AUTH_AUDIENCE required'));
      return;
    }
    jwt.verify(
      token,
      (header, cb) => getSigningKey(header, cb),
      {
        algorithms: ['RS256'],
        issuer: authConfig.issuer,
        audience: authConfig.audience,
        ignoreExpiration: false,
      },
      (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }
        // sub = provider user ID; email from standard claim, preferred_username, or custom namespaced claim
        const sub = decoded.sub;
        const audienceEmailKey = authConfig.audience
          ? (authConfig.audience.endsWith('/') ? `${authConfig.audience}email` : `${authConfig.audience}/email`)
          : '';
        const email =
          decoded.email ||
          decoded.preferred_username ||
          (audienceEmailKey && decoded[audienceEmailKey]) ||
          (decoded[`${authConfig.issuer.replace(/\/$/, '')}email`] ?? '') ||
          '';
        if (!sub) {
          reject(new Error('Token missing sub claim'));
          return;
        }
        resolve({ sub, email });
      }
    );
  });
}

module.exports = {
  verifyAccessToken,
};
