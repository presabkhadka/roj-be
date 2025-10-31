/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Jobs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Jobs" ADD COLUMN     "description" TEXT NOT NULL,
ALTER COLUMN "closedAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Jobs_title_key" ON "Jobs"("title");
