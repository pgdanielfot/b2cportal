-- One shareable campaign dashboard can contain several existing form submissions.
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "soNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Submission" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "Submission" ADD COLUMN "campaignSequence" INTEGER;

CREATE UNIQUE INDEX "Campaign_shareToken_key" ON "Campaign"("shareToken");
CREATE INDEX "Campaign_productId_idx" ON "Campaign"("productId");
CREATE INDEX "Campaign_soNumber_idx" ON "Campaign"("soNumber");
CREATE INDEX "Submission_campaignId_idx" ON "Submission"("campaignId");
CREATE UNIQUE INDEX "Submission_campaignId_campaignSequence_key" ON "Submission"("campaignId", "campaignSequence");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "FotUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
