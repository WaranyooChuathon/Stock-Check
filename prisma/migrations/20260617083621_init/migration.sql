-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'staff');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('in_stock', 'lease_or_sold', 'trial', 'repair_lost');

-- CreateEnum
CREATE TYPE "VerifyState" AS ENUM ('unverified', 'verified', 'discrepancy');

-- CreateEnum
CREATE TYPE "ChangeAction" AS ENUM ('import', 'verify', 'edit', 'delete', 'restore');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT,
    "boxSerialNumber" TEXT,
    "category" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'in_stock',
    "verifyState" "VerifyState" NOT NULL DEFAULT 'unverified',
    "version" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "location" TEXT,
    "boxLocation" TEXT,
    "attributes" JSONB,
    "accessoryNote" TEXT,
    "note" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitChecklist" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UnitChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "ChangeAction" NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionArchive" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "snapshot" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgedById" TEXT NOT NULL,

    CONSTRAINT "DeletionArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Item_verifyState_idx" ON "Item"("verifyState");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");

-- CreateIndex
CREATE INDEX "Item_deletedAt_idx" ON "Item"("deletedAt");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE UNIQUE INDEX "UnitChecklist_unitId_checklistItemId_key" ON "UnitChecklist"("unitId", "checklistItemId");

-- CreateIndex
CREATE INDEX "ChangeLog_unitId_idx" ON "ChangeLog"("unitId");

-- CreateIndex
CREATE INDEX "DeletionArchive_purgedAt_idx" ON "DeletionArchive"("purgedAt");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitChecklist" ADD CONSTRAINT "UnitChecklist_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitChecklist" ADD CONSTRAINT "UnitChecklist_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionArchive" ADD CONSTRAINT "DeletionArchive_purgedById_fkey" FOREIGN KEY ("purgedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Partial unique index: serialNumber must be unique ONLY among verified items.
-- Import data is messy (duplicate/blank S/N) so we allow dups while unverified,
-- but block two *verified* items from claiming the same real device S/N.
-- (Prisma schema cannot express partial indexes; added as raw SQL.)
CREATE UNIQUE INDEX "Item_serialNumber_verified_key"
ON "Item"("serialNumber")
WHERE "verifyState" = 'verified' AND "serialNumber" IS NOT NULL;
