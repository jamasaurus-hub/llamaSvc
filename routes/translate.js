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
    const payload = { error: 'Translation service unavailable: missing OPENAI_API_KEY or AI_API_KEY' };
    console.log('[translate] 503 → FE:', payload);
    return res.status(503).json(payload);
  }

  const { source, target, ctx, t, mode } = normalizeBody(req.body);

  if (!source || !target || !t) {
    const payload = { error: 'Missing or empty required fields: sourceLanguage, targetLanguage, term' };
    console.log('[translate] 400 → FE:', payload);
    return res.status(400).json(payload);
  }
  if (ctx.length > appConfig.maxContextLength) {
    const payload = { error: `context must be at most ${appConfig.maxContextLength} characters` };
    console.log('[translate] 400 → FE:', payload);
    return res.status(400).json(payload);
  }
  if (t.length > appConfig.maxTermLength) {
    const payload = { error: `term must be at most ${appConfig.maxTermLength} characters` };
    console.log('[translate] 400 → FE:', payload);
    return res.status(400).json(payload);
  }

  try {
    const result = await getDefinitionQuery({
      sourceLanguage: source,
      targetLanguage: target,
      context: ctx,
      term: t,
      promptMode: mode,
    });
    const translation = result?.translation;
    if (translation == null || translation === '') {
      const payload = { error: 'Empty or missing translation from provider' };
      console.log('[translate] 502 (empty result) → FE:', payload);
      return res.status(502).json(payload);
    }
    const payload = { translation, definition: translation };
    console.log('[translate] 200 → FE: translation length =', translation.length);
    return res.json(payload);
  } catch (err) {
    const status = err.status === 401 ? 401 : err.status === 429 ? 429 : 502;
    const message = err.message || 'Translation request failed';
    const payload = { error: message };
    console.log('[translate]', status, '→ FE:', payload);
    return res.status(status).json(payload);
  }
}

module.exports = { handleTranslate };
