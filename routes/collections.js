/**
 * GET /api/collections?auth0Id=...&email=...
 * POST /api/collections – body: { auth0Id, email }
 * Query: q101_getUserCollections – returns LLA collections for the current user.
 */
const { execute: getUserCollectionsQuery } = require('../queries/q101_getUserCollections');

function parseParams(req) {
  const isGet = req.method === 'GET';
  const source = isGet ? req.query : req.body || {};
  const auth0Id = typeof source.auth0Id === 'string' ? source.auth0Id.trim() : '';
  const email = typeof source.email === 'string' ? source.email.trim() : '';
  return { auth0Id, email };
}

async function handleGetUserCollections(req, res) {
  const { auth0Id, email } = parseParams(req);

  if (!auth0Id || !email) {
    return res.status(400).json({
      ok: false,
      error: 'Missing or empty required fields: auth0Id, email',
      errorCode: 'NO_CONTEXT',
    });
  }

  try {
    const result = await getUserCollectionsQuery({ auth0Id, email });
    if (!result.ok) {
      const status = result.errorCode === 'NO_USER' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    const message = err.message ?? 'Failed to get collections';
    return res.status(500).json({
      ok: false,
      error: message,
    });
  }
}

module.exports = { handleGetUserCollections };
