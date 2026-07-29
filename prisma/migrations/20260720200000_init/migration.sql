-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('DESKTOP', 'NOTEBOOK', 'GAMING_PC', 'ALL_IN_ONE', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('OPEN', 'RECEIVED', 'DIAGNOSING', 'AWAITING_APPROVAL', 'QUOTE_REJECTED', 'APPROVED', 'IN_PROGRESS', 'WAITING_PART', 'COMPLETED', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ChecklistType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "QuoteItemType" AS ENUM ('SERVICE', 'PART', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceOrderTimelineEventType" AS ENUM ('ORDEM_CRIADA', 'EQUIPAMENTO_RECEBIDO', 'CHECKLIST_ENTRADA_CONCLUIDO', 'DIAGNOSTICO_REGISTRADO', 'ORCAMENTO_CRIADO', 'ORCAMENTO_ENVIADO', 'ORCAMENTO_APROVADO', 'ORCAMENTO_REJEITADO', 'SERVICO_INICIADO', 'AGUARDANDO_PECA', 'PECA_RECEBIDA', 'SERVICO_CONCLUIDO', 'CHECKLIST_SAIDA_CONCLUIDO', 'EQUIPAMENTO_PRONTO', 'EQUIPAMENTO_ENTREGUE', 'ORDEM_CANCELADA', 'OBSERVACAO_ADICIONADA');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "image" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "document" VARCHAR(14),
    "email" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "secondaryPhone" VARCHAR(20),
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "brand" VARCHAR(100),
    "model" VARCHAR(120),
    "serialNumber" VARCHAR(120),
    "color" VARCHAR(60),
    "specifications" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "customerId" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'OPEN',
    "reportedProblem" TEXT NOT NULL,
    "receivedAccessories" TEXT,
    "generalNotes" TEXT,
    "receivedAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_checklists" (
    "id" UUID NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "type" "ChecklistType" NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completedAt" TIMESTAMPTZ(3),
    "completedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_order_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL,
    "checklistId" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostics" (
    "id" UUID NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "technicalConclusion" TEXT,
    "recommendations" TEXT,
    "registeredById" UUID NOT NULL,
    "registeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog_items" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "defaultPrice" DECIMAL(12,2) NOT NULL,
    "estimatedMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "validUntil" DATE,
    "notes" TEXT,
    "sentAt" TIMESTAMPTZ(3),
    "approvedAt" TIMESTAMPTZ(3),
    "rejectedAt" TIMESTAMPTZ(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "serviceCatalogItemId" UUID,
    "type" "QuoteItemType" NOT NULL,
    "description" VARCHAR(240) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_timeline_events" (
    "id" UUID NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "type" "ServiceOrderTimelineEventType" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "responsibleUserId" UUID,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "customers"("document");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "equipment_customerId_idx" ON "equipment"("customerId");

-- CreateIndex
CREATE INDEX "equipment_serialNumber_idx" ON "equipment"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_number_key" ON "service_orders"("number");

-- CreateIndex
CREATE INDEX "service_orders_status_createdAt_idx" ON "service_orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "service_orders_customerId_idx" ON "service_orders"("customerId");

-- CreateIndex
CREATE INDEX "service_orders_equipmentId_idx" ON "service_orders"("equipmentId");

-- CreateIndex
CREATE INDEX "service_order_checklists_status_idx" ON "service_order_checklists"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_checklists_serviceOrderId_type_key" ON "service_order_checklists"("serviceOrderId", "type");

-- CreateIndex
CREATE INDEX "checklist_items_checklistId_position_idx" ON "checklist_items"("checklistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_checklistId_key_key" ON "checklist_items"("checklistId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostics_serviceOrderId_key" ON "diagnostics"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_catalog_items_name_idx" ON "service_catalog_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_number_key" ON "quotes"("number");

-- CreateIndex
CREATE INDEX "quotes_serviceOrderId_status_idx" ON "quotes"("serviceOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_serviceOrderId_version_key" ON "quotes"("serviceOrderId", "version");

-- CreateIndex
CREATE INDEX "quote_items_quoteId_position_idx" ON "quote_items"("quoteId", "position");

-- CreateIndex
CREATE INDEX "quote_items_serviceCatalogItemId_idx" ON "quote_items"("serviceCatalogItemId");

-- CreateIndex
CREATE INDEX "service_order_timeline_events_serviceOrderId_occurredAt_idx" ON "service_order_timeline_events"("serviceOrderId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "service_order_timeline_events_type_idx" ON "service_order_timeline_events"("type");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_timeline_events_serviceOrderId_idempotencyKey_key" ON "service_order_timeline_events"("serviceOrderId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklists" ADD CONSTRAINT "service_order_checklists_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklists" ADD CONSTRAINT "service_order_checklists_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "service_order_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_serviceCatalogItemId_fkey" FOREIGN KEY ("serviceCatalogItemId") REFERENCES "service_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_timeline_events" ADD CONSTRAINT "service_order_timeline_events_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_timeline_events" ADD CONSTRAINT "service_order_timeline_events_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep the service order timeline append-only, including outside the application.
CREATE OR REPLACE FUNCTION prevent_service_order_timeline_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'service order timeline events are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_order_timeline_events_immutable
BEFORE UPDATE OR DELETE ON "service_order_timeline_events"
FOR EACH ROW EXECUTE FUNCTION prevent_service_order_timeline_mutation();
