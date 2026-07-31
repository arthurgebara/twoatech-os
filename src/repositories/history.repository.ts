import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ServiceOrderTimelineEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type HistoryFilters = {
  startAt?: Date;
  endAt?: Date;
  type?: ServiceOrderTimelineEventType;
  serviceOrderNumber?: number;
  userId?: string;
};

const select = {
  id: true,
  type: true,
  title: true,
  description: true,
  occurredAt: true,
  serviceOrder: {
    select: {
      id: true,
      number: true,
      customer: { select: { name: true } },
      equipment: { select: { brand: true, model: true, type: true } },
    },
  },
  responsibleUser: { select: { id: true, name: true } },
} satisfies Prisma.ServiceOrderTimelineEventSelect;

export type HistoryEvent = Prisma.ServiceOrderTimelineEventGetPayload<{ select: typeof select }>;

function where(filters: HistoryFilters): Prisma.ServiceOrderTimelineEventWhereInput {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.userId ? { responsibleUserId: filters.userId } : {}),
    ...(filters.serviceOrderNumber ? { serviceOrder: { number: filters.serviceOrderNumber } } : {}),
    ...(filters.startAt || filters.endAt
      ? { occurredAt: { ...(filters.startAt ? { gte: filters.startAt } : {}), ...(filters.endAt ? { lte: filters.endAt } : {}) } }
      : {}),
  };
}

export const historyRepository = {
  count(filters: HistoryFilters) {
    return prisma.serviceOrderTimelineEvent.count({ where: where(filters) });
  },
  list(filters: HistoryFilters, skip: number, take: number) {
    return prisma.serviceOrderTimelineEvent.findMany({
      where: where(filters),
      select,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    });
  },
  listUsers() {
    return prisma.user.findMany({
      where: { timelineEvents: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
};
