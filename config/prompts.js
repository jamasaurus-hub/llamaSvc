/**
 * LLM prompt templates. Use inject() to replace {paramName} placeholders.
 */

const TRANSLATION = {
  system: `Translate the given term strictly between {sourceLanguage} and {targetLanguage} using the context if available.

If the term is written in {sourceLanguage}, translate it into {targetLanguage}.
If the term is written in {targetLanguage}, translate it into {sourceLanguage}.

Determine which of the two languages the term is written in based on the term and context.
Only translate between these two languages. Do not leave the term unchanged unless it is identical in both languages.

{languageSpecificInstructions}

Output only the translated term. Do not add explanation, punctuation, or extra text. {modeInstructions}`,

  userWithContext: `Context: {context}
Term to translate: {term}`,

  userWithoutContext: `Term to translate: {term}`,
};

const PROMPT_MODE_INSTRUCTIONS = {
  0: 'Reply with only the translated term.',
  1: 'Output only the translated term, nothing else. No explanation or punctuation.',
  2: 'Use a formal register in the translation.',
  3: 'Use an informal register in the translation.',
};

const DEFAULT_MODE_INSTRUCTIONS = PROMPT_MODE_INSTRUCTIONS[0];

const LANGUAGE_SPECIFIC_INSTRUCTIONS = {
  'Chinese (Simplified)':
    'If the word to translate is not Chinese, it should be translated into Chinese (simplified or traditional) and include the pinyin after the translated Chinese term.',
  'Chinese (Traditional)':
    'If the word to translate is not Chinese, it should be translated into Chinese (simplified or traditional) and include the pinyin after the translated Chinese term.',
};

/**
 * Replaces {key} placeholders in template with values from params.
 * @param {string} template - String containing {paramName} placeholders
 * @param {Record<string, string|number>} params - Key-value pairs to inject
 * @returns {string}
 */
function inject(template, params) {
  if (typeof template !== 'string') return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{${key}}`;
  });
}

/**
 * Returns the mode instruction string for the given promptMode (0–3).
 * @param {number} promptMode
 * @returns {string}
 */
function getModeInstructions(promptMode) {
  const mode = Number(promptMode);
  return Number.isInteger(mode) && PROMPT_MODE_INSTRUCTIONS[mode] != null
    ? PROMPT_MODE_INSTRUCTIONS[mode]
    : DEFAULT_MODE_INSTRUCTIONS;
}

/**
 * Returns language-specific instructions based on source/target languages.
 * Prefers target language instructions when available.
 * @param {string} sourceLanguage
 * @param {string} targetLanguage
 * @returns {string}
 */
function getLanguageSpecificInstructions(sourceLanguage, targetLanguage) {
  const byLanguage = LANGUAGE_SPECIFIC_INSTRUCTIONS;
  const candidates = [targetLanguage, sourceLanguage];
  for (const lang of candidates) {
    if (typeof lang === 'string' && byLanguage[lang]) {
      return byLanguage[lang];
    }
  }
  return '';
}

module.exports = {
  TRANSLATION,
  PROMPT_MODE_INSTRUCTIONS,
  inject,
  getModeInstructions,
  getLanguageSpecificInstructions,
};
