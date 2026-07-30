import { z } from "zod";

import { ServiceOrderStatus } from "@/generated/prisma/enums";

export const serviceOrderIdSchema = z
  .string()
  .uuid("O identificador da ordem de serviço é inválido.");

const idempotencyKeySchema = z
  .string()
  .uuid("A chave da operação é inválida.");

export const createServiceOrderSchema = z.object({
  customerId: z.string().uuid("Selecione um cliente válido."),
  equipmentId: z.string().uuid("Selecione um equipamento válido."),
  reportedProblem: z
    .string()
    .trim()
    .min(5, "Descreva o problema relatado com pelo menos 5 caracteres.")
    .max(5000, "O problema relatado deve ter no máximo 5.000 caracteres."),
  receivedAccessories: z
    .string()
    .trim()
    .max(2000, "Os acessórios devem ter no máximo 2.000 caracteres."),
  generalNotes: z
    .string()
    .trim()
    .max(3000, "As observações devem ter no máximo 3.000 caracteres."),
  idempotencyKey: idempotencyKeySchema,
});

export const receiveEquipmentSchema = z.object({
  serviceOrderId: serviceOrderIdSchema,
  idempotencyKey: idempotencyKeySchema,
});

export const addServiceOrderObservationSchema = z.object({
  serviceOrderId: serviceOrderIdSchema,
  description: z
    .string()
    .trim()
    .min(2, "Escreva uma observação com pelo menos 2 caracteres.")
    .max(2000, "A observação deve ter no máximo 2.000 caracteres."),
  idempotencyKey: idempotencyKeySchema,
});

export const serviceOrderListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().positive().default(1),
});

export const serviceOrderStatusLabels: Record<ServiceOrderStatus, string> = {
  OPEN: "Aberta",
  RECEIVED: "Equipamento recebido",
  DIAGNOSING: "Em diagnóstico",
  AWAITING_APPROVAL: "Aguardando aprovação",
  QUOTE_REJECTED: "Orçamento rejeitado",
  APPROVED: "Aprovada",
  IN_PROGRESS: "Em execução",
  WAITING_PART: "Aguardando peça",
  COMPLETED: "Serviço concluído",
  READY_FOR_PICKUP: "Pronta para retirada",
  DELIVERED: "Entregue",
  CANCELED: "Cancelada",
};

export type CreateServiceOrderInput = z.infer<
  typeof createServiceOrderSchema
>;
export type CreateServiceOrderField = keyof CreateServiceOrderInput;
export type ReceiveEquipmentInput = z.infer<typeof receiveEquipmentSchema>;
export type AddServiceOrderObservationInput = z.infer<
  typeof addServiceOrderObservationSchema
>;

const createServiceOrderFields: CreateServiceOrderField[] = [
  "customerId",
  "equipmentId",
  "reportedProblem",
  "receivedAccessories",
  "generalNotes",
  "idempotencyKey",
];

export function isCreateServiceOrderField(
  value: PropertyKey,
): value is CreateServiceOrderField {
  return createServiceOrderFields.includes(value as CreateServiceOrderField);
}
