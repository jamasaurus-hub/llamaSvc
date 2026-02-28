/**
 * Learning items service: normalise term/definition, find-or-create user.
 * Used by c200_saveTerms (batch create); CanonicalEntry upsert is in the command.
 */
const { prisma } = require('./db');

/**
 * Normalise term or definition for canonical lookup (trim, lower-case, collapse whitespace).
 * @param {string} value
 * @returns {string}
 */
function normalise(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Find or create a user by Auth0 id and email.
 * @param {{ auth0Id: string, email: string }}
 * @returns {Promise<{ id: string }>}
 */
async function findOrCreateUser({ auth0Id, email }) {
  const user = await prisma.user.upsert({
    where: { auth0Id },
    create: { auth0Id, email },
    update: { email, lastActiveAt: new Date() },
  });
  return user;
}

module.exports = {
  normalise,
  findOrCreateUser,
};
