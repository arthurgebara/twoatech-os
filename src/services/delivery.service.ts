import "server-only";

import type { ServiceOrderTimelineEventType } from "@/generated/prisma/enums";
import { deliveryRepository, type DeliveryTransaction } from "@/repositories/delivery.repository";
import { cancelServiceOrderSchema, deliveryCommandSchema, type CancelServiceOrderInput, type DeliveryCommandInput } from "@/schemas/delivery.schema";

export class DeliveryServiceError extends Error {
  constructor(message: string) { super(message); this.name = "DeliveryServiceError"; }
}

async function ensureIdempotency(
  transaction: DeliveryTransaction,
  serviceOrderId: string,
  eventKey: string,
  type: ServiceOrderTimelineEventType,
) {
  const existing = await deliveryRepository.findEvent(transaction, serviceOrderId, eventKey);
  if (existing && existing.type !== type) throw new DeliveryServiceError("Esta operação já foi utilizada com outra finalidade.");
  return existing;
}

export const deliveryService = {
  markReady(input: DeliveryCommandInput, responsibleUserId: string) {
    const parsed = deliveryCommandSchema.parse(input);
    return this.transition(parsed, responsibleUserId, "COMPLETED", "READY_FOR_PICKUP", "EQUIPAMENTO_PRONTO", "Equipamento pronto", "Equipamento liberado para retirada.");
  },
  deliver(input: DeliveryCommandInput, responsibleUserId: string) {
    const parsed = deliveryCommandSchema.parse(input);
    return this.transition(parsed, responsibleUserId, "READY_FOR_PICKUP", "DELIVERED", "EQUIPAMENTO_ENTREGUE", "Equipamento entregue", "Equipamento entregue ao cliente.");
  },
  transition(
    input: DeliveryCommandInput,
    responsibleUserId: string,
    previousStatus: "COMPLETED" | "READY_FOR_PICKUP",
    newStatus: "READY_FOR_PICKUP" | "DELIVERED",
    type: "EQUIPAMENTO_PRONTO" | "EQUIPAMENTO_ENTREGUE",
    title: string,
    description: string,
  ) {
    const eventKey = `delivery:${type.toLowerCase()}:${input.idempotencyKey}`;
    return deliveryRepository.transaction(async (transaction) => {
      const order = await deliveryRepository.findOrder(transaction, input.serviceOrderId);
      if (!order) throw new DeliveryServiceError("Ordem de serviço não encontrada.");
      const existing = await ensureIdempotency(transaction, order.id, eventKey, type);
      if (existing) return order;
      if (order.status !== previousStatus) throw new DeliveryServiceError("Esta ação não é permitida na situação atual.");
      if (type === "EQUIPAMENTO_PRONTO" && order.checklists[0]?.status !== "COMPLETED") {
        throw new DeliveryServiceError("Conclua a checklist de saída antes de marcar o equipamento como pronto.");
      }
      const occurredAt = new Date();
      const changed = await deliveryRepository.updateStatus(transaction, order.id, previousStatus, {
        status: newStatus,
        ...(newStatus === "DELIVERED" ? { deliveredAt: occurredAt } : {}),
      });
      if (changed.count !== 1) throw new DeliveryServiceError("A situação da ordem mudou. Atualize a página.");
      const event = await deliveryRepository.createEvent(transaction, {
        serviceOrderId: order.id,
        type,
        title,
        description,
        responsibleUserId,
        occurredAt,
        createdAt: occurredAt,
        metadata: { previousStatus, newStatus },
        idempotencyKey: eventKey,
      });
      if (event.count !== 1) throw new DeliveryServiceError("Esta ação já foi registrada.");
      return { ...order, status: newStatus, deliveredAt: newStatus === "DELIVERED" ? occurredAt : order.deliveredAt };
    });
  },
  cancel(input: CancelServiceOrderInput, responsibleUserId: string) {
    const parsed = cancelServiceOrderSchema.parse(input);
    const eventKey = `delivery:cancel:${parsed.idempotencyKey}`;
    return deliveryRepository.transaction(async (transaction) => {
      const order = await deliveryRepository.findOrder(transaction, parsed.serviceOrderId);
      if (!order) throw new DeliveryServiceError("Ordem de serviço não encontrada.");
      const existing = await ensureIdempotency(transaction, order.id, eventKey, "ORDEM_CANCELADA");
      if (existing) {
        if (existing.description !== parsed.reason) throw new DeliveryServiceError("Esta operação já foi registrada com outro motivo.");
        return order;
      }
      if (order.status === "DELIVERED") throw new DeliveryServiceError("Uma ordem entregue não pode ser cancelada.");
      if (order.status === "CANCELED") throw new DeliveryServiceError("Esta ordem já está cancelada.");
      const occurredAt = new Date();
      const changed = await deliveryRepository.updateStatus(transaction, order.id, { notIn: ["DELIVERED", "CANCELED"] }, { status: "CANCELED" });
      if (changed.count !== 1) throw new DeliveryServiceError("A situação da ordem mudou. Atualize a página.");
      const event = await deliveryRepository.createEvent(transaction, {
        serviceOrderId: order.id,
        type: "ORDEM_CANCELADA",
        title: "Ordem cancelada",
        description: parsed.reason,
        responsibleUserId,
        occurredAt,
        createdAt: occurredAt,
        metadata: { previousStatus: order.status, newStatus: "CANCELED", reason: parsed.reason },
        idempotencyKey: eventKey,
      });
      if (event.count !== 1) throw new DeliveryServiceError("O cancelamento já foi registrado.");
      return { ...order, status: "CANCELED" as const };
    });
  },
};
