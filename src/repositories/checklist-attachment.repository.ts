import "server-only";

import type { ChecklistType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const attachmentSelect = {
  id: true,
  serviceOrderId: true,
  checklistType: true,
  bucket: true,
  objectPath: true,
  originalName: true,
  mimeType: true,
  size: true,
  uploadedById: true,
  uploadedAt: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} satisfies Prisma.ChecklistAttachmentSelect;

export type ChecklistAttachmentDetail = Prisma.ChecklistAttachmentGetPayload<{ select: typeof attachmentSelect }>;

export const checklistAttachmentRepository = {
  findOrder(serviceOrderId: string, checklistType: ChecklistType) {
    return prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: {
        id: true,
        status: true,
        checklists: { where: { type: checklistType }, select: { status: true }, take: 1 },
      },
    });
  },
  createPending(data: Prisma.ChecklistAttachmentUncheckedCreateInput) {
    return prisma.checklistAttachment.create({ data, select: attachmentSelect });
  },
  removePending(id: string) {
    return prisma.checklistAttachment.deleteMany({ where: { id, uploadedAt: null } });
  },
  findById(id: string) {
    return prisma.checklistAttachment.findUnique({ where: { id }, select: attachmentSelect });
  },
  markUploaded(id: string, uploadedAt: Date) {
    return prisma.checklistAttachment.updateMany({ where: { id, uploadedAt: null }, data: { uploadedAt } });
  },
  list(serviceOrderId: string, checklistType: ChecklistType) {
    return prisma.checklistAttachment.findMany({
      where: { serviceOrderId, checklistType, uploadedAt: { not: null } },
      orderBy: { uploadedAt: "desc" },
      select: attachmentSelect,
    });
  },
  findAccessible(id: string) {
    return prisma.checklistAttachment.findFirst({
      where: { id, uploadedAt: { not: null } },
      select: attachmentSelect,
    });
  },
};
