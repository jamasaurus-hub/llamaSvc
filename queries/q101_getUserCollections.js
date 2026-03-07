/**
 * Query: q101_getUserCollections
 * Read-only: returns LLA collections for the current user.
 * Caller must pass userId (e.g. from req.user.id after auth middleware).
 */
const { prisma } = require('../services/db');

/**
 * @param {{ userId: string }} params
 * @returns {Promise<{ ok: boolean; collections?: Array<{ collectionId: string; collectionTitle: string }>; error?: string; errorCode?: string }>}
 */
async function execute({ userId }) {
  const userIdTrimmed = typeof userId === 'string' ? userId.trim() : '';

  if (!userIdTrimmed) {
    return {
      ok: false,
      error: 'userId is required',
      errorCode: 'NO_CONTEXT',
    };
  }

  const collections = await prisma.collection.findMany({
    where: { ownerUserId: userIdTrimmed },
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
