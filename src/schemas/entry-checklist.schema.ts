import { z } from "zod";

import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

export const entryChecklistItemDefinitions = [
  { key: "estado_geral", label: "Estado geral e marcas de uso" },
  { key: "tela_monitor", label: "Tela ou monitor" },
  { key: "teclado", label: "Teclado" },
  { key: "touchpad_mouse", label: "Touchpad ou mouse" },
  { key: "carcaca_gabinete", label: "Carcaça ou gabinete" },
  { key: "portas_conectores", label: "Portas e conectores" },
  { key: "parafusos_lacres", label: "Parafusos e lacres" },
  { key: "liga_inicializa", label: "Liga e inicializa" },
  { key: "fonte_carregador", label: "Fonte ou carregador" },
  { key: "acessorios", label: "Acessórios recebidos" },
] as const;

const entryChecklistItemKeys = entryChecklistItemDefinitions.map(
  (item) => item.key,
);

export const entryChecklistItemKeySchema = z.enum(entryChecklistItemKeys);

export const entryChecklistItemSchema = z.object({
  key: entryChecklistItemKeySchema,
  checked: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(1000, "A observação do item deve ter no máximo 1.000 caracteres."),
});

export const saveEntryChecklistSchema = z.object({
  serviceOrderId: serviceOrderIdSchema,
  notes: z
    .string()
    .trim()
    .max(2000, "As observações gerais devem ter no máximo 2.000 caracteres."),
  items: z
    .array(entryChecklistItemSchema)
    .length(
      entryChecklistItemDefinitions.length,
      "A checklist de entrada está incompleta.",
    )
    .superRefine((items, context) => {
      const keys = new Set(items.map((item) => item.key));

      if (keys.size !== entryChecklistItemDefinitions.length) {
        context.addIssue({
          code: "custom",
          message: "A checklist possui itens duplicados ou ausentes.",
        });
      }
    }),
  complete: z.boolean(),
  idempotencyKey: z
    .string()
    .uuid("A chave da operação da checklist é inválida."),
});

export type EntryChecklistItemKey = z.infer<
  typeof entryChecklistItemKeySchema
>;
export type SaveEntryChecklistInput = z.infer<
  typeof saveEntryChecklistSchema
>;
export type EntryChecklistFormField =
  | "notes"
  | `items.${number}.checked`
  | `items.${number}.notes`;

export function createEmptyEntryChecklistItems() {
  return entryChecklistItemDefinitions.map((item) => ({
    key: item.key,
    checked: false,
    notes: "",
  }));
}
