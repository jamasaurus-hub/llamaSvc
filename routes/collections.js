/**
 * GET /api/collections
 * POST /api/collections
 * Requires auth (Bearer token). Returns LLA collections for the current user (req.user.id).
 */
const { execute: getUserCollectionsQuery } = require('../queries/q101_getUserCollections');

async function handleGetUserCollections(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized',
      errorCode: 'NO_CONTEXT',
    });
  }

  try {
    const result = await getUserCollectionsQuery({ userId });
    if (!result.ok) {
      return res.status(400).json(result);
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
