import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { quoteRepository, type QuoteDetail, type QuoteTransaction } from "@/repositories/quote.repository";
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

async function validateEquipment(transaction: QuoteTransaction, customerId: string, equipmentId: string) {
  const equipment = await quoteRepository.findEquipment(transaction, equipmentId);
  if (!equipment) throw new QuoteServiceError("O equipamento selecionado não foi encontrado.");
  if (equipment.customerId !== customerId) throw new QuoteServiceError("O equipamento selecionado não pertence ao cliente informado.");
  if (!equipment.customer.isActive) throw new QuoteServiceError("Selecione um cliente ativo.");
  if (!equipment.isActive) throw new QuoteServiceError("Selecione um equipamento ativo.");
}

async function calculateItems(transaction: QuoteTransaction, input: CreateQuoteInput) {
  const catalogIds = [...new Set(input.items.map((item) => item.serviceCatalogItemId).filter(Boolean))];
  const catalogItems = await quoteRepository.findCatalogItems(transaction, catalogIds);
  if (catalogItems.length !== catalogIds.length) throw new QuoteServiceError("Um serviço do catálogo não existe ou está inativo.");
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]));
  return input.items.map((item, position) => {
    const catalog = item.serviceCatalogItemId ? catalogById.get(item.serviceCatalogItemId) : undefined;
    const unitPrice = new Prisma.Decimal(catalog ? catalog.defaultPrice : (parseBrlValue(item.unitPrice) ?? "0"));
    const quantity = new Prisma.Decimal(parseQuoteQuantity(item.quantity));
    return {
      type: item.type,
      serviceCatalogItemId: catalog?.id,
      description: catalog?.name ?? item.description,
      quantity,
      unitPrice,
      total: quantity.mul(unitPrice).toDecimalPlaces(2),
      position,
    };
  });
}

async function mutateLegacyOrder(
  transaction: QuoteTransaction,
  quote: QuoteDetail,
  responsibleUserId: string,
  target: "SENT" | "APPROVED" | "REJECTED",
  idempotencyKey: string,
  occurredAt: Date,
) {
  if (!quote.serviceOrder) return;
  const config = {
    SENT: { previous: ["DIAGNOSING", "QUOTE_REJECTED"], next: "AWAITING_APPROVAL" as const, event: "ORCAMENTO_ENVIADO" as const, title: "Orçamento enviado" },
    APPROVED: { previous: ["AWAITING_APPROVAL"], next: "APPROVED" as const, event: "ORCAMENTO_APROVADO" as const, title: "Orçamento aprovado" },
    REJECTED: { previous: ["AWAITING_APPROVAL"], next: "QUOTE_REJECTED" as const, event: "ORCAMENTO_REJEITADO" as const, title: "Orçamento rejeitado" },
  }[target];
  if (!config.previous.includes(quote.serviceOrder.status)) {
    throw new QuoteServiceError("A situação atual da ordem não permite esta ação no orçamento.");
  }
  const changed = await quoteRepository.updateOrderStatus(transaction, quote.serviceOrder.id, quote.serviceOrder.status, config.next);
  if (changed.count !== 1) throw new QuoteServiceError("A situação da ordem mudou. Atualize a página.");
  const event = await quoteRepository.createTimelineEvent(transaction, {
    serviceOrderId: quote.serviceOrder.id,
    type: config.event,
    title: config.title,
    description: `Orçamento #${quote.number}, versão ${quote.version}.`,
    responsibleUserId,
    occurredAt,
    createdAt: occurredAt,
    metadata: { quoteId: quote.id, quoteNumber: quote.number, version: quote.version, previousStatus: quote.serviceOrder.status, newStatus: config.next },
    idempotencyKey: `quote:${target.toLowerCase()}:${idempotencyKey}`,
  });
  if (event.count !== 1) throw new QuoteServiceError("Esta alteração já foi registrada.");
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
    return quoteRepository.transaction(async (transaction) => {
      const existing = await quoteRepository.findByIdInTransaction(transaction, parsed.idempotencyKey);
      if (existing) {
        if (existing.customer.id !== parsed.customerId || existing.equipment.id !== parsed.equipmentId || existing.createdBy.id !== responsibleUserId) {
          throw new QuoteServiceError("Esta operação já foi utilizada para outro orçamento.");
        }
        return existing;
      }
      const sourceQuote = parsed.revisionOfQuoteId
        ? await quoteRepository.findByIdInTransaction(transaction, parsed.revisionOfQuoteId)
        : null;
      if (parsed.revisionOfQuoteId && !sourceQuote) throw new QuoteServiceError("O orçamento original não foi encontrado.");
      if (sourceQuote && sourceQuote.status !== "REJECTED") throw new QuoteServiceError("Somente um orçamento rejeitado pode receber uma nova versão.");
      if (sourceQuote && (sourceQuote.customer.id !== parsed.customerId || sourceQuote.equipment.id !== parsed.equipmentId)) {
        throw new QuoteServiceError("Cliente e equipamento não podem ser alterados entre versões do orçamento.");
      }
      await validateEquipment(transaction, parsed.customerId, parsed.equipmentId);
      const items = await calculateItems(transaction, parsed);
      const subtotal = items.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));
      const discount = new Prisma.Decimal(parseBrlValue(parsed.discount) ?? "0");
      if (discount.greaterThan(subtotal)) throw new QuoteServiceError("O desconto não pode superar o subtotal.");
      const occurredAt = new Date();
      const seriesId = sourceQuote?.seriesId ?? parsed.idempotencyKey;
      const version = sourceQuote
        ? ((await quoteRepository.nextVersion(transaction, seriesId))._max.version ?? 0) + 1
        : 1;
      return quoteRepository.create(transaction, {
        id: parsed.idempotencyKey,
        seriesId,
        customer: { connect: { id: parsed.customerId } },
        equipment: { connect: { id: parsed.equipmentId } },
        reportedProblem: parsed.reportedProblem,
        receivedAccessories: nullable(parsed.receivedAccessories),
        generalNotes: nullable(parsed.generalNotes),
        ...(sourceQuote?.serviceOrder ? { serviceOrder: { connect: { id: sourceQuote.serviceOrder.id } } } : {}),
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
    return quoteRepository.transaction(async (transaction) => {
      const quote = await quoteRepository.findByIdInTransaction(transaction, parsed.quoteId);
      if (!quote) throw new QuoteServiceError("Orçamento não encontrado.");
      const storedKey = target === "SENT" ? quote.sentIdempotencyKey : quote.decisionIdempotencyKey;
      if (quote.status === target && storedKey === parsed.idempotencyKey) return quote;
      const expected = target === "SENT" ? "DRAFT" : "SENT";
      if (quote.status !== expected) throw new QuoteServiceError("Este orçamento não permite essa alteração agora.");
      if (target === "APPROVED" && await quoteRepository.findApproved(transaction, quote.seriesId, quote.id)) {
        throw new QuoteServiceError("Já existe um orçamento aprovado para este atendimento.");
      }
      await validateEquipment(transaction, quote.customer.id, quote.equipment.id);
      const occurredAt = new Date();
      if (target === "APPROVED" && !quote.serviceOrder) {
        const order = await quoteRepository.createOrderForApprovedQuote(transaction, quote, parsed.idempotencyKey, responsibleUserId, occurredAt, parsed.idempotencyKey);
        const changed = await quoteRepository.attachApprovedOrder(transaction, quote.id, order.id, parsed.idempotencyKey, occurredAt);
        if (changed.count !== 1) throw new QuoteServiceError("O orçamento mudou. Atualize a página.");
      } else {
        await mutateLegacyOrder(transaction, quote, responsibleUserId, target, parsed.idempotencyKey, occurredAt);
        const changed = await quoteRepository.updateStatus(transaction, quote.id, expected, {
          status: target,
          ...(target === "SENT" ? { sentAt: occurredAt, sentIdempotencyKey: parsed.idempotencyKey } : {}),
          ...(target === "APPROVED" ? { approvedAt: occurredAt, decisionIdempotencyKey: parsed.idempotencyKey } : {}),
          ...(target === "REJECTED" ? { rejectedAt: occurredAt, decisionIdempotencyKey: parsed.idempotencyKey } : {}),
        });
        if (changed.count !== 1) throw new QuoteServiceError("O orçamento mudou. Atualize a página.");
      }
      const updated = await quoteRepository.findByIdInTransaction(transaction, quote.id);
      if (!updated) throw new QuoteServiceError("Não foi possível carregar o orçamento atualizado.");
      return updated;
    });
  },
};
