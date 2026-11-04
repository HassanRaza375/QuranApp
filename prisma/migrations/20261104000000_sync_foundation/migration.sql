-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SyncRecord" (
    "userId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "recordKey" TEXT NOT NULL,
    "payload" JSONB,
    "schemaVer" INTEGER NOT NULL DEFAULT 1,
    "revision" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "bytes" INTEGER NOT NULL,

    CONSTRAINT "SyncRecord_pkey" PRIMARY KEY ("userId","namespace","recordKey")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "userId" TEXT NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,
    "bytes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SyncRecord_userId_revision_idx" ON "SyncRecord"("userId", "revision");

