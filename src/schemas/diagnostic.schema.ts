import { z } from "zod";

import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export const saveDiagnosticSchema = z.object({
  serviceOrderId: serviceOrderIdSchema,
  description: z
    .string()
    .trim()
    .min(5, "Descreva o diagnóstico com pelo menos 5 caracteres.")
    .max(5000, "A descrição deve ter no máximo 5.000 caracteres."),
  technicalConclusion: z
    .string()
    .trim()
    .max(5000, "A conclusão técnica deve ter no máximo 5.000 caracteres."),
  recommendations: z
    .string()
    .trim()
    .max(5000, "As recomendações devem ter no máximo 5.000 caracteres."),
  idempotencyKey: z
    .string()
    .uuid("A chave da operação do diagnóstico é inválida."),
});

export type SaveDiagnosticInput = z.infer<typeof saveDiagnosticSchema>;
export type DiagnosticFormField =
  | "description"
  | "technicalConclusion"
  | "recommendations";
