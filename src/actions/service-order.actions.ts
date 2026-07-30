"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  addServiceOrderObservationSchema,
  createServiceOrderSchema,
  isCreateServiceOrderField,
  receiveEquipmentSchema,
  type AddServiceOrderObservationInput,
  type CreateServiceOrderField,
  type CreateServiceOrderInput,
  type ReceiveEquipmentInput,
} from "@/schemas/service-order.schema";
import {
  ServiceOrderServiceError,
  serviceOrderService,
} from "@/services/service-order.service";

export type ServiceOrderActionResult = {
  success: boolean;
  message: string;
  serviceOrderId?: string;
  fieldErrors?: Partial<Record<CreateServiceOrderField, string[]>>;
};

function validationErrorResult(error: ZodError): ServiceOrderActionResult {
  const fieldErrors: Partial<Record<CreateServiceOrderField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (isCreateServiceOrderField(field)) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
  }

  return {
    success: false,
    message: "Revise os campos destacados e tente novamente.",
    fieldErrors,
  };
}

function serviceErrorResult(error: unknown): ServiceOrderActionResult {
  if (error instanceof ServiceOrderServiceError) {
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

  console.error("Falha na operação da ordem de serviço.", error);

  return {
    success: false,
    message:
      "Não foi possível concluir a operação agora. Tente novamente em instantes.",
  };
}

export async function createServiceOrderAction(
  input: CreateServiceOrderInput,
): Promise<ServiceOrderActionResult> {
  const user = await requireUser();
  const parsed = createServiceOrderSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const order = await serviceOrderService.create(parsed.data, user.id);
    revalidatePath("/ordens-de-servico");
    revalidatePath(`/clientes/${order.customerId}`);
    revalidatePath(`/equipamentos/${order.equipmentId}`);

    return {
      success: true,
      message: "Ordem de serviço criada com sucesso.",
      serviceOrderId: order.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}

export async function receiveEquipmentAction(
  input: ReceiveEquipmentInput,
): Promise<ServiceOrderActionResult> {
  const user = await requireUser();
  const parsed = receiveEquipmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "A operação de recebimento é inválida. Atualize a página.",
    };
  }

  try {
    const order = await serviceOrderService.receive(parsed.data, user.id);
    revalidatePath("/ordens-de-servico");
    revalidatePath(`/ordens-de-servico/${order.id}`);

    return {
      success: true,
      message: "Recebimento registrado com sucesso.",
      serviceOrderId: order.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}

export async function addServiceOrderObservationAction(
  input: AddServiceOrderObservationInput,
): Promise<ServiceOrderActionResult> {
  const user = await requireUser();
  const parsed = addServiceOrderObservationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        "Revise a observação e tente novamente.",
    };
  }

  try {
    const order = await serviceOrderService.addObservation(parsed.data, user.id);
    revalidatePath(`/ordens-de-servico/${order.id}`);

    return {
      success: true,
      message: "Observação adicionada à timeline.",
      serviceOrderId: order.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}
