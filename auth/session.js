/**
 * Session and state store for backend-owned auth.
 * In-memory Maps; for production multi-instance use a durable store (e.g. Redis).
 */
const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'mayu_session_id';

/** @type {Map<string, { userId: string, email: string }>} */
const sessions = new Map();

/** @type {Map<string, { redirectUri: string, source?: string }>} */
const stateStore = new Map();

/**
 * Create a session and set the cookie on the response.
 * @param {import('express').Response} res
 * @param {string} userId - Internal user id (from findOrCreateUser).
 * @param {string} email
 */
function createSession(res, userId, email) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId, email: email || '' });
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Destroy the session and clear the cookie.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function destroySession(req, res) {
  const sessionId = req.cookies && req.cookies[SESSION_COOKIE_NAME];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Get the current session from the request cookie.
 * @param {import('express').Request} req
 * @returns {{ userId: string, email: string } | null}
 */
function getSession(req) {
  const sessionId = req.cookies && req.cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

/**
 * Store OAuth state for callback validation.
 * @param {string} state
 * @param {{ redirectUri: string, source?: string }} entry
 */
function setState(state, entry) {
  stateStore.set(state, entry);
}

/**
 * Consume state (get and delete).
 * @param {string} state
 * @returns {{ redirectUri: string, source?: string } | undefined}
 */
function consumeState(state) {
  const entry = stateStore.get(state);
  if (entry) stateStore.delete(state);
  return entry;
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSession,
  destroySession,
  getSession,
  setState,
  consumeState,
};
