/**
 * LLM prompt templates. Use inject() to replace {paramName} placeholders.
 */

const TRANSLATION = {
  system: `Translate the given term strictly between {sourceLanguage} and {targetLanguage} using the context if available.

If the term is written in {sourceLanguage}, translate it into {targetLanguage}.
If the term is written in {targetLanguage}, translate it into {sourceLanguage}.

Determine which of the two languages the term is written in based on the term and context.
Only translate between these two languages. Do not leave the term unchanged unless it is identical in both languages.

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

module.exports = {
  TRANSLATION,
  PROMPT_MODE_INSTRUCTIONS,
  inject,
  getModeInstructions,
};
