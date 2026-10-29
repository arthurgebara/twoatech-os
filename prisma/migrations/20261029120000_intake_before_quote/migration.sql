-- Additive migration: existing orders, quote decisions and timeline remain untouched.
CREATE TYPE "QuoteKind" AS ENUM ('LEGACY', 'ESTIMATE', 'DEFINITIVE');
ALTER TYPE "ServiceOrderTimelineEventType" ADD VALUE 'ATENDIMENTO_CRIADO';
ALTER TYPE "ServiceOrderTimelineEventType" ADD VALUE 'ATENDIMENTO_CONVERTIDO';
ALTER TABLE "service_orders" ADD COLUMN "isIntake" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "convertedAt" TIMESTAMPTZ(3);
ALTER TABLE "quotes" ADD COLUMN "kind" "QuoteKind" NOT NULL DEFAULT 'LEGACY';
CREATE TABLE "quote_evidence" (
 "quoteId" UUID NOT NULL,
 "attachmentId" UUID NOT NULL,
 "position" INTEGER NOT NULL,
 CONSTRAINT "quote_evidence_pkey" PRIMARY KEY ("quoteId", "attachmentId"),
 CONSTRAINT "quote_evidence_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "quote_evidence_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "checklist_attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "quote_evidence_quoteId_position_key" ON "quote_evidence"("quoteId", "position");
