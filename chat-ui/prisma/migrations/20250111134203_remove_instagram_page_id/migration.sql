/*
  Warnings:

  - You are about to drop the column `instagramPageId` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "currentPeriodEnd" DATETIME,
    "subscriptionId" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "monthlyTokens" INTEGER NOT NULL DEFAULT 100,
    "instagramHandle" TEXT,
    "instagramAccessToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "currentPeriodEnd", "email", "id", "instagramAccessToken", "instagramHandle", "monthlyTokens", "subscriptionId", "subscriptionTier", "updatedAt") SELECT "createdAt", "currentPeriodEnd", "email", "id", "instagramAccessToken", "instagramHandle", "monthlyTokens", "subscriptionId", "subscriptionTier", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
