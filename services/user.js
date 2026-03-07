/**
 * User service: find-or-create by provider identity (JIT provisioning).
 */
const { prisma } = require('./db');

/**
 * Find or create a user by provider identity (provider-agnostic).
 * @param {{ authProvider: string, authProviderId: string, email: string }}
 * @returns {Promise<{ id: string, email: string, plan?: string }>}
 */
async function findOrCreateUser({ authProvider, authProviderId, email }) {
  const user = await prisma.user.upsert({
    where: {
      authProvider_authProviderId: { authProvider, authProviderId },
    },
    create: { authProvider, authProviderId, email },
    update: { email, lastActiveAt: new Date() },
  });
  return user;
}

module.exports = {
  findOrCreateUser,
};
