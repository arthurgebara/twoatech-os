import { z } from "zod";

export const deliveryCommandSchema = z.object({
  serviceOrderId: z.string().uuid("Ordem de serviço inválida."),
  idempotencyKey: z.string().uuid("Chave da operação inválida."),
});

export const cancelServiceOrderSchema = deliveryCommandSchema.extend({
  reason: z.string().trim().min(5, "Informe o motivo do cancelamento.").max(1000, "O motivo deve ter no máximo 1.000 caracteres."),
});

export type DeliveryCommandInput = z.infer<typeof deliveryCommandSchema>;
export type CancelServiceOrderInput = z.infer<typeof cancelServiceOrderSchema>;
