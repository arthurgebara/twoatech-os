import "server-only";

import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { serviceReportRepository } from "@/repositories/service-report.repository";
import { saveServiceReportSchema, type SaveServiceReportInput } from "@/schemas/service-report.schema";
import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export class ServiceReportError extends Error {
  constructor(message: string) { super(message); this.name = "ServiceReportError"; }
}

function nullable(value: string) { return value.trim() || null; }

function requestHash(input: SaveServiceReportInput, userId: string) {
  return createHash("sha256").update(JSON.stringify({ ...input, idempotencyKey: undefined, userId })).digest("hex");
}

function metadataHash(metadata: Prisma.JsonValue | null) {
  return typeof metadata === "object" && metadata !== null && !Array.isArray(metadata) && "requestHash" in metadata && typeof metadata.requestHash === "string" ? metadata.requestHash : null;
}

export const serviceReportService = {
  async getForServiceOrder(serviceOrderId: string) {
    const parsed = serviceOrderIdSchema.safeParse(serviceOrderId);
    return parsed.success ? serviceReportRepository.find(parsed.data) : null;
  },
  save(input: SaveServiceReportInput, responsibleUserId: string) {
    const parsed = saveServiceReportSchema.parse(input);
    const hash = requestHash(parsed, responsibleUserId);
    const reportEventKey = `service-report:${parsed.idempotencyKey}`;
    return serviceReportRepository.transaction(async (transaction) => {
      const order = await serviceReportRepository.findOrder(transaction, parsed.serviceOrderId);
      if (!order) throw new ServiceReportError("Ordem de serviço não encontrada.");
      const existingEvent = await serviceReportRepository.findEvent(transaction, order.id, reportEventKey);
      if (existingEvent) {
        if (existingEvent.type !== "RELATORIO_SERVICO_REGISTRADO" || metadataHash(existingEvent.metadata) !== hash) throw new ServiceReportError("Esta operação já foi usada com outro conteúdo.");
        const existingReport = await serviceReportRepository.find(order.id);
        if (!existingReport) throw new ServiceReportError("O relatório registrado não foi encontrado.");
        return existingReport;
      }
      if (order.serviceReport) throw new ServiceReportError("O relatório do serviço já foi concluído e não pode ser alterado.");
      if (order.status !== "IN_PROGRESS") throw new ServiceReportError("Inicie o serviço antes de registrar o relatório técnico.");
      const occurredAt = new Date();
      const report = await serviceReportRepository.create(transaction, {
        serviceOrder: { connect: { id: order.id } },
        workPerformed: parsed.workPerformed,
        partsUsed: nullable(parsed.partsUsed),
        testsPerformed: nullable(parsed.testsPerformed),
        notes: nullable(parsed.notes),
        registeredBy: { connect: { id: responsibleUserId } },
        registeredAt: occurredAt,
        createdAt: occurredAt,
      });
      const completed = await serviceReportRepository.completeOrder(transaction, order.id);
      if (completed.count !== 1) throw new ServiceReportError("A situação da ordem mudou. Atualize a página.");
      const events = await serviceReportRepository.createEvents(transaction, [
        {
          serviceOrderId: order.id,
          type: "RELATORIO_SERVICO_REGISTRADO",
          title: "Relatório do serviço registrado",
          description: "O trabalho executado e os testes técnicos foram documentados.",
          responsibleUserId,
          occurredAt,
          createdAt: occurredAt,
          metadata: { requestHash: hash, previousStatus: "IN_PROGRESS", newStatus: "COMPLETED" },
          idempotencyKey: reportEventKey,
        },
        {
          serviceOrderId: order.id,
          type: "SERVICO_CONCLUIDO",
          title: "Serviço concluído",
          description: "A execução técnica foi concluída com o registro do relatório.",
          responsibleUserId,
          occurredAt,
          createdAt: occurredAt,
          metadata: { previousStatus: "IN_PROGRESS", newStatus: "COMPLETED" },
          idempotencyKey: `service-completed:${parsed.idempotencyKey}`,
        },
      ]);
      if (events.count !== 2) throw new ServiceReportError("A conclusão do serviço já foi registrada.");
      return report;
    });
  },
};
