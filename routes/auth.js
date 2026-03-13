/**
 * OAuth login, callback, and logout routes.
 * Mount at app root (e.g. GET /login, /callback, /logout).
 */
const crypto = require('crypto');
const { createAuth0ProviderFromEnv } = require('../auth/authProvider');
const {
  createSession,
  destroySession,
  setState,
  consumeState,
} = require('../auth/session');
const { findOrCreateUser } = require('../services/user');

const BASE_URL = process.env.BASE_URL || 'https://llamasvc.onrender.com';
const LANDING_URL = process.env.LANDING_URL || 'https://mayulearn.com/app';
const LOGOUT_LANDING_URL = process.env.LOGOUT_LANDING_URL || 'https://mayulearn.com/';

let authProvider;
function getAuthProvider() {
  if (!authProvider) {
    authProvider = createAuth0ProviderFromEnv();
  }
  return authProvider;
}

/**
 * GET /login – start OAuth authorization code flow.
 */
function handleLogin(req, res) {
  const source =
    typeof req.query.source === 'string' ? req.query.source : undefined;
  const screenHint =
    typeof req.query.screen_hint === 'string' ? req.query.screen_hint : undefined;
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BASE_URL}/callback`;

  setState(state, { redirectUri, source });

  const provider = getAuthProvider();
  const authorizeUrl = provider.buildAuthorizeUrl({
    redirectUri,
    state,
    source,
    screenHint,
  });
  res.redirect(authorizeUrl);
}

/**
 * GET /callback – exchange code for tokens, create/find user, establish session.
 */
async function handleCallback(req, res) {
  const { code, state } = req.query;
  if (typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).send('Missing code or state');
  }
  const entry = consumeState(state);
  if (!entry) {
    return res.status(400).send('Invalid state');
  }

  try {
    const provider = getAuthProvider();
    const result = await provider.exchangeCode(code, entry.redirectUri);

    const user = await findOrCreateUser({
      authProvider: 'auth0',
      authProviderId: result.subject || '',
      email: result.email || '',
    });

    createSession(res, user.id, user.email);
    res.redirect(LANDING_URL);
  } catch (err) {
    console.error('[auth] callback error:', err);
    res.status(500).send('Authentication failed');
  }
}

/**
 * GET /logout – clear session and redirect.
 */
function handleLogout(req, res) {
  destroySession(req, res);
  res.redirect(LOGOUT_LANDING_URL);
}

module.exports = {
  handleLogin,
  handleCallback,
  handleLogout,
};
