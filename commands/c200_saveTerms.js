/**
 * Command: c200_saveTerms
 * State-changing: inserts an array of learning items into the LearningItem table.
 * Resolves user from auth0Id+email (find-or-create), finds/creates CanonicalEntry per term/definition, then creates LearningItem.
 */
const { prisma } = require('../services/db');
const { normalise, findOrCreateUser } = require('../services/learningItems');

const DEFAULT_LANGUAGE = 'en';

/**
 * @param {{
 *   auth0Id: string,
 *   email: string,
 *   collectionId: string,
 *   learningItems: Array<{
 *     termText: string,
 *     definitionText: string,
 *     sourceContext?: string | null,
 *     sourceUrl?: string | null,
 *     language?: string
 *   }>
 * }} command
 * @returns {Promise<import('@prisma/client').LearningItem[]>}
 */
async function execute({ auth0Id, email, collectionId, learningItems }) {
  const auth0IdTrimmed = typeof auth0Id === 'string' ? auth0Id.trim() : '';
  const emailTrimmed = typeof email === 'string' ? email.trim() : '';
  const collectionIdTrimmed = typeof collectionId === 'string' ? collectionId.trim() : '';
  const items = Array.isArray(learningItems) ? learningItems : [];

  if (!auth0IdTrimmed || !emailTrimmed) {
    const err = new Error('auth0Id and email are required');
    err.status = 400;
    throw err;
  }
  if (!collectionIdTrimmed) {
    const err = new Error('collectionId is required');
    err.status = 400;
    throw err;
  }
  if (items.length === 0) {
    return [];
  }

  const user = await findOrCreateUser({ auth0Id: auth0IdTrimmed, email: emailTrimmed });
  const ownerUserId = user.id;
  console.log('[c200_saveTerms] user resolved', { ownerUserId, collectionId: collectionIdTrimmed, itemCount: items.length });

  const normalized = items.map((item) => {
    const termText = typeof item.termText === 'string' ? item.termText.trim() : '';
    const definitionText = typeof item.definitionText === 'string' ? item.definitionText.trim() : '';
    const sourceContext = item.sourceContext != null && typeof item.sourceContext === 'string' ? item.sourceContext.trim() || null : null;
    const sourceUrl = item.sourceUrl != null && typeof item.sourceUrl === 'string' ? item.sourceUrl.trim() || null : null;
    const language = typeof item.language === 'string' && item.language.trim() ? item.language.trim() : DEFAULT_LANGUAGE;
    return { termText, definitionText, sourceContext, sourceUrl, language };
  });

  const missing = normalized.find((n) => !n.termText || !n.definitionText);
  if (missing) {
    console.log('[c200_saveTerms] validation failed: item missing termText or definitionText', missing);
    const err = new Error('Each learning item must have termText and definitionText');
    err.status = 400;
    throw err;
  }

  const created = await Promise.all(
    normalized.map(async (item) => {
      const normalisedTerm = normalise(item.termText);
      const normalisedDefinition = normalise(item.definitionText);
      if (!normalisedTerm || !normalisedDefinition) {
        const err = new Error('termText and definitionText are required and must not be empty after normalisation');
        err.status = 400;
        throw err;
      }

      const canonicalEntry = await prisma.canonicalEntry.upsert({
        where: {
          normalisedTerm_normalisedDefinition_language: {
            normalisedTerm,
            normalisedDefinition,
            language: item.language,
          },
        },
        create: {
          normalisedTerm,
          normalisedDefinition,
          language: item.language,
        },
        update: {},
      });

      return prisma.learningItem.create({
        data: {
          ownerUserId,
          collectionId: collectionIdTrimmed,
          termText: item.termText,
          definitionText: item.definitionText,
          sourceContext: item.sourceContext,
          sourceUrl: item.sourceUrl,
          canonicalEntryId: canonicalEntry.id,
        },
      });
    })
  );

  console.log('[c200_saveTerms] created in DB', created.length, created.map((c) => ({ id: c.id, termText: c.termText })));
  return created;
}

module.exports = { execute };
