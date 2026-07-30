import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const quoteDetailSelect = {
  id: true,
  number: true,
  version: true,
  status: true,
  subtotal: true,
  discount: true,
  total: true,
  validUntil: true,
  notes: true,
  sentAt: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  serviceOrder: {
    select: {
      id: true,
      number: true,
      status: true,
      customer: { select: { id: true, name: true, document: true, phone: true } },
      equipment: { select: { id: true, type: true, brand: true, model: true, serialNumber: true } },
    },
  },
  createdBy: { select: { id: true, name: true } },
  items: {
    select: {
      id: true,
      type: true,
      description: true,
      quantity: true,
      unitPrice: true,
      total: true,
      position: true,
      serviceCatalogItemId: true,
    },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.QuoteSelect;

const quoteListSelect = {
  id: true,
  number: true,
  version: true,
  status: true,
  total: true,
  validUntil: true,
  createdAt: true,
  serviceOrder: {
    select: {
      id: true,
      number: true,
      customer: { select: { name: true } },
    },
  },
} satisfies Prisma.QuoteSelect;

export type QuoteDetail = Prisma.QuoteGetPayload<{ select: typeof quoteDetailSelect }>;
export type QuoteTransaction = Prisma.TransactionClient;

function listWhere(search: string, status?: Prisma.EnumQuoteStatusFilter["equals"]): Prisma.QuoteWhereInput {
  const filters: Prisma.QuoteWhereInput[] = [];
  if (status) filters.push({ status });
  if (search) {
    const number = Number(search.replace(/\D/g, ""));
    filters.push({
      OR: [
        { serviceOrder: { customer: { name: { contains: search, mode: "insensitive" } } } },
        ...(Number.isSafeInteger(number) && number > 0
          ? [{ number }, { serviceOrder: { number } }]
          : []),
      ],
    });
  }
  return filters.length ? { AND: filters } : {};
}

export const quoteRepository = {
  transaction<T>(operation: (transaction: QuoteTransaction) => Promise<T>) {
    return prisma.$transaction(operation, { isolationLevel: "Serializable" });
  },
  count(search: string, status?: Prisma.EnumQuoteStatusFilter["equals"]) {
    return prisma.quote.count({ where: listWhere(search, status) });
  },
  list(search: string, status: Prisma.EnumQuoteStatusFilter["equals"] | undefined, skip: number, take: number) {
    return prisma.quote.findMany({
      where: listWhere(search, status),
      select: quoteListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },
  findById(id: string) {
    return prisma.quote.findUnique({ where: { id }, select: quoteDetailSelect });
  },
  listForServiceOrder(serviceOrderId: string) {
    return prisma.quote.findMany({
      where: { serviceOrderId },
      select: quoteListSelect,
      orderBy: { version: "desc" },
    });
  },
  findByIdInTransaction(transaction: QuoteTransaction, id: string) {
    return transaction.quote.findUnique({ where: { id }, select: quoteDetailSelect });
  },
  findOrder(transaction: QuoteTransaction, id: string) {
    return transaction.serviceOrder.findUnique({
      where: { id },
      select: { id: true, number: true, status: true },
    });
  },
  findCatalogItems(transaction: QuoteTransaction, ids: string[]) {
    return transaction.serviceCatalogItem.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, name: true, defaultPrice: true },
    });
  },
  nextVersion(transaction: QuoteTransaction, serviceOrderId: string) {
    return transaction.quote.aggregate({
      where: { serviceOrderId },
      _max: { version: true },
    });
  },
  findApproved(transaction: QuoteTransaction, serviceOrderId: string, exceptId?: string) {
    return transaction.quote.findFirst({
      where: { serviceOrderId, status: "APPROVED", ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
  },
  create(transaction: QuoteTransaction, data: Prisma.QuoteCreateInput) {
    return transaction.quote.create({ data, select: quoteDetailSelect });
  },
  updateStatus(
    transaction: QuoteTransaction,
    id: string,
    expectedStatus: "DRAFT" | "SENT",
    data: Prisma.QuoteUpdateManyMutationInput,
  ) {
    return transaction.quote.updateMany({ where: { id, status: expectedStatus }, data });
  },
  updateOrderStatus(
    transaction: QuoteTransaction,
    id: string,
    previousStatuses: Prisma.ServiceOrderWhereInput["status"],
    status: "AWAITING_APPROVAL" | "APPROVED" | "QUOTE_REJECTED",
  ) {
    return transaction.serviceOrder.updateMany({ where: { id, status: previousStatuses }, data: { status } });
  },
  findTimelineEvent(transaction: QuoteTransaction, serviceOrderId: string, idempotencyKey: string) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: { serviceOrderId_idempotencyKey: { serviceOrderId, idempotencyKey } },
      select: { id: true, type: true, metadata: true },
    });
  },
  createTimelineEvent(transaction: QuoteTransaction, data: Prisma.ServiceOrderTimelineEventCreateManyInput) {
    return transaction.serviceOrderTimelineEvent.createMany({ data, skipDuplicates: true });
  },
};
