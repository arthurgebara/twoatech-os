import { z } from "zod";

import { EquipmentType } from "@/generated/prisma/enums";

export const equipmentTypeSchema = z.enum(EquipmentType, {
  error: "Selecione um tipo de equipamento.",
});

export const equipmentTypeLabels: Record<EquipmentType, string> = {
  DESKTOP: "Desktop",
  NOTEBOOK: "Notebook",
  GAMING_PC: "PC Gamer",
  ALL_IN_ONE: "All in One",
  OTHER: "Outro",
};

export const equipmentTypeOptions = Object.values(EquipmentType).map((value) => ({
  value,
  label: equipmentTypeLabels[value],
}));

export const equipmentFormSchema = z.object({
  customerId: z
    .string()
    .uuid("Selecione um cliente válido para o equipamento."),
  type: equipmentTypeSchema,
  brand: z
    .string()
    .trim()
    .max(100, "A marca deve ter no máximo 100 caracteres."),
  model: z
    .string()
    .trim()
    .max(120, "O modelo deve ter no máximo 120 caracteres."),
  serialNumber: z
    .string()
    .trim()
    .max(120, "O número de série deve ter no máximo 120 caracteres."),
  color: z
    .string()
    .trim()
    .max(60, "A cor deve ter no máximo 60 caracteres."),
  specifications: z
    .string()
    .trim()
    .max(3000, "As especificações devem ter no máximo 3.000 caracteres."),
  notes: z
    .string()
    .trim()
    .max(2000, "As observações devem ter no máximo 2.000 caracteres."),
});

export const equipmentIdSchema = z
  .string()
  .uuid("O identificador do equipamento é inválido.");

export const equipmentActiveStateSchema = z.boolean({
  error: "A situação informada para o equipamento é inválida.",
});

export const equipmentListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  customerId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.uuid().safeParse(value).success,
      "O filtro de cliente é inválido.",
    )
    .default(""),
  type: z.union([z.literal(""), equipmentTypeSchema]).default(""),
  page: z.coerce.number().int().positive().default(1),
});

export type EquipmentFormInput = z.infer<typeof equipmentFormSchema>;
export type EquipmentFormField = keyof EquipmentFormInput;
export type EquipmentListFilters = z.infer<typeof equipmentListQuerySchema>;

export const equipmentFormFields: EquipmentFormField[] = [
  "customerId",
  "type",
  "brand",
  "model",
  "serialNumber",
  "color",
  "specifications",
  "notes",
];

export function isEquipmentFormField(
  value: PropertyKey,
): value is EquipmentFormField {
  return equipmentFormFields.includes(value as EquipmentFormField);
}
