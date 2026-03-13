/**
 * Auth provider abstraction and Auth0 implementation for the Mayu backend.
 * Provider-agnostic: backend owns auth; IdP can be swapped via different AuthProvider implementations.
 */

/**
 * @typedef {Object} AuthProviderExchangeResult
 * @property {string} subject - Stable provider user id (e.g. Auth0 sub).
 * @property {string | undefined} email
 * @property {{ accessToken: string; idToken?: string; refreshToken?: string; expiresIn?: number }} rawTokens
 */

/**
 * @typedef {Object} AuthProviderContext
 * @property {string} redirectUri
 * @property {string} state
 * @property {string | undefined} source
 * @property {string | undefined} screenHint
 */

/**
 * Conceptual AuthProvider interface.
 */
class AuthProvider {
  /**
   * @param {AuthProviderContext} _context
   * @returns {string}
   */
  buildAuthorizeUrl(_context) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} _code
   * @param {string} _redirectUri
   * @returns {Promise<AuthProviderExchangeResult>}
   */
  async exchangeCode(_code, _redirectUri) {
    throw new Error('Not implemented');
  }
}

/**
 * Auth0-based implementation of AuthProvider.
 */
class Auth0AuthProvider extends AuthProvider {
  /**
   * @param {object} opts
   * @param {string} opts.issuerBaseURL - e.g. "https://dev-xxxx.us.auth0.com"
   * @param {string} opts.clientID
   * @param {string} opts.clientSecret
   * @param {string | undefined} opts.audience
   * @param {string} [opts.scope]
   */
  constructor({
    issuerBaseURL,
    clientID,
    clientSecret,
    audience,
    scope = 'openid profile email',
  }) {
    super();
    this.issuerBaseURL = issuerBaseURL.replace(/\/+$/, '');
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.audience = audience;
    this.scope = scope;
  }

  /**
   * @param {AuthProviderContext} context
   * @returns {string}
   */
  buildAuthorizeUrl(context) {
    const url = new URL('/authorize', this.issuerBaseURL);
    url.searchParams.set('client_id', this.clientID);
    url.searchParams.set('redirect_uri', context.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.scope);
    url.searchParams.set('state', context.state);
    if (this.audience) {
      url.searchParams.set('audience', this.audience);
    }
    if (context.source) {
      url.searchParams.set('source', context.source);
    }
    if (context.screenHint === 'signup') {
      url.searchParams.set('screen_hint', 'signup');
    }
    return url.toString();
  }

  /**
   * @param {string} code
   * @param {string} redirectUri
   * @returns {Promise<AuthProviderExchangeResult>}
   */
  async exchangeCode(code, redirectUri) {
    const tokenUrl = new URL('/oauth/token', this.issuerBaseURL);
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientID,
      client_secret: this.clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      const snippet =
        typeof data === 'string'
          ? data.slice(0, 200)
          : JSON.stringify(data).slice(0, 200);
      throw new Error(`Auth0 token exchange failed (${res.status}): ${snippet}`);
    }

    const accessToken = data.access_token;
    const idToken = data.id_token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in;

    let subject = '';
    let email;
    if (typeof idToken === 'string') {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded =
          payload + '=='.slice(0, (4 - (payload.length % 4)) % 4);
        try {
          const decoded = JSON.parse(
            Buffer.from(padded, 'base64').toString('utf8')
          );
          subject = typeof decoded.sub === 'string' ? decoded.sub : '';
          if (typeof decoded.email === 'string') {
            email = decoded.email;
          }
        } catch {
          // ignore decode errors; subject/email will remain unset
        }
      }
    }

    if (!accessToken) {
      throw new Error('Auth0 token response missing access_token');
    }

    return {
      subject,
      email,
      rawTokens: {
        accessToken,
        idToken,
        refreshToken,
        expiresIn,
      },
    };
  }
}

/**
 * Factory to create Auth0AuthProvider from environment variables.
 * @returns {Auth0AuthProvider}
 */
function createAuth0ProviderFromEnv() {
  const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
  const clientID = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const audience = process.env.AUTH0_AUDIENCE;
  if (!issuerBaseURL || !clientID || !clientSecret) {
    throw new Error(
      'Missing required AUTH0_* environment variables (AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET)'
    );
  }
  return new Auth0AuthProvider({
    issuerBaseURL,
    clientID,
    clientSecret,
    audience,
  });
}

module.exports = {
  AuthProvider,
  Auth0AuthProvider,
  createAuth0ProviderFromEnv,
};
