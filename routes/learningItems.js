/**
 * POST /api/learning-items/batch – command: c101_saveLearningItemsToMorocco
 * Requires auth (Bearer token). Body: { collectionId, collectionName?, collectionDescription?, learningItems }.
 */
const { execute: saveLearningItemsToMoroccoCommand } = require('../commands/c101_saveLearningItemsToMorocco');

async function handleSaveTermsBatch(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const collectionId = typeof body.collectionId === 'string' ? body.collectionId.trim() : '';
  const collectionName = typeof body.collectionName === 'string' ? body.collectionName : undefined;
  const collectionDescription = typeof body.collectionDescription === 'string' ? body.collectionDescription : undefined;
  const learningItems = Array.isArray(body.learningItems) ? body.learningItems : [];

  console.log('[learning-items/batch] received', {
    userId,
    collectionId: collectionId || '(empty)',
    learningItemsCount: learningItems.length,
  });

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
    const { created, savedCount, ignoredCount } = await saveLearningItemsToMoroccoCommand({
      userId,
      collectionId,
      collectionName,
      collectionDescription,
      learningItems,
    });
    let message;
    if (savedCount === 0 && ignoredCount > 0) {
      message = `No terms were saved, ignored ${ignoredCount} duplicate${ignoredCount === 1 ? '' : 's'}.`;
    } else if (savedCount > 0 && ignoredCount === 0) {
      message = `Saved ${savedCount} term${savedCount === 1 ? '' : 's'}.`;
    } else if (savedCount > 0 && ignoredCount > 0) {
      message = `Saved ${savedCount} term${savedCount === 1 ? '' : 's'}, ignored ${ignoredCount} duplicate${ignoredCount === 1 ? '' : 's'}.`;
    } else {
      message = 'No terms were saved.';
    }
    console.log('[learning-items/batch] saved to table', { count: created.length, ids: created.map((c) => c.id) });
    return res.status(201).json({ message, items: created });
  } catch (err) {
    console.error('[learning-items/batch] failed to save terms to table', err.message, err);
    const status = err.status ?? 500;
    const errorDetail = err.message ?? 'Failed to save terms';
    return res.status(status).json({
      message: 'No terms were saved due to an error.',
      error: errorDetail,
      items: [],
    });
  }
}

module.exports = { handleSaveTermsBatch };
