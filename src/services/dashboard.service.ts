import "server-only";

import type { ServiceOrderStatus } from "@/generated/prisma/enums";
import { dashboardRepository } from "@/repositories/dashboard.repository";

const openStatuses: ServiceOrderStatus[] = [
  "OPEN",
  "RECEIVED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "QUOTE_REJECTED",
  "APPROVED",
  "IN_PROGRESS",
  "WAITING_PART",
  "COMPLETED",
  "READY_FOR_PICKUP",
];

export const dashboardService = {
  async getOperationalData() {
    const snapshot = await dashboardRepository.getOperationalSnapshot();
    const counts = new Map(snapshot.distribution.map((item) => [item.status, item.count]));
    const count = (status: ServiceOrderStatus) => counts.get(status) ?? 0;
    return {
      metrics: {
        open: openStatuses.reduce((sum, status) => sum + count(status), 0),
        awaitingApproval: count("AWAITING_APPROVAL") + snapshot.awaitingApprovalQuotes,
        inProgress: count("IN_PROGRESS"),
        waitingPart: count("WAITING_PART"),
        readyForPickup: count("READY_FOR_PICKUP"),
      },
      recentOrders: snapshot.recentOrders,
      distribution: snapshot.distribution.map((item) => ({
        status: item.status,
        count: item.count,
      })),
      totalOrders: snapshot.distribution.reduce((sum, item) => sum + item.count, 0),
    };
  },
};
