import "server-only";

import type { Prisma, ServiceOrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const diagnosticSelect = {
  id: true,
  serviceOrderId: true,
  description: true,
  technicalConclusion: true,
  recommendations: true,
  registeredAt: true,
  updatedAt: true,
  registeredBy: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.DiagnosticSelect;

export type DiagnosticDetail = Prisma.DiagnosticGetPayload<{
  select: typeof diagnosticSelect;
}>;

export type DiagnosticTransaction = Prisma.TransactionClient;

type SaveDiagnosticPersistenceInput = {
  serviceOrderId: string;
  description: string;
  technicalConclusion: string | null;
  recommendations: string | null;
  responsibleUserId: string;
  occurredAt: Date;
};

type CreateDiagnosticEventInput = {
  serviceOrderId: string;
  responsibleUserId: string;
  occurredAt: Date;
  previousStatus: ServiceOrderStatus;
  newStatus: ServiceOrderStatus;
  requestHash: string;
  idempotencyKey: string;
};

export const diagnosticRepository = {
  transaction<T>(
    operation: (transaction: DiagnosticTransaction) => Promise<T>,
  ) {
    return prisma.$transaction(operation);
  },

  findByServiceOrderId(serviceOrderId: string) {
    return prisma.diagnostic.findUnique({
      where: { serviceOrderId },
      select: diagnosticSelect,
    });
  },

  findOrder(transaction: DiagnosticTransaction, serviceOrderId: string) {
    return transaction.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: {
        id: true,
        number: true,
        status: true,
        checklists: {
          where: { type: "ENTRY" },
          select: { status: true },
          take: 1,
        },
      },
    });
  },

  findTimelineEventByKey(
    transaction: DiagnosticTransaction,
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
        metadata: true,
      },
    });
  },

  save(
    transaction: DiagnosticTransaction,
    input: SaveDiagnosticPersistenceInput,
  ) {
    return transaction.diagnostic.upsert({
      where: {
        serviceOrderId: input.serviceOrderId,
      },
      create: {
        serviceOrderId: input.serviceOrderId,
        description: input.description,
        technicalConclusion: input.technicalConclusion,
        recommendations: input.recommendations,
        registeredById: input.responsibleUserId,
        registeredAt: input.occurredAt,
        createdAt: input.occurredAt,
      },
      update: {
        description: input.description,
        technicalConclusion: input.technicalConclusion,
        recommendations: input.recommendations,
        registeredById: input.responsibleUserId,
        registeredAt: input.occurredAt,
      },
      select: diagnosticSelect,
    });
  },

  updateOrderStatus(
    transaction: DiagnosticTransaction,
    serviceOrderId: string,
    previousStatus: ServiceOrderStatus,
  ) {
    return transaction.serviceOrder.updateMany({
      where: {
        id: serviceOrderId,
        status: previousStatus,
      },
      data: {
        status: "DIAGNOSING",
      },
    });
  },

  createRegisteredEvent(
    transaction: DiagnosticTransaction,
    input: CreateDiagnosticEventInput,
  ) {
    return transaction.serviceOrderTimelineEvent.createMany({
      data: {
        serviceOrderId: input.serviceOrderId,
        type: "DIAGNOSTICO_REGISTRADO",
        title: "Diagnóstico registrado",
        description: "Diagnóstico técnico atualizado na ordem de serviço.",
        responsibleUserId: input.responsibleUserId,
        occurredAt: input.occurredAt,
        metadata: {
          previousStatus: input.previousStatus,
          newStatus: input.newStatus,
          requestHash: input.requestHash,
        },
        idempotencyKey: input.idempotencyKey,
      },
      skipDuplicates: true,
    });
  },
};
