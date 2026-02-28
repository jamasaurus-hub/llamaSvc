/**
 * Query: q101_getUserCollections
 * Read-only: returns LLA collections for the current user (Morocco DB).
 * Used to populate the collection dropdown; requires auth0Id and email.
 */
const { prisma } = require('../services/db');

/**
 * @param {{ auth0Id: string, email: string }} params
 * @returns {Promise<{ ok: boolean; collections?: Array<{ collectionId: string; collectionTitle: string }>; error?: string; errorCode?: string }>}
 */
async function execute({ auth0Id, email }) {
  const auth0IdTrimmed = typeof auth0Id === 'string' ? auth0Id.trim() : '';
  const emailTrimmed = typeof email === 'string' ? email.trim() : '';

  if (!auth0IdTrimmed || !emailTrimmed) {
    return {
      ok: false,
      error: 'auth0Id and email are required',
      errorCode: 'NO_CONTEXT',
    };
  }

  const user = await prisma.user.findUnique({
    where: { auth0Id: auth0IdTrimmed },
    select: { id: true },
  });

  if (!user) {
    return {
      ok: false,
      error: 'User not found',
      errorCode: 'NO_USER',
    };
  }

  const collections = await prisma.collection.findMany({
    where: { ownerUserId: user.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return {
    ok: true,
    collections: collections.map((c) => ({
      collectionId: c.id,
      collectionTitle: c.name,
    })),
  };
}

module.exports = { execute };
