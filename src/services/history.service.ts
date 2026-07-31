import "server-only";

import { historyRepository, type HistoryFilters } from "@/repositories/history.repository";
import { historyQuerySchema } from "@/schemas/history.schema";

const EVENTS_PER_PAGE = 20;

function startOfBrazilianDay(value: string) {
  return value ? new Date(`${value}T03:00:00.000Z`) : undefined;
}

function endOfBrazilianDay(value: string) {
  return value ? new Date(`${value}T23:59:59.999-03:00`) : undefined;
}

export const historyService = {
  async list(input: {
    startDate?: string;
    endDate?: string;
    type?: string;
    serviceOrder?: string;
    userId?: string;
    page?: string | number;
  }) {
    const parsed = historyQuerySchema.parse(input);
    const number = Number(parsed.serviceOrder.replace(/\D/g, ""));
    const filters: HistoryFilters = {
      startAt: startOfBrazilianDay(parsed.startDate),
      endAt: endOfBrazilianDay(parsed.endDate),
      type: parsed.type,
      userId: parsed.userId || undefined,
      serviceOrderNumber: Number.isSafeInteger(number) && number > 0 ? number : undefined,
    };
    const [total, users] = await Promise.all([
      historyRepository.count(filters),
      historyRepository.listUsers(),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / EVENTS_PER_PAGE));
    const page = Math.min(parsed.page, totalPages);
    const events = await historyRepository.list(filters, (page - 1) * EVENTS_PER_PAGE, EVENTS_PER_PAGE);
    return { ...parsed, events, users, total, totalPages, page };
  },
};
