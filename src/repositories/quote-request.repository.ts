import "server-only";

import type { Prisma, QuoteRequestStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const select = { id: true, name: true, phone: true, email: true, equipmentType: true, equipmentDescription: true, reportedProblem: true, status: true, contactedAt: true, createdAt: true } satisfies Prisma.QuoteRequestSelect;
export type QuoteRequestListItem = Prisma.QuoteRequestGetPayload<{ select: typeof select }>;

export const quoteRequestRepository = {
  findRecentByPhone(phone: string, since: Date) { return prisma.quoteRequest.findFirst({ where: { phone, createdAt: { gte: since } }, select: { id: true } }); },
  create(data: Prisma.QuoteRequestCreateInput) { return prisma.quoteRequest.create({ data, select }); },
  async list(status?: QuoteRequestStatus) {
    const where = status ? { status } : {};
    const [requests, total] = await Promise.all([
      prisma.quoteRequest.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, select }),
      prisma.quoteRequest.count({ where }),
    ]);
    return { requests, total };
  },
  setStatus(id: string, status: QuoteRequestStatus, contactedAt: Date | null) {
    return prisma.quoteRequest.update({ where: { id }, data: { status, contactedAt }, select });
  },
};
