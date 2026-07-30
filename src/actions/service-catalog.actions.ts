"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  isServiceCatalogFormField,
  serviceCatalogActiveStateSchema,
  serviceCatalogFormSchema,
  serviceCatalogIdSchema,
  type ServiceCatalogFormField,
  type ServiceCatalogFormInput,
} from "@/schemas/service-catalog.schema";
import {
  ServiceCatalogServiceError,
  serviceCatalogService,
} from "@/services/service-catalog.service";

export type ServiceCatalogActionResult = {
  success: boolean;
  message: string;
  serviceId?: string;
  fieldErrors?: Partial<Record<ServiceCatalogFormField, string[]>>;
};

function validationResult(error: ZodError): ServiceCatalogActionResult {
  const fieldErrors: Partial<Record<ServiceCatalogFormField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (isServiceCatalogFormField(field)) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
  }

  return {
    success: false,
    message: "Revise os campos destacados e tente novamente.",
    fieldErrors,
  };
}

function errorResult(error: unknown): ServiceCatalogActionResult {
  if (error instanceof ServiceCatalogServiceError) {
    return { success: false, message: error.message };
  }

  console.error("Falha ao salvar serviço do catálogo.", error);
  return {
    success: false,
    message: "Não foi possível salvar o serviço agora.",
  };
}

export async function createServiceCatalogItemAction(
  input: ServiceCatalogFormInput,
): Promise<ServiceCatalogActionResult> {
  await requireUser();
  const parsed = serviceCatalogFormSchema.safeParse(input);

  if (!parsed.success) {
    return validationResult(parsed.error);
  }

  try {
    const service = await serviceCatalogService.create(parsed.data);
    revalidatePath("/servicos");
    return {
      success: true,
      message: "Serviço cadastrado com sucesso.",
      serviceId: service.id,
    };
  } catch (error) {
    return errorResult(error);
  }
}

export async function updateServiceCatalogItemAction(
  id: string,
  input: ServiceCatalogFormInput,
): Promise<ServiceCatalogActionResult> {
  await requireUser();
  const parsedId = serviceCatalogIdSchema.safeParse(id);
  const parsed = serviceCatalogFormSchema.safeParse(input);

  if (!parsedId.success) {
    return { success: false, message: "Serviço inválido." };
  }

  if (!parsed.success) {
    return validationResult(parsed.error);
  }

  try {
    const service = await serviceCatalogService.update(
      parsedId.data,
      parsed.data,
    );
    revalidatePath("/servicos");
    revalidatePath(`/servicos/${service.id}`);
    return {
      success: true,
      message: "Serviço atualizado com sucesso.",
      serviceId: service.id,
    };
  } catch (error) {
    return errorResult(error);
  }
}

export async function setServiceCatalogItemActiveAction(
  id: string,
  isActive: boolean,
): Promise<ServiceCatalogActionResult> {
  await requireUser();
  const parsedId = serviceCatalogIdSchema.safeParse(id);
  const parsedState = serviceCatalogActiveStateSchema.safeParse(isActive);

  if (!parsedId.success || !parsedState.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const service = await serviceCatalogService.setActive(
      parsedId.data,
      parsedState.data,
    );
    revalidatePath("/servicos");
    revalidatePath(`/servicos/${service.id}`);
    return {
      success: true,
      message: parsedState.data
        ? "Serviço ativado com sucesso."
        : "Serviço inativado com sucesso.",
      serviceId: service.id,
    };
  } catch (error) {
    return errorResult(error);
  }
}
