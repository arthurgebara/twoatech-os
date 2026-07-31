import { z } from "zod";

import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export const exitChecklistItemDefinitions = [
  { key: "testes_finais", label: "Testes finais executados" },
  { key: "funcionamento", label: "Funcionamento geral validado" },
  { key: "montagem", label: "Montagem e parafusos conferidos" },
  { key: "limpeza", label: "Limpeza externa realizada" },
  { key: "acessorios", label: "Acessórios conferidos" },
  { key: "cabos_carregador", label: "Cabos, fonte ou carregador" },
] as const;

const keys = exitChecklistItemDefinitions.map((item) => item.key);
export const exitChecklistItemKeySchema = z.enum(keys);
export const exitChecklistItemSchema = z.object({
  key: exitChecklistItemKeySchema,
  checked: z.boolean(),
  notes: z.string().trim().max(1000, "A observação deve ter no máximo 1.000 caracteres."),
});
export const saveExitChecklistSchema = z.object({
  serviceOrderId: serviceOrderIdSchema,
  notes: z.string().trim().max(2000, "As observações gerais devem ter no máximo 2.000 caracteres."),
  items: z.array(exitChecklistItemSchema).length(exitChecklistItemDefinitions.length, "A checklist de saída está incompleta.").superRefine((items, context) => {
    if (new Set(items.map((item) => item.key)).size !== exitChecklistItemDefinitions.length) {
      context.addIssue({ code: "custom", message: "A checklist possui itens duplicados ou ausentes." });
    }
  }),
  complete: z.boolean(),
  idempotencyKey: z.string().uuid("A chave da operação é inválida."),
});
export type SaveExitChecklistInput = z.infer<typeof saveExitChecklistSchema>;
export function createEmptyExitChecklistItems() {
  return exitChecklistItemDefinitions.map((item) => ({ key: item.key, checked: false, notes: "" }));
}
