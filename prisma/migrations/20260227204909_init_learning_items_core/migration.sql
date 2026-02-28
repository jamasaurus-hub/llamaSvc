-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalEntry" (
    "id" TEXT NOT NULL,
    "normalisedTerm" TEXT NOT NULL,
    "normalisedDefinition" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningItem" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "collectionId" TEXT,
    "termText" TEXT NOT NULL,
    "definitionText" TEXT NOT NULL,
    "sourceContext" TEXT,
    "sourceUrl" TEXT,
    "canonicalEntryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_auth0Id_key" ON "User"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalEntry_normalisedTerm_normalisedDefinition_language_key" ON "CanonicalEntry"("normalisedTerm", "normalisedDefinition", "language");

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_canonicalEntryId_fkey" FOREIGN KEY ("canonicalEntryId") REFERENCES "CanonicalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
