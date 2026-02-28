/**
 * Query: q220_getDefinition
 * Read-only: returns definition/translation from LLM; does not change application state.
 */
const { translate: translateService, isAvailable } = require('../services/translation');

/**
 * @param {{
 *   sourceLanguage: string,
 *   targetLanguage: string,
 *   context?: string,
 *   term: string,
 *   promptMode?: number
 * }} params
 * @returns {Promise<{ translation: string }>}
 */
async function execute(params) {
  const translation = await translateService({
    sourceLanguage: params.sourceLanguage,
    targetLanguage: params.targetLanguage,
    context: params.context,
    term: params.term,
    promptMode: params.promptMode,
  });
  return { translation };
}

module.exports = { execute, isAvailable };
