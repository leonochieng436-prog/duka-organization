CREATE TYPE "InvoiceDocumentType" AS ENUM ('STANDARD_DUKAOS_RECEIPT', 'ETIMS_TAX_INVOICE');
CREATE TYPE "EtimsStatus" AS ENUM ('DISABLED', 'ENABLED', 'CONFIGURING', 'CONNECTED', 'ERROR');
CREATE TYPE "SaleCompletionMode" AS ENUM ('NORMAL', 'QUEUE_FOR_SYNC', 'BLOCK_COMPLETION');
CREATE TYPE "EtimsInvoiceStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'FAILED', 'CANCELLED');
CREATE TYPE "EtimsSubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'FAILED');

ALTER TABLE "invoices" ADD COLUMN "documentType" "InvoiceDocumentType" NOT NULL DEFAULT 'STANDARD_DUKAOS_RECEIPT';

CREATE TABLE "etims_configurations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "status" "EtimsStatus" NOT NULL DEFAULT 'DISABLED',
  "completionMode" "SaleCompletionMode" NOT NULL DEFAULT 'QUEUE_FOR_SYNC',
  "environment" TEXT,
  "apiUrl" TEXT,
  "clientId" TEXT,
  "encryptedSecret" TEXT,
  "businessPin" TEXT,
  "invoicePrefix" TEXT,
  "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
  "lastError" TEXT,
  "lastConnectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "etims_configurations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "etims_configurations_organizationId_key" ON "etims_configurations"("organizationId");

CREATE TABLE "etims_invoices" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "saleId" TEXT,
  "invoiceId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "status" "EtimsInvoiceStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  "subtotal" DECIMAL(14,2) NOT NULL,
  "taxTotal" DECIMAL(14,2) NOT NULL,
  "total" DECIMAL(14,2) NOT NULL,
  "payload" JSONB NOT NULL,
  "etimsReference" TEXT,
  "response" JSONB,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "etims_invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "etims_invoices_saleId_key" ON "etims_invoices"("saleId");
CREATE UNIQUE INDEX "etims_invoices_invoiceId_key" ON "etims_invoices"("invoiceId");
CREATE UNIQUE INDEX "etims_invoices_organizationId_invoiceNumber_key" ON "etims_invoices"("organizationId", "invoiceNumber");
CREATE INDEX "etims_invoices_organizationId_status_idx" ON "etims_invoices"("organizationId", "status");
CREATE INDEX "etims_invoices_organizationId_branchId_createdAt_idx" ON "etims_invoices"("organizationId", "branchId", "createdAt");

CREATE TABLE "etims_submissions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "etimsInvoiceId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "EtimsSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "nextRetryAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "responseRef" TEXT,
  "errorMessage" TEXT,
  "response" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "etims_submissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "etims_submissions_idempotencyKey_key" ON "etims_submissions"("idempotencyKey");
CREATE INDEX "etims_submissions_organizationId_status_nextRetryAt_idx" ON "etims_submissions"("organizationId", "status", "nextRetryAt");

CREATE TABLE "etims_sync_attempts" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" "EtimsSubmissionStatus" NOT NULL,
  "errorMessage" TEXT,
  "response" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "etims_sync_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "etims_sync_attempts_submissionId_attemptNumber_key" ON "etims_sync_attempts"("submissionId", "attemptNumber");

ALTER TABLE "etims_configurations" ADD CONSTRAINT "etims_configurations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "etims_invoices" ADD CONSTRAINT "etims_invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "etims_invoices" ADD CONSTRAINT "etims_invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON UPDATE CASCADE;
ALTER TABLE "etims_invoices" ADD CONSTRAINT "etims_invoices_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "etims_invoices" ADD CONSTRAINT "etims_invoices_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "etims_submissions" ADD CONSTRAINT "etims_submissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "etims_submissions" ADD CONSTRAINT "etims_submissions_etimsInvoiceId_fkey" FOREIGN KEY ("etimsInvoiceId") REFERENCES "etims_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "etims_sync_attempts" ADD CONSTRAINT "etims_sync_attempts_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "etims_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
