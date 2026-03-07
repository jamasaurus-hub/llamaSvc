/**
 * Command: c101_saveLearningItemsToMorocco
 * State-changing: inserts an array of learning items into the LearningItem table.
 * Caller passes userId (e.g. from req.user.id after auth middleware). Validates collection ownership.
 * When collection not found by id, may create it if collectionName is provided.
 */
const { prisma } = require('../services/db');
const { normalise } = require('../services/learningItems');
const { createCollection } = require('../services/collection');

const DEFAULT_LANGUAGE = 'en';

/**
 * @param {{
 *   userId: string,
 *   collectionId: string,
 *   collectionName?: string,
 *   collectionDescription?: string,
 *   learningItems: Array<{
 *     termText: string,
 *     definitionText: string,
 *     sourceContext?: string | null,
 *     sourceUrl?: string | null,
 *     language?: string
 *   }>
 * }} command
 * @returns {Promise<{ created: import('@prisma/client').LearningItem[], savedCount: number, ignoredCount: number }>}
 */
async function execute({ userId, collectionId, collectionName, collectionDescription, learningItems }) {
  const userIdTrimmed = typeof userId === 'string' ? userId.trim() : '';
  const collectionIdTrimmed = typeof collectionId === 'string' ? collectionId.trim() : '';
  const collectionNameTrimmed = typeof collectionName === 'string' ? collectionName.trim() : '';
  const collectionDescriptionTrimmed = typeof collectionDescription === 'string' ? collectionDescription.trim() : '';
  const items = Array.isArray(learningItems) ? learningItems : [];

  if (!userIdTrimmed) {
    const err = new Error('userId is required');
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

  let collection = await prisma.collection.findFirst({
    where: { id: collectionIdTrimmed, ownerUserId: userIdTrimmed },
  });
  if (!collection) {
    if (collectionNameTrimmed) {
      collection = await createCollection({
        id: collectionIdTrimmed,
        ownerUserId: userIdTrimmed,
        name: collectionNameTrimmed,
        description: collectionDescriptionTrimmed || '',
        isSystemGenerated: false,
      });
    } else {
      const err = new Error('Collection not found or access denied');
      err.status = 403;
      throw err;
    }
  }

  const ownerUserId = userIdTrimmed;
  console.log('[c101_saveLearningItemsToMorocco] user resolved', { ownerUserId, collectionId: collectionIdTrimmed, itemCount: items.length });

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
    console.log('[c101_saveLearningItemsToMorocco] validation failed: item missing termText or definitionText', missing);
    const err = new Error('Each learning item must have termText and definitionText');
    err.status = 400;
    throw err;
  }

  // 1. Resolve canonical entries for the batch; build list of { item, canonicalEntry }
  const pairs = await Promise.all(
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

      return { item, canonicalEntry };
    })
  );

  // 2. Load existing canonical entry IDs already in this collection
  const batchCanonicalEntryIds = [...new Set(pairs.map((p) => p.canonicalEntry.id))];
  const existingInCollection = await prisma.learningItem.findMany({
    where: {
      collectionId: collectionIdTrimmed,
      canonicalEntryId: { in: batchCanonicalEntryIds },
    },
    select: { canonicalEntryId: true },
  });
  const existingCanonicalEntryIds = new Set(existingInCollection.map((li) => li.canonicalEntryId));

  // 3. Decide which rows to create: skip if already in collection or already seen in this batch
  const toCreate = [];
  for (const { item, canonicalEntry } of pairs) {
    if (existingCanonicalEntryIds.has(canonicalEntry.id)) {
      continue;
    }
    existingCanonicalEntryIds.add(canonicalEntry.id);
    toCreate.push({ item, canonicalEntry });
  }

  // 4. Create only non-duplicate LearningItems
  const created =
    toCreate.length === 0
      ? []
      : await Promise.all(
          toCreate.map(({ item, canonicalEntry }) =>
            prisma.learningItem.create({
              data: {
                ownerUserId,
                collectionId: collectionIdTrimmed,
                termText: item.termText,
                definitionText: item.definitionText,
                sourceContext: item.sourceContext,
                sourceUrl: item.sourceUrl,
                canonicalEntryId: canonicalEntry.id,
              },
            })
          )
        );

  const savedCount = created.length;
  const ignoredCount = items.length - savedCount;
  if (ignoredCount > 0) {
    console.log('[c101_saveLearningItemsToMorocco] skipped duplicates', { ignoredCount, savedCount });
  }
  console.log('[c101_saveLearningItemsToMorocco] created in DB', savedCount, created.map((c) => ({ id: c.id, termText: c.termText })));
  return { created, savedCount, ignoredCount };
}

module.exports = { execute };
