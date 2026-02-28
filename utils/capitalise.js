/**
 * Returns the string with the first letter of each word in uppercase.
 * @param {string} str
 * @returns {string}
 */
function capitalise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { capitalise };
