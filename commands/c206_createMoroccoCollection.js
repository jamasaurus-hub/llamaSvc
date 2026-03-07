/**
 * Command: c206_createMoroccoCollection
 * State-changing: creates a Collection for the given owner.
 */
const { createCollection } = require('../services/collection');

/**
 * @param {{
 *   ownerUserId: string,
 *   name: string,
 *   description: string,
 *   isSystemGenerated?: boolean
 * }} params
 * @returns {Promise<import('@prisma/client').Collection>}
 */
async function execute({ ownerUserId, name, description, isSystemGenerated = false }) {
  const ownerUserIdTrimmed = typeof ownerUserId === 'string' ? ownerUserId.trim() : '';
  const nameTrimmed = typeof name === 'string' ? name.trim() : '';
  const descriptionTrimmed = typeof description === 'string' ? description.trim() : '';

  if (!ownerUserIdTrimmed) {
    const err = new Error('ownerUserId is required');
    err.status = 400;
    throw err;
  }
  if (!nameTrimmed) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }
  if (!descriptionTrimmed) {
    const err = new Error('description is required');
    err.status = 400;
    throw err;
  }

  return createCollection({
    ownerUserId: ownerUserIdTrimmed,
    name: nameTrimmed,
    description: descriptionTrimmed,
    isSystemGenerated,
  });
}

module.exports = { execute };
