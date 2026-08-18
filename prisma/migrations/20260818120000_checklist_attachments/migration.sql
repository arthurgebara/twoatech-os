CREATE TABLE "checklist_attachments" (
    "id" UUID NOT NULL,
    "serviceOrderId" UUID NOT NULL,
    "checklistType" "ChecklistType" NOT NULL,
    "bucket" VARCHAR(100) NOT NULL,
    "objectPath" VARCHAR(500) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" UUID NOT NULL,
    "uploadedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "checklist_attachments_objectPath_key" ON "checklist_attachments"("objectPath");
CREATE INDEX "checklist_attachments_serviceOrderId_checklistType_uploadedAt_idx" ON "checklist_attachments"("serviceOrderId", "checklistType", "uploadedAt");
CREATE INDEX "checklist_attachments_uploadedById_idx" ON "checklist_attachments"("uploadedById");

ALTER TABLE "checklist_attachments" ADD CONSTRAINT "checklist_attachments_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checklist_attachments" ADD CONSTRAINT "checklist_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
