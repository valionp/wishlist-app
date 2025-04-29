-- AlterTable
ALTER TABLE "Session" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "Session" ADD COLUMN "accountOwner" BOOLEAN DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "collaborator" BOOLEAN DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "email" TEXT;
ALTER TABLE "Session" ADD COLUMN "emailVerified" BOOLEAN DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Session" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Session" ADD COLUMN "locale" TEXT;
ALTER TABLE "Session" ADD COLUMN "userId" TEXT;
