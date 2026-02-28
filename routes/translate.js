/**
 * POST /api/translate – query: q220_getDefinition
 */
const { execute: getDefinitionQuery, isAvailable } = require('../queries/q220_getDefinition');
const appConfig = require('../config/app');

function normalizeBody(body = {}) {
  const source = typeof body.sourceLanguage === 'string' ? body.sourceLanguage.trim() : '';
  const target = typeof body.targetLanguage === 'string' ? body.targetLanguage.trim() : '';
  const ctx = typeof body.context === 'string' ? body.context.trim() : '';
  const t = typeof body.term === 'string' ? body.term.trim() : '';
  const rawMode = body.promptMode != null ? Number(body.promptMode) : 0;
  const mode = Number.isInteger(rawMode) ? rawMode : 0;
  return { source, target, ctx, t, mode };
}

async function handleTranslate(req, res) {
  if (!isAvailable()) {
    return res.status(503).json({
      error: 'Translation service unavailable: missing OPENAI_API_KEY or AI_API_KEY',
    });
  }

  const { source, target, ctx, t, mode } = normalizeBody(req.body);

  if (!source || !target || !t) {
    return res.status(400).json({
      error: 'Missing or empty required fields: sourceLanguage, targetLanguage, term',
    });
  }
  if (ctx.length > appConfig.maxContextLength) {
    return res.status(400).json({
      error: `context must be at most ${appConfig.maxContextLength} characters`,
    });
  }
  if (t.length > appConfig.maxTermLength) {
    return res.status(400).json({
      error: `term must be at most ${appConfig.maxTermLength} characters`,
    });
  }

  try {
    const result = await getDefinitionQuery({
      sourceLanguage: source,
      targetLanguage: target,
      context: ctx,
      term: t,
      promptMode: mode,
    });
    return res.json(result);
  } catch (err) {
    const status = err.status === 401 ? 401 : err.status === 429 ? 429 : 502;
    const message = err.message || 'Translation request failed';
    return res.status(status).json({ error: message });
  }
}

module.exports = { handleTranslate };
