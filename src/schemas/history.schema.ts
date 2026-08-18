import { z } from "zod";

import { ServiceOrderTimelineEventType } from "@/generated/prisma/enums";

const dateSchema = z.string().trim().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida.");

export const historyQuerySchema = z.object({
  startDate: dateSchema.default(""),
  endDate: dateSchema.default(""),
  type: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(ServiceOrderTimelineEventType).optional(),
  ),
  serviceOrder: z.string().trim().max(20).default(""),
  userId: z.string().trim().refine((value) => value === "" || z.string().uuid().safeParse(value).success, "Usuário inválido.").default(""),
  page: z.coerce.number().int().positive().default(1),
}).refine((input) => !input.startDate || !input.endDate || input.startDate <= input.endDate, {
  message: "A data inicial deve ser anterior à data final.",
  path: ["endDate"],
});

export const timelineEventTypeLabels: Record<ServiceOrderTimelineEventType, string> = {
  ORDEM_CRIADA: "Ordem criada",
  EQUIPAMENTO_RECEBIDO: "Equipamento recebido",
  CHECKLIST_ENTRADA_CONCLUIDO: "Checklist de entrada concluída",
  DIAGNOSTICO_REGISTRADO: "Diagnóstico registrado",
  ORCAMENTO_CRIADO: "Orçamento criado",
  ORCAMENTO_ENVIADO: "Orçamento enviado",
  ORCAMENTO_APROVADO: "Orçamento aprovado",
  ORCAMENTO_REJEITADO: "Orçamento rejeitado",
  SERVICO_INICIADO: "Serviço iniciado",
  AGUARDANDO_PECA: "Aguardando peça",
  PECA_RECEBIDA: "Peça recebida",
  RELATORIO_SERVICO_REGISTRADO: "Relatório do serviço registrado",
  SERVICO_CONCLUIDO: "Serviço concluído",
  CHECKLIST_SAIDA_CONCLUIDO: "Checklist de saída concluída",
  EQUIPAMENTO_PRONTO: "Equipamento pronto",
  EQUIPAMENTO_ENTREGUE: "Equipamento entregue",
  ORDEM_CANCELADA: "Ordem cancelada",
  OBSERVACAO_ADICIONADA: "Observação adicionada",
};
