import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exitChecklistItemDefinitions, type SaveExitChecklistInput } from "@/schemas/exit-checklist.schema";

const select = {
  id: true,
  serviceOrderId: true,
  status: true,
  notes: true,
  completedAt: true,
  completedBy: { select: { id: true, name: true } },
  items: {
    select: { id: true, key: true, label: true, checked: true, notes: true, position: true },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.ServiceOrderChecklistSelect;

export type ExitChecklistDetail = Prisma.ServiceOrderChecklistGetPayload<{ select: typeof select }>;
export type ExitChecklistTransaction = Prisma.TransactionClient;

export const exitChecklistRepository = {
  transaction<T>(operation: (transaction: ExitChecklistTransaction) => Promise<T>) {
    return prisma.$transaction(operation, { isolationLevel: "Serializable" });
  },
  find(serviceOrderId: string) {
    return prisma.serviceOrderChecklist.findUnique({
      where: { serviceOrderId_type: { serviceOrderId, type: "EXIT" } },
      select,
    });
  },
  findInTransaction(transaction: ExitChecklistTransaction, serviceOrderId: string) {
    return transaction.serviceOrderChecklist.findUnique({
      where: { serviceOrderId_type: { serviceOrderId, type: "EXIT" } },
      select,
    });
  },
  findOrder(transaction: ExitChecklistTransaction, id: string) {
    return transaction.serviceOrder.findUnique({ where: { id }, select: { id: true, status: true } });
  },
  ensure(transaction: ExitChecklistTransaction, serviceOrderId: string, occurredAt: Date) {
    return transaction.serviceOrderChecklist.upsert({
      where: { serviceOrderId_type: { serviceOrderId, type: "EXIT" } },
      create: {
        serviceOrderId,
        type: "EXIT",
        createdAt: occurredAt,
        items: { create: exitChecklistItemDefinitions.map((item, position) => ({ ...item, position, createdAt: occurredAt })) },
      },
      update: {},
      select,
    });
  },
  async saveItems(transaction: ExitChecklistTransaction, checklistId: string, input: SaveExitChecklistInput) {
    const definitions = new Map(exitChecklistItemDefinitions.map((item, position) => [item.key, { ...item, position }]));
    await Promise.all(input.items.map((item) => {
      const definition = definitions.get(item.key);
      if (!definition) throw new Error("Definição de checklist não encontrada.");
      return transaction.checklistItem.upsert({
        where: { checklistId_key: { checklistId, key: item.key } },
        create: { checklistId, ...definition, checked: item.checked, notes: item.notes || null },
        update: { checked: item.checked, notes: item.notes || null },
      });
    }));
    return transaction.serviceOrderChecklist.update({ where: { id: checklistId }, data: { notes: input.notes || null }, select });
  },
  markCompleted(transaction: ExitChecklistTransaction, checklistId: string, responsibleUserId: string, occurredAt: Date) {
    return transaction.serviceOrderChecklist.updateMany({
      where: { id: checklistId, status: "PENDING" },
      data: { status: "COMPLETED", completedById: responsibleUserId, completedAt: occurredAt },
    });
  },
  findEvent(transaction: ExitChecklistTransaction, serviceOrderId: string, idempotencyKey: string) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: { serviceOrderId_idempotencyKey: { serviceOrderId, idempotencyKey } },
      select: { id: true, type: true, metadata: true },
    });
  },
  createEvent(transaction: ExitChecklistTransaction, data: Prisma.ServiceOrderTimelineEventCreateManyInput) {
    return transaction.serviceOrderTimelineEvent.createMany({ data, skipDuplicates: true });
  },
};
