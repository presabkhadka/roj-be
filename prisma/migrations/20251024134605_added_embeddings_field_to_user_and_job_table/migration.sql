/*
  Warnings:

  - Added the required column `embeddings` to the `Jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `embeddings` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Jobs" ADD COLUMN     "embeddings" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "embeddings" JSONB NOT NULL;
