import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  entryChecklistItemDefinitions,
  type SaveEntryChecklistInput,
} from "@/schemas/entry-checklist.schema";

const entryChecklistSelect = {
  id: true,
  serviceOrderId: true,
  status: true,
  notes: true,
  completedAt: true,
  completedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  items: {
    select: {
      id: true,
      key: true,
      label: true,
      checked: true,
      notes: true,
      position: true,
    },
    orderBy: {
      position: "asc",
    },
  },
} satisfies Prisma.ServiceOrderChecklistSelect;

export type EntryChecklistDetail = Prisma.ServiceOrderChecklistGetPayload<{
  select: typeof entryChecklistSelect;
}>;

export type EntryChecklistTransaction = Prisma.TransactionClient;

type CompleteEntryChecklistInput = {
  checklistId: string;
  serviceOrderId: string;
  responsibleUserId: string;
  occurredAt: Date;
  idempotencyKey: string;
  requestHash: string;
};

export const entryChecklistRepository = {
  transaction<T>(
    operation: (transaction: EntryChecklistTransaction) => Promise<T>,
  ) {
    return prisma.$transaction(operation);
  },

  findByServiceOrderId(serviceOrderId: string) {
    return prisma.serviceOrderChecklist.findUnique({
      where: {
        serviceOrderId_type: {
          serviceOrderId,
          type: "ENTRY",
        },
      },
      select: entryChecklistSelect,
    });
  },

  findOrder(transaction: EntryChecklistTransaction, serviceOrderId: string) {
    return transaction.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: {
        id: true,
        number: true,
        status: true,
      },
    });
  },

  ensureEntryChecklist(
    transaction: EntryChecklistTransaction,
    serviceOrderId: string,
    occurredAt: Date,
  ) {
    return transaction.serviceOrderChecklist.upsert({
      where: {
        serviceOrderId_type: {
          serviceOrderId,
          type: "ENTRY",
        },
      },
      create: {
        serviceOrderId,
        type: "ENTRY",
        createdAt: occurredAt,
        items: {
          create: entryChecklistItemDefinitions.map((item, position) => ({
            key: item.key,
            label: item.label,
            position,
            createdAt: occurredAt,
          })),
        },
      },
      update: {},
      select: entryChecklistSelect,
    });
  },

  async saveItems(
    transaction: EntryChecklistTransaction,
    checklistId: string,
    input: SaveEntryChecklistInput,
  ) {
    const definitions = new Map(
      entryChecklistItemDefinitions.map((item, position) => [
        item.key,
        { ...item, position },
      ]),
    );

    await Promise.all(
      input.items.map((item) => {
        const definition = definitions.get(item.key);

        if (!definition) {
          throw new Error("Definição de checklist não encontrada.");
        }

        return transaction.checklistItem.upsert({
          where: {
            checklistId_key: {
              checklistId,
              key: item.key,
            },
          },
          create: {
            checklistId,
            key: definition.key,
            label: definition.label,
            position: definition.position,
            checked: item.checked,
            notes: item.notes || null,
          },
          update: {
            checked: item.checked,
            notes: item.notes || null,
          },
        });
      }),
    );

    return transaction.serviceOrderChecklist.update({
      where: { id: checklistId },
      data: {
        notes: input.notes || null,
      },
      select: entryChecklistSelect,
    });
  },

  markCompleted(
    transaction: EntryChecklistTransaction,
    input: CompleteEntryChecklistInput,
  ) {
    return transaction.serviceOrderChecklist.updateMany({
      where: {
        id: input.checklistId,
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
        completedAt: input.occurredAt,
        completedById: input.responsibleUserId,
      },
    });
  },

  markOrderReceived(
    transaction: EntryChecklistTransaction,
    serviceOrderId: string,
    occurredAt: Date,
  ) {
    return transaction.serviceOrder.updateMany({
      where: { id: serviceOrderId, status: "OPEN" },
      data: { status: "RECEIVED", receivedAt: occurredAt },
    });
  },

  createReceivedEvent(
    transaction: EntryChecklistTransaction,
    input: CompleteEntryChecklistInput,
  ) {
    return transaction.serviceOrderTimelineEvent.createMany({
      data: {
        serviceOrderId: input.serviceOrderId,
        type: "EQUIPAMENTO_RECEBIDO",
        title: "Equipamento recebido",
        description: "Recebimento confirmado junto com a checklist de entrada.",
        responsibleUserId: input.responsibleUserId,
        occurredAt: input.occurredAt,
        metadata: { previousStatus: "OPEN", newStatus: "RECEIVED" },
        idempotencyKey: `entry-receive:${input.idempotencyKey}`,
      },
      skipDuplicates: true,
    });
  },

  findTimelineEventByKey(
    transaction: EntryChecklistTransaction,
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

  createCompletedEvent(
    transaction: EntryChecklistTransaction,
    input: CompleteEntryChecklistInput,
  ) {
    return transaction.serviceOrderTimelineEvent.createMany({
      data: {
        serviceOrderId: input.serviceOrderId,
        type: "CHECKLIST_ENTRADA_CONCLUIDO",
        title: "Checklist de entrada concluída",
        description: "Conferência de entrada finalizada.",
        responsibleUserId: input.responsibleUserId,
        occurredAt: input.occurredAt,
        metadata: {
          requestHash: input.requestHash,
        },
        idempotencyKey: input.idempotencyKey,
      },
      skipDuplicates: true,
    });
  },

  findByServiceOrderIdInTransaction(
    transaction: EntryChecklistTransaction,
    serviceOrderId: string,
  ) {
    return transaction.serviceOrderChecklist.findUnique({
      where: {
        serviceOrderId_type: {
          serviceOrderId,
          type: "ENTRY",
        },
      },
      select: entryChecklistSelect,
    });
  },
};
