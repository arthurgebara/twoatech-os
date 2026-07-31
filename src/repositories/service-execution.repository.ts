import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ServiceExecutionTransaction = Prisma.TransactionClient;

export const serviceExecutionRepository = {
  transaction<T>(operation: (transaction: ServiceExecutionTransaction) => Promise<T>) {
    return prisma.$transaction(operation, { isolationLevel: "Serializable" });
  },
  findOrder(transaction: ServiceExecutionTransaction, id: string) {
    return transaction.serviceOrder.findUnique({
      where: { id },
      select: { id: true, number: true, status: true },
    });
  },
  updateStatus(
    transaction: ServiceExecutionTransaction,
    id: string,
    previousStatus: "APPROVED" | "IN_PROGRESS" | "WAITING_PART",
    newStatus: "IN_PROGRESS" | "WAITING_PART" | "COMPLETED",
  ) {
    return transaction.serviceOrder.updateMany({
      where: { id, status: previousStatus },
      data: { status: newStatus },
    });
  },
  findEvent(transaction: ServiceExecutionTransaction, serviceOrderId: string, idempotencyKey: string) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: { serviceOrderId_idempotencyKey: { serviceOrderId, idempotencyKey } },
      select: { id: true, type: true },
    });
  },
  createEvent(transaction: ServiceExecutionTransaction, data: Prisma.ServiceOrderTimelineEventCreateManyInput) {
    return transaction.serviceOrderTimelineEvent.createMany({ data, skipDuplicates: true });
  },
};
