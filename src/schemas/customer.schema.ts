import { z } from "zod";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

function isValidCpf(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false;
  }

  const calculateDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .split("")
      .reduce(
        (total, digit, index) => total + Number(digit) * (length + 1 - index),
        0,
      );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(9) === Number(digits[9]) &&
    calculateDigit(10) === Number(digits[10])
  );
}

function isValidCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false;
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce(
        (total, digit, index) => total + Number(digit) * weights[index],
        0,
      );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstBase = digits.slice(0, 12);
  const firstDigit = calculateDigit(firstBase, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(
    `${firstBase}${firstDigit}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return (
    firstDigit === Number(digits[12]) &&
    secondDigit === Number(digits[13])
  );
}

export function isValidCpfCnpj(value: string) {
  const digits = onlyDigits(value);
  return digits.length === 11 ? isValidCpf(digits) : isValidCnpj(digits);
}

const optionalEmailSchema = z
  .string()
  .trim()
  .max(255, "O e-mail deve ter no máximo 255 caracteres.")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Informe um e-mail válido.",
  );

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome completo ou a razão social.")
    .max(160, "O nome deve ter no máximo 160 caracteres."),
  document: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || [11, 14].includes(onlyDigits(value).length),
      "Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.",
    )
    .refine(
      (value) => value === "" || isValidCpfCnpj(value),
      "Informe um CPF ou CNPJ válido.",
    ),
  email: optionalEmailSchema,
  phone: z
    .string()
    .trim()
    .refine(
      (value) => [10, 11].includes(onlyDigits(value).length),
      "Informe um telefone com DDD.",
    ),
  secondaryPhone: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || [10, 11].includes(onlyDigits(value).length),
      "Informe um telefone secundário com DDD.",
    ),
  address: z
    .string()
    .trim()
    .max(1000, "O endereço deve ter no máximo 1.000 caracteres."),
  notes: z
    .string()
    .trim()
    .max(2000, "As observações devem ter no máximo 2.000 caracteres."),
});

export const customerIdSchema = z
  .string()
  .uuid("O identificador do cliente é inválido.");

export const customerActiveStateSchema = z.boolean({
  error: "A situação informada para o cliente é inválida.",
});

export const customerListQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().positive().default(1),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
export type CustomerFormField = keyof CustomerFormInput;

export const customerFormFields: CustomerFormField[] = [
  "name",
  "document",
  "email",
  "phone",
  "secondaryPhone",
  "address",
  "notes",
];

export function isCustomerFormField(
  value: PropertyKey,
): value is CustomerFormField {
  return customerFormFields.includes(value as CustomerFormField);
}
