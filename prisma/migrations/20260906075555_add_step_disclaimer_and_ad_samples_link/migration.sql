-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "adSamplesUrl" TEXT;

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "disclaimer" TEXT,
ADD COLUMN     "disclaimerMs" TEXT,
ADD COLUMN     "disclaimerZh" TEXT;
