/**
 * Learning items service: normalise term/definition for canonical lookup.
 * Used by c101_saveLearningItemsToMorocco (batch create); CanonicalEntry upsert is in the command.
 */
/**
 * Normalise term or definition for canonical lookup (trim, lower-case, collapse whitespace).
 * @param {string} value
 * @returns {string}
 */
function normalise(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

module.exports = {
  normalise,
};
