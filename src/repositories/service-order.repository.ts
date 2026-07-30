import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const serviceOrderListSelect = {
  id: true,
  number: true,
  status: true,
  reportedProblem: true,
  receivedAt: true,
  createdAt: true,
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  equipment: {
    select: {
      id: true,
      type: true,
      brand: true,
      model: true,
    },
  },
} satisfies Prisma.ServiceOrderSelect;

const serviceOrderDetailSelect = {
  id: true,
  number: true,
  status: true,
  reportedProblem: true,
  receivedAccessories: true,
  generalNotes: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      document: true,
      phone: true,
      isActive: true,
    },
  },
  equipment: {
    select: {
      id: true,
      type: true,
      brand: true,
      model: true,
      serialNumber: true,
      color: true,
      isActive: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  timeline: {
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      occurredAt: true,
      metadata: true,
      responsibleUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  },
} satisfies Prisma.ServiceOrderSelect;

const mutationServiceOrderSelect = {
  id: true,
  number: true,
  customerId: true,
  equipmentId: true,
  status: true,
  reportedProblem: true,
  receivedAccessories: true,
  generalNotes: true,
  createdById: true,
} satisfies Prisma.ServiceOrderSelect;

export type ServiceOrderListItem = Prisma.ServiceOrderGetPayload<{
  select: typeof serviceOrderListSelect;
}>;

export type ServiceOrderDetail = Prisma.ServiceOrderGetPayload<{
  select: typeof serviceOrderDetailSelect;
}>;

export type ServiceOrderTransaction = Prisma.TransactionClient;

type CreateOrderPersistenceInput = {
  id: string;
  customerId: string;
  equipmentId: string;
  reportedProblem: string;
  receivedAccessories: string | null;
  generalNotes: string | null;
  createdById: string;
  occurredAt: Date;
  idempotencyKey: string;
};

type TimelinePersistenceInput = {
  serviceOrderId: string;
  type:
    | "EQUIPAMENTO_RECEBIDO"
    | "OBSERVACAO_ADICIONADA";
  title: string;
  description: string | null;
  responsibleUserId: string;
  occurredAt: Date;
  metadata?: Prisma.InputJsonValue;
  idempotencyKey: string;
};

function createSearchWhere(search: string): Prisma.ServiceOrderWhereInput {
  if (!search) {
    return {};
  }

  const numericSearch = Number(search.replace(/\D/g, ""));
  const filters: Prisma.ServiceOrderWhereInput[] = [
    {
      customer: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    },
    {
      equipment: {
        is: {
          OR: [
            { brand: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
            { serialNumber: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    },
  ];

  if (Number.isSafeInteger(numericSearch) && numericSearch > 0) {
    filters.push({ number: numericSearch });
  }

  return { OR: filters };
}

export const serviceOrderRepository = {
  transaction<T>(
    operation: (transaction: ServiceOrderTransaction) => Promise<T>,
  ) {
    return prisma.$transaction(operation);
  },

  count(search: string) {
    return prisma.serviceOrder.count({
      where: createSearchWhere(search),
    });
  },

  list(search: string, skip: number, take: number) {
    return prisma.serviceOrder.findMany({
      where: createSearchWhere(search),
      select: serviceOrderListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  },

  findById(id: string) {
    return prisma.serviceOrder.findUnique({
      where: { id },
      select: serviceOrderDetailSelect,
    });
  },

  findForMutation(transaction: ServiceOrderTransaction, id: string) {
    return transaction.serviceOrder.findUnique({
      where: { id },
      select: mutationServiceOrderSelect,
    });
  },

  findEquipmentForOrder(
    transaction: ServiceOrderTransaction,
    equipmentId: string,
  ) {
    return transaction.equipment.findUnique({
      where: { id: equipmentId },
      select: {
        id: true,
        customerId: true,
        isActive: true,
        customer: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });
  },

  createWithCreatedEvent(
    transaction: ServiceOrderTransaction,
    input: CreateOrderPersistenceInput,
  ) {
    return transaction.serviceOrder.create({
      data: {
        id: input.id,
        customerId: input.customerId,
        equipmentId: input.equipmentId,
        reportedProblem: input.reportedProblem,
        receivedAccessories: input.receivedAccessories,
        generalNotes: input.generalNotes,
        createdById: input.createdById,
        createdAt: input.occurredAt,
        timeline: {
          create: {
            type: "ORDEM_CRIADA",
            title: "Ordem de serviço criada",
            description: "Atendimento aberto e aguardando o recebimento.",
            responsibleUserId: input.createdById,
            occurredAt: input.occurredAt,
            createdAt: input.occurredAt,
            idempotencyKey: input.idempotencyKey,
          },
        },
      },
      select: mutationServiceOrderSelect,
    });
  },

  findTimelineEventByKey(
    transaction: ServiceOrderTransaction,
    serviceOrderId: string,
    idempotencyKey: string,
  ) {
    return transaction.serviceOrderTimelineEvent.findUnique({
      where: {
        serviceOrderId_idempotencyKey: {
          serviceOrderId,
          idempotencyKey,
        },
      },
      select: {
        id: true,
        type: true,
        description: true,
      },
    });
  },

  markAsReceived(
    transaction: ServiceOrderTransaction,
    serviceOrderId: string,
    occurredAt: Date,
  ) {
    return transaction.serviceOrder.updateMany({
      where: {
        id: serviceOrderId,
        status: "OPEN",
      },
      data: {
        status: "RECEIVED",
        receivedAt: occurredAt,
      },
    });
  },

  createTimelineEvent(
    transaction: ServiceOrderTransaction,
    input: TimelinePersistenceInput,
  ) {
    return transaction.serviceOrderTimelineEvent.createMany({
      data: input,
      skipDuplicates: true,
    });
  },
};
