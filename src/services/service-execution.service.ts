import "server-only";

import type { ServiceOrderStatus, ServiceOrderTimelineEventType } from "@/generated/prisma/enums";
import { serviceExecutionRepository } from "@/repositories/service-execution.repository";
import { serviceExecutionActionSchema, type ServiceExecutionActionInput } from "@/schemas/service-execution.schema";

type ExecutionCommand = "START" | "WAIT_PART" | "RECEIVE_PART" | "COMPLETE";
type ExecutionConfig = {
  previousStatus: "APPROVED" | "IN_PROGRESS" | "WAITING_PART";
  newStatus: "IN_PROGRESS" | "WAITING_PART" | "COMPLETED";
  event: ServiceOrderTimelineEventType;
  title: string;
  description: string;
};

const commandConfig: Record<ExecutionCommand, ExecutionConfig> = {
  START: {
    previousStatus: "APPROVED",
    newStatus: "IN_PROGRESS",
    event: "SERVICO_INICIADO",
    title: "Serviço iniciado",
    description: "A execução dos serviços aprovados foi iniciada.",
  },
  WAIT_PART: {
    previousStatus: "IN_PROGRESS",
    newStatus: "WAITING_PART",
    event: "AGUARDANDO_PECA",
    title: "Aguardando peça",
    description: "A execução foi pausada enquanto aguarda uma peça.",
  },
  RECEIVE_PART: {
    previousStatus: "WAITING_PART",
    newStatus: "IN_PROGRESS",
    event: "PECA_RECEBIDA",
    title: "Peça recebida",
    description: "A peça foi recebida e a execução do serviço retomada.",
  },
  COMPLETE: {
    previousStatus: "IN_PROGRESS",
    newStatus: "COMPLETED",
    event: "SERVICO_CONCLUIDO",
    title: "Serviço concluído",
    description: "A execução técnica dos serviços foi concluída.",
  },
};

export class ServiceExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceExecutionError";
  }
}

function statusName(status: ServiceOrderStatus) {
  return status.toLowerCase().replaceAll("_", " ");
}

export const serviceExecutionService = {
  execute(input: ServiceExecutionActionInput, responsibleUserId: string, command: ExecutionCommand) {
    const parsed = serviceExecutionActionSchema.parse(input);
    const config = commandConfig[command];
    const eventKey = `execution:${command.toLowerCase()}:${parsed.idempotencyKey}`;
    return serviceExecutionRepository.transaction(async (transaction) => {
      const order = await serviceExecutionRepository.findOrder(transaction, parsed.serviceOrderId);
      if (!order) throw new ServiceExecutionError("Ordem de serviço não encontrada.");
      if (command === "COMPLETE" && !order.serviceReport) {
        throw new ServiceExecutionError("Registre o relatório do serviço para concluir a execução.");
      }
      const existing = await serviceExecutionRepository.findEvent(transaction, order.id, eventKey);
      if (existing) {
        if (existing.type !== config.event) throw new ServiceExecutionError("Esta operação já foi usada com outra finalidade.");
        return order;
      }
      if (order.status !== config.previousStatus) {
        throw new ServiceExecutionError(`Esta ação não é permitida quando a ordem está em ${statusName(order.status)}.`);
      }
      const occurredAt = new Date();
      const changed = await serviceExecutionRepository.updateStatus(transaction, order.id, config.previousStatus, config.newStatus);
      if (changed.count !== 1) throw new ServiceExecutionError("A situação da ordem mudou. Atualize a página.");
      const event = await serviceExecutionRepository.createEvent(transaction, {
        serviceOrderId: order.id,
        type: config.event,
        title: config.title,
        description: config.description,
        responsibleUserId,
        occurredAt,
        createdAt: occurredAt,
        metadata: { previousStatus: config.previousStatus, newStatus: config.newStatus },
        idempotencyKey: eventKey,
      });
      if (event.count !== 1) throw new ServiceExecutionError("Esta ação já foi registrada. Atualize a página.");
      return { ...order, status: config.newStatus };
    });
  },
};
