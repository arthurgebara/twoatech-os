import { z } from "zod";

import { EquipmentType, QuoteRequestStatus } from "@/generated/prisma/enums";
import { onlyDigits } from "@/schemas/customer.schema";
import { equipmentTypeSchema } from "@/schemas/equipment.schema";

export const quoteRequestFormSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome.").max(160, "O nome é muito longo."),
  phone: z.string().transform(onlyDigits).pipe(z.string().min(10, "Informe um telefone com DDD.").max(11, "O telefone é inválido.")),
  email: z.string().trim().max(255).refine((value) => !value || z.email().safeParse(value).success, "Informe um e-mail válido."),
  equipmentType: equipmentTypeSchema,
  equipmentDescription: z.string().trim().max(240, "A descrição deve ter no máximo 240 caracteres."),
  reportedProblem: z.string().trim().min(10, "Conte um pouco mais sobre o que está acontecendo.").max(3000, "A descrição deve ter no máximo 3.000 caracteres."),
  website: z.string().max(0),
});

export const quoteRequestStatusSchema = z.enum(QuoteRequestStatus);
export const quoteRequestIdSchema = z.string().uuid();
export type QuoteRequestFormInput = z.input<typeof quoteRequestFormSchema>;
export type QuoteRequestFormField = keyof QuoteRequestFormInput;
export type QuoteRequestStatusValue = keyof typeof QuoteRequestStatus;

export const quoteRequestStatusLabels: Record<QuoteRequestStatusValue, string> = {
  NEW: "Nova",
  CONTACTED: "Contato realizado",
  DISMISSED: "Descartada",
};

export const publicEquipmentTypeOptions = Object.values(EquipmentType).map((value) => ({ value, label: value === "DESKTOP" ? "Desktop" : value === "NOTEBOOK" ? "Notebook" : value === "GAMING_PC" ? "PC Gamer" : value === "ALL_IN_ONE" ? "All in One" : "Outro" }));
