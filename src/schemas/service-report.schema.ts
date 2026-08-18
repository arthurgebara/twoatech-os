import { z } from "zod";

import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export const saveServiceReportSchema = z.object({
  serviceOrderId: serviceOrderIdSchema,
  workPerformed: z.string().trim().min(5, "Descreva o serviço realizado com pelo menos 5 caracteres.").max(8000, "O serviço realizado deve ter no máximo 8.000 caracteres."),
  partsUsed: z.string().trim().max(5000, "As peças utilizadas devem ter no máximo 5.000 caracteres."),
  testsPerformed: z.string().trim().max(5000, "Os testes realizados devem ter no máximo 5.000 caracteres."),
  notes: z.string().trim().max(5000, "As observações devem ter no máximo 5.000 caracteres."),
  idempotencyKey: z.string().uuid("A chave da operação é inválida."),
});

export type SaveServiceReportInput = z.infer<typeof saveServiceReportSchema>;
export type ServiceReportFormField = "workPerformed" | "partsUsed" | "testsPerformed" | "notes";
