-- AlterTable
ALTER TABLE "Product" DROP COLUMN "adSamplesUrl";

-- AlterTable
ALTER TABLE "Field" ADD COLUMN "sampleUrl" TEXT;
