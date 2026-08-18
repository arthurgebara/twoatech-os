import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const serviceReportSelect = {
  id: true,
  serviceOrderId: true,
  workPerformed: true,
  partsUsed: true,
  testsPerformed: true,
  notes: true,
  registeredAt: true,
  registeredBy: { select: { id: true, name: true } },
} satisfies Prisma.ServiceReportSelect;

export type ServiceReportDetail = Prisma.ServiceReportGetPayload<{ select: typeof serviceReportSelect }>;
export type ServiceReportTransaction = Prisma.TransactionClient;

export const serviceReportRepository = {
  transaction<T>(operation: (transaction: ServiceReportTransaction) => Promise<T>) {
    return prisma.$transaction(operation, { isolationLevel: "Serializable" });
  },
  find(serviceOrderId: string) {
    return prisma.serviceReport.findUnique({ where: { serviceOrderId }, select: serviceReportSelect });
  },
  findOrder(transaction: ServiceReportTransaction, serviceOrderId: string) {
    return transaction.serviceOrder.findUnique({ where: { id: serviceOrderId }, select: { id: true, status: true, serviceReport: { select: { id: true } } } });
  },
  findEvent(transaction: ServiceReportTransaction, serviceOrderId: string, idempotencyKey: string) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: { serviceOrderId_idempotencyKey: { serviceOrderId, idempotencyKey } },
      select: { id: true, type: true, metadata: true },
    });
  },
  create(transaction: ServiceReportTransaction, data: Prisma.ServiceReportCreateInput) {
    return transaction.serviceReport.create({ data, select: serviceReportSelect });
  },
  completeOrder(transaction: ServiceReportTransaction, serviceOrderId: string) {
    return transaction.serviceOrder.updateMany({ where: { id: serviceOrderId, status: "IN_PROGRESS" }, data: { status: "COMPLETED" } });
  },
  createEvents(transaction: ServiceReportTransaction, data: Prisma.ServiceOrderTimelineEventCreateManyInput[]) {
    return transaction.serviceOrderTimelineEvent.createMany({ data, skipDuplicates: true });
  },
};
