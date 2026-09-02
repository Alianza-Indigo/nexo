UPDATE "User"
SET "status" = 'ACTIVE'
WHERE "status" = 'PENDING' AND "deletedAt" IS NULL;

ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TABLE IF EXISTS "VerificationToken";
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerifiedAt";
