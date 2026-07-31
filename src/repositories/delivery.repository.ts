import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type DeliveryTransaction = Prisma.TransactionClient;

export const deliveryRepository = {
  transaction<T>(operation: (transaction: DeliveryTransaction) => Promise<T>) {
    return prisma.$transaction(operation, { isolationLevel: "Serializable" });
  },
  findOrder(transaction: DeliveryTransaction, id: string) {
    return transaction.serviceOrder.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        deliveredAt: true,
        checklists: { where: { type: "EXIT" }, select: { status: true }, take: 1 },
      },
    });
  },
  updateStatus(
    transaction: DeliveryTransaction,
    id: string,
    previousStatus: Prisma.ServiceOrderWhereInput["status"],
    data: Prisma.ServiceOrderUpdateManyMutationInput,
  ) {
    return transaction.serviceOrder.updateMany({ where: { id, status: previousStatus }, data });
  },
  findEvent(transaction: DeliveryTransaction, serviceOrderId: string, idempotencyKey: string) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: { serviceOrderId_idempotencyKey: { serviceOrderId, idempotencyKey } },
      select: { id: true, type: true, description: true },
    });
  },
  createEvent(transaction: DeliveryTransaction, data: Prisma.ServiceOrderTimelineEventCreateManyInput) {
    return transaction.serviceOrderTimelineEvent.createMany({ data, skipDuplicates: true });
  },
  cancelOpenQuotes(transaction: DeliveryTransaction, serviceOrderId: string) {
    return transaction.quote.updateMany({
      where: {
        serviceOrderId,
        status: { in: ["DRAFT", "SENT"] },
      },
      data: { status: "CANCELED" },
    });
  },
};
