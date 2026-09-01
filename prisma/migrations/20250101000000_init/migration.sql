-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'URL', 'DATE', 'DROPDOWN', 'FILE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateTable
CREATE TABLE "FotUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "maxLength" INTEGER,
    "options" JSONB,
    "minFiles" INTEGER,
    "maxFiles" INTEGER,
    "maxSizeMb" INTEGER,
    "allowedTypes" JSONB,
    "width" INTEGER,
    "height" INTEGER,
    "stepId" TEXT NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "soNumber" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldValue" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "files" JSONB,

    CONSTRAINT "FieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FotUser_email_key" ON "FotUser"("email");

-- CreateIndex
CREATE INDEX "Step_productId_idx" ON "Step"("productId");

-- CreateIndex
CREATE INDEX "Field_stepId_idx" ON "Field"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_shareToken_key" ON "Submission"("shareToken");

-- CreateIndex
CREATE INDEX "Submission_productId_idx" ON "Submission"("productId");

-- CreateIndex
CREATE INDEX "Submission_soNumber_idx" ON "Submission"("soNumber");

-- CreateIndex
CREATE INDEX "FieldValue_submissionId_idx" ON "FieldValue"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldValue_submissionId_fieldId_key" ON "FieldValue"("submissionId", "fieldId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "FotUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "FotUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

