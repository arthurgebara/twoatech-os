import "server-only";

import { prisma } from "@/lib/prisma";

export const dashboardRepository = {
  async getOperationalSnapshot() {
    const [distribution, recentOrders] = await prisma.$transaction([
      prisma.serviceOrder.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.serviceOrder.findMany({
        select: {
          id: true,
          number: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
          equipment: { select: { type: true, brand: true, model: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
    return {
      distribution: distribution.map((item) => ({
        status: item.status,
        count:
          typeof item._count === "object" && item._count !== null
            ? item._count._all ?? 0
            : 0,
      })),
      recentOrders,
    };
  },
};
