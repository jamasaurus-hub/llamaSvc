/**
 * POST /api/learning-items/batch – command: c200_saveTerms
 */
const { execute: saveTermsCommand } = require('../commands/c200_saveTerms');

async function handleSaveTermsBatch(req, res) {
  const body = req.body || {};
  const auth0Id = typeof body.auth0Id === 'string' ? body.auth0Id.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const collectionId = typeof body.collectionId === 'string' ? body.collectionId.trim() : '';
  const learningItems = Array.isArray(body.learningItems) ? body.learningItems : [];

  console.log('[learning-items/batch] received', {
    hasAuth0Id: !!auth0Id,
    hasEmail: !!email,
    collectionId: collectionId || '(empty)',
    learningItemsCount: learningItems.length,
  });

  if (!auth0Id || !email) {
    console.log('[learning-items/batch] failed: auth0Id and email are required');
    return res.status(400).json({
      error: 'auth0Id and email are required',
    });
  }
  if (!collectionId) {
    console.log('[learning-items/batch] failed: collectionId is required');
    return res.status(400).json({
      error: 'collectionId is required',
    });
  }
  if (learningItems.length === 0) {
    console.log('[learning-items/batch] failed: learningItems array is required and must not be empty');
    return res.status(400).json({
      error: 'learningItems array is required and must not be empty',
    });
  }
  try {
    const created = await saveTermsCommand({
      auth0Id,
      email,
      collectionId,
      learningItems,
    });
    console.log('[learning-items/batch] saved to table', { count: created.length, ids: created.map((c) => c.id) });
    return res.status(201).json(created);
  } catch (err) {
    console.error('[learning-items/batch] failed to save terms to table', err.message, err);
    const status = err.status ?? 500;
    const message = err.message ?? 'Failed to save terms';
    return res.status(status).json({ error: message });
  }
}

module.exports = { handleSaveTermsBatch };
