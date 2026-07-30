import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { quoteRepository, type QuoteTransaction } from "@/repositories/quote.repository";
import { parseBrlValue } from "@/schemas/service-catalog.schema";
import {
  createQuoteSchema,
  parseQuoteQuantity,
  quoteIdSchema,
  quoteListQuerySchema,
  quoteMutationSchema,
  type CreateQuoteInput,
  type QuoteMutationInput,
} from "@/schemas/quote.schema";

const QUOTES_PER_PAGE = 10;

export class QuoteServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteServiceError";
  }
}

function nullable(value: string) {
  return value.trim() || null;
}

function parseDate(value: string) {
  return value ? new Date(`${value}T12:00:00.000Z`) : null;
}

async function ensureNewEvent(
  transaction: QuoteTransaction,
  serviceOrderId: string,
  eventKey: string,
  expectedType: "ORCAMENTO_CRIADO" | "ORCAMENTO_ENVIADO" | "ORCAMENTO_APROVADO" | "ORCAMENTO_REJEITADO",
) {
  const existing = await quoteRepository.findTimelineEvent(transaction, serviceOrderId, eventKey);
  if (existing && existing.type !== expectedType) {
    throw new QuoteServiceError("Esta operação já foi utilizada com outra finalidade.");
  }
  return existing;
}

export const quoteService = {
  async list(input: { search?: string; status?: string; page?: string | number }) {
    const parsed = quoteListQuerySchema.parse(input);
    const total = await quoteRepository.count(parsed.search, parsed.status);
    const totalPages = Math.max(1, Math.ceil(total / QUOTES_PER_PAGE));
    const page = Math.min(parsed.page, totalPages);
    const quotes = await quoteRepository.list(parsed.search, parsed.status, (page - 1) * QUOTES_PER_PAGE, QUOTES_PER_PAGE);
    return { quotes, ...parsed, page, total, totalPages };
  },
  async getById(id: string) {
    const parsed = quoteIdSchema.safeParse(id);
    return parsed.success ? quoteRepository.findById(parsed.data) : null;
  },
  listForServiceOrder(serviceOrderId: string) {
    const parsed = quoteIdSchema.parse(serviceOrderId);
    return quoteRepository.listForServiceOrder(parsed);
  },
  create(input: CreateQuoteInput, responsibleUserId: string) {
    const parsed = createQuoteSchema.parse(input);
    const eventKey = `quote:create:${parsed.idempotencyKey}`;
    return quoteRepository.transaction(async (transaction) => {
      const existingQuote = await quoteRepository.findByIdInTransaction(transaction, parsed.idempotencyKey);
      if (existingQuote) {
        if (existingQuote.serviceOrder.id !== parsed.serviceOrderId || existingQuote.createdBy.id !== responsibleUserId) {
          throw new QuoteServiceError("Esta operação já foi utilizada para outro orçamento.");
        }
        return existingQuote;
      }
      const order = await quoteRepository.findOrder(transaction, parsed.serviceOrderId);
      if (!order) throw new QuoteServiceError("Ordem de serviço não encontrada.");
      if (["DELIVERED", "CANCELED"].includes(order.status)) {
        throw new QuoteServiceError("Não é possível criar orçamento para esta ordem.");
      }
      const catalogIds = [...new Set(parsed.items.map((item) => item.serviceCatalogItemId).filter(Boolean))];
      const catalogItems = await quoteRepository.findCatalogItems(transaction, catalogIds);
      if (catalogItems.length !== catalogIds.length) {
        throw new QuoteServiceError("Um serviço do catálogo não existe ou está inativo.");
      }
      const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
      const items = parsed.items.map((item, position) => {
        const catalog = item.serviceCatalogItemId ? catalogById.get(item.serviceCatalogItemId) : undefined;
        const unitPrice = new Prisma.Decimal(catalog ? catalog.defaultPrice : (parseBrlValue(item.unitPrice) ?? "0"));
        const quantity = new Prisma.Decimal(parseQuoteQuantity(item.quantity));
        const total = quantity.mul(unitPrice).toDecimalPlaces(2);
        return {
          type: item.type,
          serviceCatalogItemId: catalog?.id,
          description: catalog?.name ?? item.description,
          quantity,
          unitPrice,
          total,
          position,
        };
      });
      const subtotal = items.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));
      const discount = new Prisma.Decimal(parseBrlValue(parsed.discount) ?? "0");
      if (discount.greaterThan(subtotal)) throw new QuoteServiceError("O desconto não pode superar o subtotal.");
      const version = ((await quoteRepository.nextVersion(transaction, order.id))._max.version ?? 0) + 1;
      const occurredAt = new Date();
      await ensureNewEvent(transaction, order.id, eventKey, "ORCAMENTO_CRIADO");
      const quote = await quoteRepository.create(transaction, {
        id: parsed.idempotencyKey,
        serviceOrder: { connect: { id: order.id } },
        version,
        subtotal,
        discount,
        total: subtotal.sub(discount),
        validUntil: parseDate(parsed.validUntil),
        notes: nullable(parsed.notes),
        createdBy: { connect: { id: responsibleUserId } },
        createdAt: occurredAt,
        items: { create: items },
      });
      await quoteRepository.createTimelineEvent(transaction, {
        serviceOrderId: order.id,
        type: "ORCAMENTO_CRIADO",
        title: `Orçamento v${version} criado`,
        description: `Orçamento #${quote.number} criado em rascunho.`,
        responsibleUserId,
        occurredAt,
        createdAt: occurredAt,
        metadata: { quoteId: quote.id, quoteNumber: quote.number, version, total: quote.total.toFixed(2) },
        idempotencyKey: eventKey,
      });
      return quote;
    });
  },
  send(input: QuoteMutationInput, responsibleUserId: string) {
    return this.changeStatus(input, responsibleUserId, "SENT");
  },
  approve(input: QuoteMutationInput, responsibleUserId: string) {
    return this.changeStatus(input, responsibleUserId, "APPROVED");
  },
  reject(input: QuoteMutationInput, responsibleUserId: string) {
    return this.changeStatus(input, responsibleUserId, "REJECTED");
  },
  changeStatus(input: QuoteMutationInput, responsibleUserId: string, target: "SENT" | "APPROVED" | "REJECTED") {
    const parsed = quoteMutationSchema.parse(input);
    const eventKey = `quote:${target.toLowerCase()}:${parsed.idempotencyKey}`;
    const config = {
      SENT: { from: "DRAFT" as const, orderStatus: "AWAITING_APPROVAL" as const, event: "ORCAMENTO_ENVIADO" as const, title: "Orçamento enviado" },
      APPROVED: { from: "SENT" as const, orderStatus: "APPROVED" as const, event: "ORCAMENTO_APROVADO" as const, title: "Orçamento aprovado" },
      REJECTED: { from: "SENT" as const, orderStatus: "QUOTE_REJECTED" as const, event: "ORCAMENTO_REJEITADO" as const, title: "Orçamento rejeitado" },
    }[target];
    return quoteRepository.transaction(async (transaction) => {
      const quote = await quoteRepository.findByIdInTransaction(transaction, parsed.quoteId);
      if (!quote) throw new QuoteServiceError("Orçamento não encontrado.");
      const existing = await ensureNewEvent(transaction, quote.serviceOrder.id, eventKey, config.event);
      if (existing) return quote;
      if (quote.status !== config.from) throw new QuoteServiceError(`Este orçamento não pode ser alterado para ${target.toLowerCase()}.`);
      if (target === "APPROVED" && await quoteRepository.findApproved(transaction, quote.serviceOrder.id, quote.id)) {
        throw new QuoteServiceError("Já existe um orçamento aprovado para esta ordem.");
      }
      const occurredAt = new Date();
      const changed = await quoteRepository.updateStatus(transaction, quote.id, config.from, {
        status: target,
        ...(target === "SENT" ? { sentAt: occurredAt } : {}),
        ...(target === "APPROVED" ? { approvedAt: occurredAt } : {}),
        ...(target === "REJECTED" ? { rejectedAt: occurredAt } : {}),
      });
      if (changed.count !== 1) throw new QuoteServiceError("O orçamento mudou. Atualize a página.");
      const previousStatus = quote.serviceOrder.status;
      const orderChanged = await quoteRepository.updateOrderStatus(transaction, quote.serviceOrder.id, previousStatus, config.orderStatus);
      if (orderChanged.count !== 1) throw new QuoteServiceError("A situação da ordem mudou. Atualize a página.");
      await quoteRepository.createTimelineEvent(transaction, {
        serviceOrderId: quote.serviceOrder.id,
        type: config.event,
        title: config.title,
        description: `Orçamento #${quote.number}, versão ${quote.version}.`,
        responsibleUserId,
        occurredAt,
        createdAt: occurredAt,
        metadata: {
          quoteId: quote.id,
          quoteNumber: quote.number,
          version: quote.version,
          previousStatus,
          newStatus: config.orderStatus,
        },
        idempotencyKey: eventKey,
      });
      return { ...quote, status: target, serviceOrder: { ...quote.serviceOrder, status: config.orderStatus } };
    });
  },
};
