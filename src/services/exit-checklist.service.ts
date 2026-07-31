import "server-only";

import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { exitChecklistRepository } from "@/repositories/exit-checklist.repository";
import { saveExitChecklistSchema, type SaveExitChecklistInput } from "@/schemas/exit-checklist.schema";
import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export class ExitChecklistServiceError extends Error {
  constructor(message: string) { super(message); this.name = "ExitChecklistServiceError"; }
}

function requestHash(input: SaveExitChecklistInput, responsibleUserId: string) {
  return createHash("sha256").update(JSON.stringify({
    responsibleUserId,
    notes: input.notes,
    items: [...input.items].sort((a, b) => a.key.localeCompare(b.key)),
  })).digest("hex");
}

function metadataHash(metadata: Prisma.JsonValue | null) {
  return typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) && "requestHash" in metadata && typeof metadata.requestHash === "string"
    ? metadata.requestHash : null;
}

export const exitChecklistService = {
  async getForServiceOrder(serviceOrderId: string) {
    const parsed = serviceOrderIdSchema.safeParse(serviceOrderId);
    return parsed.success ? exitChecklistRepository.find(parsed.data) : null;
  },
  save(input: SaveExitChecklistInput, responsibleUserId: string) {
    const parsed = saveExitChecklistSchema.parse(input);
    const hash = requestHash(parsed, responsibleUserId);
    const eventKey = `exit-checklist:${parsed.idempotencyKey}`;
    return exitChecklistRepository.transaction(async (transaction) => {
      const order = await exitChecklistRepository.findOrder(transaction, parsed.serviceOrderId);
      if (!order) throw new ExitChecklistServiceError("Ordem de serviço não encontrada.");
      if (["DELIVERED", "CANCELED"].includes(order.status)) throw new ExitChecklistServiceError("Esta ordem não aceita alterações na checklist de saída.");
      const occurredAt = new Date();
      const checklist = await exitChecklistRepository.ensure(transaction, order.id, occurredAt);
      if (parsed.complete) {
        const existing = await exitChecklistRepository.findEvent(transaction, order.id, eventKey);
        if (existing) {
          if (existing.type !== "CHECKLIST_SAIDA_CONCLUIDO" || metadataHash(existing.metadata) !== hash) {
            throw new ExitChecklistServiceError("Esta operação já foi registrada com outro conteúdo.");
          }
          return checklist;
        }
      }
      if (checklist.status === "COMPLETED") throw new ExitChecklistServiceError("A checklist de saída já foi concluída.");
      await exitChecklistRepository.saveItems(transaction, checklist.id, parsed);
      if (!parsed.complete) {
        const saved = await exitChecklistRepository.findInTransaction(transaction, order.id);
        if (!saved) throw new ExitChecklistServiceError("Não foi possível carregar a checklist salva.");
        return saved;
      }
      if (order.status !== "COMPLETED") throw new ExitChecklistServiceError("Conclua o serviço antes de finalizar a checklist de saída.");
      if (parsed.items.some((item) => !item.checked)) throw new ExitChecklistServiceError("Marque todos os itens antes de concluir a checklist de saída.");
      const completion = await exitChecklistRepository.markCompleted(transaction, checklist.id, responsibleUserId, occurredAt);
      if (completion.count !== 1) throw new ExitChecklistServiceError("A checklist já foi concluída. Atualize a página.");
      const event = await exitChecklistRepository.createEvent(transaction, {
        serviceOrderId: order.id,
        type: "CHECKLIST_SAIDA_CONCLUIDO",
        title: "Checklist de saída concluída",
        description: "Conferência e testes finais concluídos.",
        responsibleUserId,
        occurredAt,
        createdAt: occurredAt,
        metadata: { requestHash: hash },
        idempotencyKey: eventKey,
      });
      if (event.count !== 1) throw new ExitChecklistServiceError("A conclusão já foi registrada.");
      const completed = await exitChecklistRepository.findInTransaction(transaction, order.id);
      if (!completed) throw new ExitChecklistServiceError("Não foi possível carregar a checklist concluída.");
      return completed;
    });
  },
};
