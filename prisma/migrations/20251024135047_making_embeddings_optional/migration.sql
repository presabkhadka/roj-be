-- AlterTable
ALTER TABLE "Jobs" ALTER COLUMN "embeddings" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "embeddings" DROP NOT NULL;
