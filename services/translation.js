/**
 * Translation service: builds prompts from config and calls the LLM.
 */
const { client, isAvailable } = require('./openai');
const {
  TRANSLATION,
  inject,
  getModeInstructions,
  getLanguageSpecificInstructions,
} = require('../config/prompts');

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_TOKENS = 150;

/**
 * Builds system and user messages for translation using configured prompts.
 * @param {{ sourceLanguage: string, targetLanguage: string, context?: string, term: string, promptMode?: number }} params
 * @returns {{ system: string, user: string }}
 */
function buildMessages(params) {
  const { sourceLanguage, targetLanguage, context, term, promptMode = 0 } = params;
  const modeInstructions = getModeInstructions(promptMode);
  const hasContext = typeof context === 'string' && context.trim().length > 0;
  const languageSpecificInstructions = getLanguageSpecificInstructions(sourceLanguage, targetLanguage);

  const systemContent = inject(TRANSLATION.system, {
    sourceLanguage,
    targetLanguage,
    modeInstructions,
    languageSpecificInstructions,
  });
  const userTemplate = hasContext ? TRANSLATION.userWithContext : TRANSLATION.userWithoutContext;
  const userContent = inject(userTemplate, {
    sourceLanguage,
    targetLanguage,
    context: context || '',
    term,
  });

  return { system: systemContent, user: userContent };
}

/**
 * Calls the LLM and returns the trimmed translation text.
 * @param {{ sourceLanguage: string, targetLanguage: string, context?: string, term: string, promptMode?: number }} params
 * @param {{ model?: string, max_tokens?: number }} options
 * @returns {Promise<string>}
 * @throws {Error} When client is unavailable or API call fails
 */
async function translate(params, options = {}) {
  if (!isAvailable()) {
    throw new Error('Translation service unavailable: missing OPENAI_API_KEY or AI_API_KEY');
  }

  const { system, user } = buildMessages(params);
  const model = options.model ?? DEFAULT_MODEL;
  const max_tokens = options.max_tokens ?? DEFAULT_MAX_TOKENS;

  console.log('[LLM] system prompt:', system);
  console.log('[LLM] user query:', user);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens,
  });

  const raw = completion.choices?.[0]?.message?.content;
  const translation = typeof raw === 'string' ? raw.trim() : '';
  if (!translation) {
    throw new Error('Empty translation from provider');
  }
  return translation;
}

module.exports = {
  buildMessages,
  translate,
  isAvailable,
};
