import { z } from "zod";

export const serviceExecutionActionSchema = z.object({
  serviceOrderId: z.string().uuid("Ordem de serviço inválida."),
  idempotencyKey: z.string().uuid("Chave da operação inválida."),
});

export type ServiceExecutionActionInput = z.infer<typeof serviceExecutionActionSchema>;
