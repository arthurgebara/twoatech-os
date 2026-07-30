import "server-only";

import {
  serviceOrderRepository,
  type ServiceOrderTransaction,
} from "@/repositories/service-order.repository";
import {
  addServiceOrderObservationSchema,
  createServiceOrderSchema,
  receiveEquipmentSchema,
  serviceOrderIdSchema,
  serviceOrderListQuerySchema,
  type AddServiceOrderObservationInput,
  type CreateServiceOrderField,
  type CreateServiceOrderInput,
  type ReceiveEquipmentInput,
} from "@/schemas/service-order.schema";

const SERVICE_ORDERS_PER_PAGE = 10;

export class ServiceOrderServiceError extends Error {
  constructor(
    message: string,
    readonly field?: CreateServiceOrderField,
  ) {
    super(message);
    this.name = "ServiceOrderServiceError";
  }
}

function nullable(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

async function ensureValidOwnership(
  transaction: ServiceOrderTransaction,
  customerId: string,
  equipmentId: string,
) {
  const equipment = await serviceOrderRepository.findEquipmentForOrder(
    transaction,
    equipmentId,
  );

  if (!equipment) {
    throw new ServiceOrderServiceError(
      "O equipamento selecionado não foi encontrado.",
      "equipmentId",
    );
  }

  if (equipment.customerId !== customerId) {
    throw new ServiceOrderServiceError(
      "O equipamento selecionado não pertence ao cliente informado.",
      "equipmentId",
    );
  }

  if (!equipment.customer.isActive) {
    throw new ServiceOrderServiceError(
      "Não é possível abrir uma ordem para um cliente inativo.",
      "customerId",
    );
  }

  if (!equipment.isActive) {
    throw new ServiceOrderServiceError(
      "Não é possível abrir uma ordem para um equipamento inativo.",
      "equipmentId",
    );
  }
}

export const serviceOrderService = {
  async list(input: { search?: string; page?: string | number }) {
    const parsed = serviceOrderListQuerySchema.parse(input);
    const total = await serviceOrderRepository.count(parsed.search);
    const totalPages = Math.max(
      1,
      Math.ceil(total / SERVICE_ORDERS_PER_PAGE),
    );
    const page = Math.min(parsed.page, totalPages);
    const orders = await serviceOrderRepository.list(
      parsed.search,
      (page - 1) * SERVICE_ORDERS_PER_PAGE,
      SERVICE_ORDERS_PER_PAGE,
    );

    return {
      orders,
      search: parsed.search,
      page,
      total,
      totalPages,
    };
  },

  async getById(id: string) {
    const serviceOrderId = serviceOrderIdSchema.safeParse(id);

    if (!serviceOrderId.success) {
      return null;
    }

    return serviceOrderRepository.findById(serviceOrderId.data);
  },

  create(input: CreateServiceOrderInput, responsibleUserId: string) {
    const parsed = createServiceOrderSchema.parse(input);
    const receivedAccessories = nullable(parsed.receivedAccessories);
    const generalNotes = nullable(parsed.generalNotes);

    return serviceOrderRepository.transaction(async (transaction) => {
      const existingOrder = await serviceOrderRepository.findForMutation(
        transaction,
        parsed.idempotencyKey,
      );

      if (existingOrder) {
        const isSameRequest =
          existingOrder.customerId === parsed.customerId &&
          existingOrder.equipmentId === parsed.equipmentId &&
          existingOrder.reportedProblem === parsed.reportedProblem &&
          existingOrder.receivedAccessories === receivedAccessories &&
          existingOrder.generalNotes === generalNotes &&
          existingOrder.createdById === responsibleUserId;

        if (!isSameRequest) {
          throw new ServiceOrderServiceError(
            "Esta operação já foi utilizada para outra ordem. Atualize a página e tente novamente.",
          );
        }

        return existingOrder;
      }

      await ensureValidOwnership(
        transaction,
        parsed.customerId,
        parsed.equipmentId,
      );

      const occurredAt = new Date();

      return serviceOrderRepository.createWithCreatedEvent(transaction, {
        id: parsed.idempotencyKey,
        customerId: parsed.customerId,
        equipmentId: parsed.equipmentId,
        reportedProblem: parsed.reportedProblem,
        receivedAccessories,
        generalNotes,
        createdById: responsibleUserId,
        occurredAt,
        idempotencyKey: `create:${parsed.idempotencyKey}`,
      });
    });
  },

  receive(input: ReceiveEquipmentInput, responsibleUserId: string) {
    const parsed = receiveEquipmentSchema.parse(input);
    const eventKey = `receive:${parsed.idempotencyKey}`;

    return serviceOrderRepository.transaction(async (transaction) => {
      const existingEvent = await serviceOrderRepository.findTimelineEventByKey(
        transaction,
        parsed.serviceOrderId,
        eventKey,
      );
      const order = await serviceOrderRepository.findForMutation(
        transaction,
        parsed.serviceOrderId,
      );

      if (!order) {
        throw new ServiceOrderServiceError("Ordem de serviço não encontrada.");
      }

      if (existingEvent?.type === "EQUIPAMENTO_RECEBIDO") {
        return order;
      }

      if (existingEvent) {
        throw new ServiceOrderServiceError(
          "Esta operação já foi registrada com outra finalidade.",
        );
      }

      if (order.status !== "OPEN") {
        throw new ServiceOrderServiceError(
          "Somente ordens abertas podem registrar o recebimento do equipamento.",
        );
      }

      const occurredAt = new Date();
      const update = await serviceOrderRepository.markAsReceived(
        transaction,
        order.id,
        occurredAt,
      );

      if (update.count !== 1) {
        throw new ServiceOrderServiceError(
          "A situação da ordem mudou. Atualize a página e tente novamente.",
        );
      }

      const event = await serviceOrderRepository.createTimelineEvent(transaction, {
        serviceOrderId: order.id,
        type: "EQUIPAMENTO_RECEBIDO",
        title: "Equipamento recebido",
        description: "Equipamento recebido e registrado na assistência.",
        responsibleUserId,
        occurredAt,
        metadata: {
          previousStatus: "OPEN",
          newStatus: "RECEIVED",
        },
        idempotencyKey: eventKey,
      });

      if (event.count !== 1) {
        throw new ServiceOrderServiceError(
          "O recebimento já foi registrado. Atualize a página.",
        );
      }

      return {
        ...order,
        status: "RECEIVED" as const,
      };
    });
  },

  addObservation(
    input: AddServiceOrderObservationInput,
    responsibleUserId: string,
  ) {
    const parsed = addServiceOrderObservationSchema.parse(input);
    const eventKey = `observation:${parsed.idempotencyKey}`;

    return serviceOrderRepository.transaction(async (transaction) => {
      const order = await serviceOrderRepository.findForMutation(
        transaction,
        parsed.serviceOrderId,
      );

      if (!order) {
        throw new ServiceOrderServiceError("Ordem de serviço não encontrada.");
      }

      const existingEvent = await serviceOrderRepository.findTimelineEventByKey(
        transaction,
        order.id,
        eventKey,
      );

      if (existingEvent) {
        if (
          existingEvent.type !== "OBSERVACAO_ADICIONADA" ||
          existingEvent.description !== parsed.description
        ) {
          throw new ServiceOrderServiceError(
            "Esta operação já foi registrada com outro conteúdo.",
          );
        }

        return order;
      }

      const occurredAt = new Date();

      const event = await serviceOrderRepository.createTimelineEvent(transaction, {
        serviceOrderId: order.id,
        type: "OBSERVACAO_ADICIONADA",
        title: "Observação adicionada",
        description: parsed.description,
        responsibleUserId,
        occurredAt,
        idempotencyKey: eventKey,
      });

      if (event.count === 0) {
        const concurrentEvent =
          await serviceOrderRepository.findTimelineEventByKey(
            transaction,
            order.id,
            eventKey,
          );

        if (
          concurrentEvent?.type !== "OBSERVACAO_ADICIONADA" ||
          concurrentEvent.description !== parsed.description
        ) {
          throw new ServiceOrderServiceError(
            "Esta operação já foi registrada com outro conteúdo.",
          );
        }
      }

      return order;
    });
  },
};
