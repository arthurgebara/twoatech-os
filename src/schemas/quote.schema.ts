import { z } from "zod";

import { QuoteItemType, QuoteStatus } from "@/generated/prisma/enums";
import { parseBrlValue } from "@/schemas/service-catalog.schema";

const uuidSchema = z.string().uuid("Identificador inválido.");

function isValidQuantity(value: string) {
  return /^\d{1,7}([.,]\d{1,3})?$/.test(value.trim()) && Number(value.replace(",", ".")) > 0;
}

export function parseQuoteQuantity(value: string) {
  return value.trim().replace(",", ".");
}

export const quoteItemSchema = z.object({
  type: z.enum(QuoteItemType, { error: "Selecione o tipo do item." }),
  serviceCatalogItemId: z.string().trim(),
  description: z.string().trim().max(240, "A descrição deve ter no máximo 240 caracteres."),
  quantity: z.string().trim().refine(isValidQuantity, "Informe uma quantidade válida."),
  unitPrice: z
    .string()
    .trim()
    .refine((value) => parseBrlValue(value) !== null, "Informe um valor válido."),
}).superRefine((item, context) => {
  if (item.serviceCatalogItemId && !uuidSchema.safeParse(item.serviceCatalogItemId).success) {
    context.addIssue({ code: "custom", path: ["serviceCatalogItemId"], message: "Serviço do catálogo inválido." });
  }
  if (item.serviceCatalogItemId && item.type !== "SERVICE") {
    context.addIssue({ code: "custom", path: ["type"], message: "Itens do catálogo devem ser do tipo serviço." });
  }
  if (!item.serviceCatalogItemId && item.description.length < 2) {
    context.addIssue({ code: "custom", path: ["description"], message: "Informe a descrição do item." });
  }
});

export const createQuoteSchema = z.object({
  idempotencyKey: uuidSchema,
  serviceOrderId: uuidSchema,
  validUntil: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Informe uma data válida."),
  notes: z.string().trim().max(3000, "As observações devem ter no máximo 3.000 caracteres."),
  discount: z
    .string()
    .trim()
    .refine((value) => parseBrlValue(value) !== null, "Informe um desconto válido."),
  items: z.array(quoteItemSchema).min(1, "Adicione ao menos um item.").max(100, "O orçamento aceita no máximo 100 itens."),
});

export const quoteMutationSchema = z.object({
  quoteId: uuidSchema,
  idempotencyKey: uuidSchema,
});

export const quoteIdSchema = uuidSchema;

export const quoteListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.enum(QuoteStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
});

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  CANCELED: "Cancelado",
};

export const quoteItemTypeLabels: Record<QuoteItemType, string> = {
  SERVICE: "Serviço",
  PART: "Peça",
  OTHER: "Outro",
};

export type QuoteItemInput = z.input<typeof quoteItemSchema>;
export type CreateQuoteInput = z.input<typeof createQuoteSchema>;
export type QuoteMutationInput = z.input<typeof quoteMutationSchema>;
