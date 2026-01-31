/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "JobStatus" ADD VALUE 'CANCEL_REQUESTED';
ALTER TYPE "JobStatus" ADD VALUE 'TIMED_OUT';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "attempt" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "max_attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "retry_delay_ms" INTEGER,
ADD COLUMN     "timeout_ms" INTEGER NOT NULL DEFAULT 60000;

-- CreateIndex
CREATE UNIQUE INDEX "jobs_idempotency_key_key" ON "jobs"("idempotency_key");
