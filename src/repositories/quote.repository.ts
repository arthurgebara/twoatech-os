import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { entryChecklistItemDefinitions } from "@/schemas/entry-checklist.schema";

const quoteDetailSelect = {
  id: true,
  number: true,
  seriesId: true,
  version: true,
  status: true,
  reportedProblem: true,
  receivedAccessories: true,
  generalNotes: true,
  subtotal: true,
  discount: true,
  total: true,
  validUntil: true,
  notes: true,
  sentAt: true,
  approvedAt: true,
  rejectedAt: true,
  sentIdempotencyKey: true,
  decisionIdempotencyKey: true,
  createdAt: true,
  customer: { select: { id: true, name: true, document: true, phone: true, isActive: true } },
  equipment: { select: { id: true, customerId: true, type: true, brand: true, model: true, serialNumber: true, isActive: true } },
  serviceOrder: { select: { id: true, number: true, status: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    select: { id: true, type: true, description: true, quantity: true, unitPrice: true, total: true, position: true, serviceCatalogItemId: true },
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
  customer: { select: { id: true, name: true } },
  equipment: { select: { id: true, type: true, brand: true, model: true } },
  serviceOrder: { select: { id: true, number: true } },
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
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { equipment: { is: { OR: [
          { brand: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
          { serialNumber: { contains: search, mode: "insensitive" } },
        ] } } },
        ...(Number.isSafeInteger(number) && number > 0 ? [{ number }, { serviceOrder: { is: { number } } }] : []),
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
    return prisma.quote.findMany({ where: listWhere(search, status), select: quoteListSelect, orderBy: { createdAt: "desc" }, skip, take });
  },
  findById(id: string) {
    return prisma.quote.findUnique({ where: { id }, select: quoteDetailSelect });
  },
  listForServiceOrder(serviceOrderId: string) {
    return prisma.quote.findMany({ where: { serviceOrderId }, select: quoteListSelect, orderBy: { version: "desc" } });
  },
  findByIdInTransaction(transaction: QuoteTransaction, id: string) {
    return transaction.quote.findUnique({ where: { id }, select: quoteDetailSelect });
  },
  findEquipment(transaction: QuoteTransaction, equipmentId: string) {
    return transaction.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true, customerId: true, isActive: true, customer: { select: { id: true, isActive: true } } },
    });
  },
  findCatalogItems(transaction: QuoteTransaction, ids: string[]) {
    return transaction.serviceCatalogItem.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true, name: true, defaultPrice: true } });
  },
  nextVersion(transaction: QuoteTransaction, seriesId: string) {
    return transaction.quote.aggregate({ where: { seriesId }, _max: { version: true } });
  },
  findApproved(transaction: QuoteTransaction, seriesId: string, exceptId?: string) {
    return transaction.quote.findFirst({ where: { seriesId, status: "APPROVED", ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  },
  create(transaction: QuoteTransaction, data: Prisma.QuoteCreateInput) {
    return transaction.quote.create({ data, select: quoteDetailSelect });
  },
  updateStatus(transaction: QuoteTransaction, id: string, expectedStatus: "DRAFT" | "SENT", data: Prisma.QuoteUpdateManyMutationInput) {
    return transaction.quote.updateMany({ where: { id, status: expectedStatus }, data });
  },
  createOrderForApprovedQuote(transaction: QuoteTransaction, quote: QuoteDetail, orderId: string, responsibleUserId: string, occurredAt: Date, idempotencyKey: string) {
    return transaction.serviceOrder.create({
      data: {
        id: orderId,
        customerId: quote.customer.id,
        equipmentId: quote.equipment.id,
        status: "OPEN",
        reportedProblem: quote.reportedProblem,
        receivedAccessories: quote.receivedAccessories,
        generalNotes: quote.generalNotes,
        createdById: responsibleUserId,
        createdAt: occurredAt,
        checklists: {
          create: {
            type: "ENTRY",
            createdAt: occurredAt,
            items: { create: entryChecklistItemDefinitions.map((item, position) => ({ ...item, position, createdAt: occurredAt })) },
          },
        },
        timeline: {
          create: [
            {
              type: "ORDEM_CRIADA",
              title: "Ordem de serviço criada",
              description: `Ordem gerada automaticamente após a aprovação do orçamento #${quote.number}.`,
              responsibleUserId,
              occurredAt,
              createdAt: occurredAt,
              metadata: { quoteId: quote.id, quoteNumber: quote.number, previousStatus: null, newStatus: "OPEN" },
              idempotencyKey: `create-from-quote:${idempotencyKey}`,
            },
            {
              type: "ORCAMENTO_APROVADO",
              title: "Orçamento aprovado",
              description: `Orçamento #${quote.number}, versão ${quote.version}.`,
              responsibleUserId,
              occurredAt,
              createdAt: occurredAt,
              metadata: { quoteId: quote.id, quoteNumber: quote.number, version: quote.version, previousStatus: null, newStatus: "OPEN" },
              idempotencyKey: `quote-approved:${idempotencyKey}`,
            },
          ],
        },
      },
      select: { id: true, number: true, status: true },
    });
  },
  attachApprovedOrder(transaction: QuoteTransaction, quoteId: string, orderId: string, idempotencyKey: string, occurredAt: Date) {
    return transaction.quote.updateMany({
      where: { id: quoteId, status: "SENT", serviceOrderId: null },
      data: { status: "APPROVED", serviceOrderId: orderId, approvedAt: occurredAt, decisionIdempotencyKey: idempotencyKey },
    });
  },
  updateOrderStatus(
    transaction: QuoteTransaction,
    id: string,
    previousStatus: Prisma.ServiceOrderWhereInput["status"],
    status: "AWAITING_APPROVAL" | "APPROVED" | "QUOTE_REJECTED",
  ) {
    return transaction.serviceOrder.updateMany({ where: { id, status: previousStatus }, data: { status } });
  },
  findTimelineEvent(transaction: QuoteTransaction, serviceOrderId: string, idempotencyKey: string) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: { serviceOrderId_idempotencyKey: { serviceOrderId, idempotencyKey } },
      select: { id: true, type: true },
    });
  },
  createTimelineEvent(transaction: QuoteTransaction, data: Prisma.ServiceOrderTimelineEventCreateManyInput) {
    return transaction.serviceOrderTimelineEvent.createMany({ data, skipDuplicates: true });
  },
};
