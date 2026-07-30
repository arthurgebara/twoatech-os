import { z } from "zod";

export function parseBrlValue(value: string) {
  const normalized = value
    .trim()
    .replace(/^R\$\s?/, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount.toFixed(2) : null;
}

export const serviceCatalogFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do serviço.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  description: z
    .string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2.000 caracteres."),
  defaultPrice: z
    .string()
    .trim()
    .refine(
      (value) => parseBrlValue(value) !== null,
      "Informe um preço válido em reais.",
    )
    .refine((value) => {
      const price = parseBrlValue(value);
      return price !== null && Number(price) <= 9_999_999_999.99;
    }, "O preço informado excede o limite permitido."),
  estimatedMinutes: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Informe a duração em minutos inteiros.",
    )
    .refine(
      (value) => value === "" || Number(value) <= 100_000,
      "A duração deve ter no máximo 100.000 minutos.",
    ),
});

export const serviceCatalogIdSchema = z
  .string()
  .uuid("O identificador do serviço é inválido.");

export const serviceCatalogActiveStateSchema = z.boolean({
  error: "A situação informada para o serviço é inválida.",
});

export const serviceCatalogListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().positive().default(1),
});

export type ServiceCatalogFormInput = z.infer<
  typeof serviceCatalogFormSchema
>;
export type ServiceCatalogFormField = keyof ServiceCatalogFormInput;

const serviceCatalogFormFields: ServiceCatalogFormField[] = [
  "name",
  "description",
  "defaultPrice",
  "estimatedMinutes",
];

export function isServiceCatalogFormField(
  value: PropertyKey,
): value is ServiceCatalogFormField {
  return serviceCatalogFormFields.includes(value as ServiceCatalogFormField);
}
