/**
 * Collection service: create collection (shared by c206 and c101).
 */
const { prisma } = require('./db');

/**
 * Create a collection. Used by c206_createMoroccoCollection and c101_saveLearningItemsToMorocco (when collection missing).
 * @param {{ ownerUserId: string, name: string, description: string, isSystemGenerated?: boolean, id?: string }}
 * @returns {Promise<import('@prisma/client').Collection>}
 */
async function createCollection({ ownerUserId, name, description, isSystemGenerated = false, id }) {
  return prisma.collection.create({
    data: {
      ...(id && { id }),
      ownerUserId,
      name,
      description,
      isSystemGenerated: Boolean(isSystemGenerated),
    },
  });
}

module.exports = {
  createCollection,
};
