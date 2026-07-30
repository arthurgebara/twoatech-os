"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  customerActiveStateSchema,
  customerFormSchema,
  customerIdSchema,
  isCustomerFormField,
  type CustomerFormField,
  type CustomerFormInput,
} from "@/schemas/customer.schema";
import {
  CustomerServiceError,
  customerService,
} from "@/services/customer.service";

export type CustomerActionResult = {
  success: boolean;
  message: string;
  customerId?: string;
  fieldErrors?: Partial<Record<CustomerFormField, string[]>>;
};

function validationErrorResult(error: ZodError): CustomerActionResult {
  const fieldErrors: Partial<Record<CustomerFormField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (isCustomerFormField(field)) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
  }

  return {
    success: false,
    message: "Revise os campos destacados e tente novamente.",
    fieldErrors,
  };
}

function serviceErrorResult(error: unknown): CustomerActionResult {
  if (error instanceof CustomerServiceError) {
    return {
      success: false,
      message: error.message,
      fieldErrors: error.field
        ? {
            [error.field]: [error.message],
          }
        : undefined,
    };
  }

  console.error("Falha ao salvar cliente.", error);

  return {
    success: false,
    message:
      "Não foi possível salvar o cliente agora. Tente novamente em instantes.",
  };
}

export async function createCustomerAction(
  input: CustomerFormInput,
): Promise<CustomerActionResult> {
  await requireUser();

  const parsed = customerFormSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const customer = await customerService.create(parsed.data);
    revalidatePath("/clientes");

    return {
      success: true,
      message: "Cliente cadastrado com sucesso.",
      customerId: customer.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerFormInput,
): Promise<CustomerActionResult> {
  await requireUser();

  const parsedId = customerIdSchema.safeParse(id);
  const parsed = customerFormSchema.safeParse(input);

  if (!parsedId.success) {
    return {
      success: false,
      message: "Cliente inválido. Atualize a página e tente novamente.",
    };
  }

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const customer = await customerService.update(parsedId.data, parsed.data);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${customer.id}`);

    return {
      success: true,
      message: "Dados do cliente atualizados com sucesso.",
      customerId: customer.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}

export async function setCustomerActiveAction(
  id: string,
  isActive: boolean,
): Promise<CustomerActionResult> {
  await requireUser();

  const parsedId = customerIdSchema.safeParse(id);
  const parsedActiveState = customerActiveStateSchema.safeParse(isActive);

  if (!parsedId.success || !parsedActiveState.success) {
    return {
      success: false,
      message: "Dados inválidos. Atualize a página e tente novamente.",
    };
  }

  try {
    const customer = await customerService.setActive(
      parsedId.data,
      parsedActiveState.data,
    );
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${customer.id}`);

    return {
      success: true,
      message: parsedActiveState.data
        ? "Cliente ativado com sucesso."
        : "Cliente inativado com sucesso.",
      customerId: customer.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}
