-- Provider-agnostic user identity: replace auth0Id with authProvider + authProviderId
-- Step 1: Add new columns (nullable initially for backfill)
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT;
ALTER TABLE "User" ADD COLUMN "authProviderId" TEXT;
ALTER TABLE "User" ADD COLUMN "plan" TEXT;

-- Step 2: Backfill existing rows (auth0Id -> authProvider='auth0', authProviderId=auth0Id)
UPDATE "User" SET "authProvider" = 'auth0', "authProviderId" = "auth0Id";

-- Step 3: Enforce NOT NULL on identity columns
ALTER TABLE "User" ALTER COLUMN "authProvider" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "authProviderId" SET NOT NULL;

-- Step 4: Drop old unique constraint and column
DROP INDEX IF EXISTS "User_auth0Id_key";
ALTER TABLE "User" DROP COLUMN "auth0Id";

-- Step 5: Add compound unique on (authProvider, authProviderId)
CREATE UNIQUE INDEX "User_authProvider_authProviderId_key" ON "User"("authProvider", "authProviderId");
