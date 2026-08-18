import "server-only";

import { createHash } from "node:crypto";

import type { Prisma, ServiceOrderStatus } from "@/generated/prisma/client";
import { diagnosticRepository } from "@/repositories/diagnostic.repository";
import {
  saveDiagnosticSchema,
  type SaveDiagnosticInput,
} from "@/schemas/diagnostic.schema";
import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export class DiagnosticServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagnosticServiceError";
  }
}

function nullable(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

function createRequestHash(input: SaveDiagnosticInput, responsibleUserId: string) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        responsibleUserId,
        description: input.description,
        technicalConclusion: input.technicalConclusion,
        recommendations: input.recommendations,
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

function nextStatus(status: ServiceOrderStatus, hasApprovedQuote: boolean): ServiceOrderStatus {
  if (status === "RECEIVED" && hasApprovedQuote) return "APPROVED";
  return status === "RECEIVED" || status === "QUOTE_REJECTED" ? "DIAGNOSING" : status;
}

export const diagnosticService = {
  async getForServiceOrder(serviceOrderId: string) {
    const parsedId = serviceOrderIdSchema.safeParse(serviceOrderId);

    if (!parsedId.success) {
      return null;
    }

    return diagnosticRepository.findByServiceOrderId(parsedId.data);
  },

  save(input: SaveDiagnosticInput, responsibleUserId: string) {
    const parsed = saveDiagnosticSchema.parse(input);
    const requestHash = createRequestHash(parsed, responsibleUserId);
    const eventKey = `diagnostic:${parsed.idempotencyKey}`;

    return diagnosticRepository.transaction(async (transaction) => {
      const order = await diagnosticRepository.findOrder(
        transaction,
        parsed.serviceOrderId,
      );

      if (!order) {
        throw new DiagnosticServiceError("Ordem de serviço não encontrada.");
      }
      if (!["RECEIVED", "DIAGNOSING", "QUOTE_REJECTED"].includes(order.status)) {
        throw new DiagnosticServiceError(
          "O diagnóstico não pode ser alterado na situação atual da ordem.",
        );
      }
      if (order.checklists[0]?.status !== "COMPLETED") {
        throw new DiagnosticServiceError(
          "Conclua a checklist de entrada antes de registrar o diagnóstico.",
        );
      }

      const existingEvent =
        await diagnosticRepository.findTimelineEventByKey(
          transaction,
          order.id,
          eventKey,
        );

      if (existingEvent) {
        if (
          existingEvent.type !== "DIAGNOSTICO_REGISTRADO" ||
          getRequestHash(existingEvent.metadata) !== requestHash
        ) {
          throw new DiagnosticServiceError(
            "Esta operação já foi registrada com outro conteúdo.",
          );
        }

        return order;
      }

      const occurredAt = new Date();
      const newStatus = nextStatus(order.status, order.quotes.length > 0);

      await diagnosticRepository.save(transaction, {
        serviceOrderId: order.id,
        description: parsed.description,
        technicalConclusion: nullable(parsed.technicalConclusion),
        recommendations: nullable(parsed.recommendations),
        responsibleUserId,
        occurredAt,
      });

      if (newStatus !== order.status) {
        const statusUpdate = await diagnosticRepository.updateOrderStatus(
          transaction,
          order.id,
          order.status,
          newStatus === "APPROVED" ? "APPROVED" : "DIAGNOSING",
        );

        if (statusUpdate.count !== 1) {
          throw new DiagnosticServiceError(
            "A situação da ordem mudou. Atualize a página e tente novamente.",
          );
        }
      }

      const event = await diagnosticRepository.createRegisteredEvent(
        transaction,
        {
          serviceOrderId: order.id,
          responsibleUserId,
          occurredAt,
          previousStatus: order.status,
          newStatus,
          requestHash,
          idempotencyKey: eventKey,
        },
      );

      if (event.count === 0) {
        const concurrentEvent =
          await diagnosticRepository.findTimelineEventByKey(
            transaction,
            order.id,
            eventKey,
          );

        if (
          concurrentEvent?.type !== "DIAGNOSTICO_REGISTRADO" ||
          getRequestHash(concurrentEvent.metadata) !== requestHash
        ) {
          throw new DiagnosticServiceError(
            "Esta operação já foi registrada com outro conteúdo.",
          );
        }
      }

      return {
        ...order,
        status: newStatus,
      };
    });
  },
};
