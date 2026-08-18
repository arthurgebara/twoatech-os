ALTER TYPE "ServiceOrderTimelineEventType" ADD VALUE 'RELATORIO_SERVICO_REGISTRADO';

CREATE TABLE "service_reports" (
    "id" UUID NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "workPerformed" TEXT NOT NULL,
    "partsUsed" TEXT,
    "testsPerformed" TEXT,
    "notes" TEXT,
    "registeredById" UUID NOT NULL,
    "registeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_reports_serviceOrderId_key" ON "service_reports"("serviceOrderId");

ALTER TABLE "service_reports"
ADD CONSTRAINT "service_reports_serviceOrderId_fkey"
FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_reports"
ADD CONSTRAINT "service_reports_registeredById_fkey"
FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotes"
ADD COLUMN "seriesId" UUID,
ADD COLUMN "customerId" UUID,
ADD COLUMN "equipmentId" UUID,
ADD COLUMN "reportedProblem" TEXT,
ADD COLUMN "receivedAccessories" TEXT,
ADD COLUMN "generalNotes" TEXT,
ADD COLUMN "sentIdempotencyKey" VARCHAR(128),
ADD COLUMN "decisionIdempotencyKey" VARCHAR(128);

UPDATE "quotes" AS quote
SET
    "seriesId" = quote."serviceOrderId",
    "customerId" = service_order."customerId",
    "equipmentId" = service_order."equipmentId",
    "reportedProblem" = service_order."reportedProblem",
    "receivedAccessories" = service_order."receivedAccessories",
    "generalNotes" = service_order."generalNotes"
FROM "service_orders" AS service_order
WHERE service_order."id" = quote."serviceOrderId";

ALTER TABLE "quotes"
ALTER COLUMN "seriesId" SET NOT NULL,
ALTER COLUMN "customerId" SET NOT NULL,
ALTER COLUMN "equipmentId" SET NOT NULL,
ALTER COLUMN "reportedProblem" SET NOT NULL,
ALTER COLUMN "serviceOrderId" DROP NOT NULL;

DROP INDEX "quotes_serviceOrderId_version_key";

CREATE UNIQUE INDEX "quotes_seriesId_version_key" ON "quotes"("seriesId", "version");
CREATE INDEX "quotes_customerId_idx" ON "quotes"("customerId");
CREATE INDEX "quotes_equipmentId_idx" ON "quotes"("equipmentId");

ALTER TABLE "quotes"
ADD CONSTRAINT "quotes_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotes"
ADD CONSTRAINT "quotes_equipmentId_fkey"
FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
