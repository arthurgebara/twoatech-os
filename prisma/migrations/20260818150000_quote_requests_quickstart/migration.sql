CREATE TYPE "QuoteRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'DISMISSED');

ALTER TABLE "users" ADD COLUMN "hasCompletedQuickstart" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "quote_requests" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "equipmentType" "EquipmentType" NOT NULL,
    "equipmentDescription" VARCHAR(240),
    "reportedProblem" TEXT NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'NEW',
    "contactedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quote_requests_status_createdAt_idx" ON "quote_requests"("status", "createdAt" DESC);
CREATE INDEX "quote_requests_phone_idx" ON "quote_requests"("phone");
