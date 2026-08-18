import "server-only";

import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import {
  entryChecklistRepository,
  type EntryChecklistTransaction,
} from "@/repositories/entry-checklist.repository";
import {
  saveEntryChecklistSchema,
  type SaveEntryChecklistInput,
} from "@/schemas/entry-checklist.schema";
import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export class EntryChecklistServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EntryChecklistServiceError";
  }
}

function createRequestHash(
  input: SaveEntryChecklistInput,
  responsibleUserId: string,
) {
  const normalizedItems = [...input.items].sort((first, second) =>
    first.key.localeCompare(second.key),
  );

  return createHash("sha256")
    .update(
      JSON.stringify({
        responsibleUserId,
        notes: input.notes,
        items: normalizedItems,
      }),
    )
    .digest("hex");
}

function getRequestHash(metadata: Prisma.JsonValue | null) {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata) ||
    !("requestHash" in metadata)
  ) {
    return null;
  }

  return typeof metadata.requestHash === "string"
    ? metadata.requestHash
    : null;
}

async function ensureOrderExists(
  transaction: EntryChecklistTransaction,
  serviceOrderId: string,
) {
  const order = await entryChecklistRepository.findOrder(
    transaction,
    serviceOrderId,
  );

  if (!order) {
    throw new EntryChecklistServiceError("Ordem de serviço não encontrada.");
  }

  return order;
}

export const entryChecklistService = {
  async getForServiceOrder(serviceOrderId: string) {
    const parsedId = serviceOrderIdSchema.safeParse(serviceOrderId);

    if (!parsedId.success) {
      return null;
    }

    return entryChecklistRepository.findByServiceOrderId(parsedId.data);
  },

  save(input: SaveEntryChecklistInput, responsibleUserId: string) {
    const parsed = saveEntryChecklistSchema.parse(input);
    const requestHash = createRequestHash(parsed, responsibleUserId);
    const eventKey = `entry-checklist:${parsed.idempotencyKey}`;

    return entryChecklistRepository.transaction(async (transaction) => {
      const order = await ensureOrderExists(transaction, parsed.serviceOrderId);
      const occurredAt = new Date();
      const checklist = await entryChecklistRepository.ensureEntryChecklist(
        transaction,
        parsed.serviceOrderId,
        occurredAt,
      );

      if (parsed.complete) {
        const existingEvent =
          await entryChecklistRepository.findTimelineEventByKey(
            transaction,
            parsed.serviceOrderId,
            eventKey,
          );

        if (existingEvent) {
          if (
            existingEvent.type !== "CHECKLIST_ENTRADA_CONCLUIDO" ||
            getRequestHash(existingEvent.metadata) !== requestHash
          ) {
            throw new EntryChecklistServiceError(
              "Esta operação já foi registrada com outro conteúdo.",
            );
          }

          return checklist;
        }
      }

      if (checklist.status === "COMPLETED") {
        throw new EntryChecklistServiceError(
          "A checklist de entrada já foi concluída e não pode ser alterada.",
        );
      }

      await entryChecklistRepository.saveItems(
        transaction,
        checklist.id,
        parsed,
      );

      if (!parsed.complete) {
        const saved =
          await entryChecklistRepository.findByServiceOrderIdInTransaction(
            transaction,
            parsed.serviceOrderId,
          );

        if (!saved) {
          throw new EntryChecklistServiceError(
            "Não foi possível carregar a checklist salva.",
          );
        }

        return saved;
      }

      if (!["OPEN", "RECEIVED"].includes(order.status)) {
        throw new EntryChecklistServiceError(
          "A checklist de entrada não pode ser concluída na situação atual da ordem.",
        );
      }

      if (order.status === "OPEN") {
        const received = await entryChecklistRepository.markOrderReceived(
          transaction,
          order.id,
          occurredAt,
        );
        if (received.count !== 1) {
          throw new EntryChecklistServiceError("A situação da ordem mudou. Atualize a página.");
        }
        const receivedEvent = await entryChecklistRepository.createReceivedEvent(
          transaction,
          {
            checklistId: checklist.id,
            serviceOrderId: order.id,
            responsibleUserId,
            occurredAt,
            idempotencyKey: parsed.idempotencyKey,
            requestHash,
          },
        );
        if (receivedEvent.count !== 1) {
          throw new EntryChecklistServiceError("O recebimento já foi registrado.");
        }
      }

      const completion = await entryChecklistRepository.markCompleted(
        transaction,
        {
          checklistId: checklist.id,
          serviceOrderId: parsed.serviceOrderId,
          responsibleUserId,
          occurredAt,
          idempotencyKey: eventKey,
          requestHash,
        },
      );

      if (completion.count !== 1) {
        throw new EntryChecklistServiceError(
          "A checklist já foi concluída. Atualize a página.",
        );
      }

      const event = await entryChecklistRepository.createCompletedEvent(
        transaction,
        {
          checklistId: checklist.id,
          serviceOrderId: parsed.serviceOrderId,
          responsibleUserId,
          occurredAt,
          idempotencyKey: eventKey,
          requestHash,
        },
      );

      if (event.count !== 1) {
        throw new EntryChecklistServiceError(
          "A conclusão já foi registrada. Atualize a página.",
        );
      }

      const completed =
        await entryChecklistRepository.findByServiceOrderIdInTransaction(
          transaction,
          parsed.serviceOrderId,
        );

      if (!completed) {
        throw new EntryChecklistServiceError(
          "Não foi possível carregar a checklist concluída.",
        );
      }

      return completed;
    });
  },
};
