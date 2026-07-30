"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

import { requireUser } from "@/lib/auth/session";
import {
  equipmentActiveStateSchema,
  equipmentFormSchema,
  equipmentIdSchema,
  isEquipmentFormField,
  type EquipmentFormField,
  type EquipmentFormInput,
} from "@/schemas/equipment.schema";
import {
  EquipmentServiceError,
  equipmentService,
} from "@/services/equipment.service";

export type EquipmentActionResult = {
  success: boolean;
  message: string;
  equipmentId?: string;
  fieldErrors?: Partial<Record<EquipmentFormField, string[]>>;
};

function validationErrorResult(error: ZodError): EquipmentActionResult {
  const fieldErrors: Partial<Record<EquipmentFormField, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (isEquipmentFormField(field)) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
    }
  }

  return {
    success: false,
    message: "Revise os campos destacados e tente novamente.",
    fieldErrors,
  };
}

function serviceErrorResult(error: unknown): EquipmentActionResult {
  if (error instanceof EquipmentServiceError) {
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

  console.error("Falha ao salvar equipamento.", error);

  return {
    success: false,
    message:
      "Não foi possível salvar o equipamento agora. Tente novamente em instantes.",
  };
}

export async function createEquipmentAction(
  input: EquipmentFormInput,
): Promise<EquipmentActionResult> {
  await requireUser();

  const parsed = equipmentFormSchema.safeParse(input);

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const equipment = await equipmentService.create(parsed.data);
    revalidatePath("/equipamentos");
    revalidatePath(`/clientes/${equipment.customer.id}`);

    return {
      success: true,
      message: "Equipamento cadastrado com sucesso.",
      equipmentId: equipment.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}

export async function updateEquipmentAction(
  id: string,
  input: EquipmentFormInput,
): Promise<EquipmentActionResult> {
  await requireUser();

  const parsedId = equipmentIdSchema.safeParse(id);
  const parsed = equipmentFormSchema.safeParse(input);

  if (!parsedId.success) {
    return {
      success: false,
      message: "Equipamento inválido. Atualize a página e tente novamente.",
    };
  }

  if (!parsed.success) {
    return validationErrorResult(parsed.error);
  }

  try {
    const { equipment, previousCustomerId } = await equipmentService.update(
      parsedId.data,
      parsed.data,
    );
    revalidatePath("/equipamentos");
    revalidatePath(`/equipamentos/${equipment.id}`);
    revalidatePath(`/clientes/${equipment.customer.id}`);

    if (previousCustomerId !== equipment.customer.id) {
      revalidatePath(`/clientes/${previousCustomerId}`);
    }

    return {
      success: true,
      message: "Dados do equipamento atualizados com sucesso.",
      equipmentId: equipment.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}

export async function setEquipmentActiveAction(
  id: string,
  isActive: boolean,
): Promise<EquipmentActionResult> {
  await requireUser();

  const parsedId = equipmentIdSchema.safeParse(id);
  const parsedActiveState = equipmentActiveStateSchema.safeParse(isActive);

  if (!parsedId.success || !parsedActiveState.success) {
    return {
      success: false,
      message: "Dados inválidos. Atualize a página e tente novamente.",
    };
  }

  try {
    const equipment = await equipmentService.setActive(
      parsedId.data,
      parsedActiveState.data,
    );
    revalidatePath("/equipamentos");
    revalidatePath(`/equipamentos/${equipment.id}`);
    revalidatePath(`/clientes/${equipment.customer.id}`);

    return {
      success: true,
      message: parsedActiveState.data
        ? "Equipamento ativado com sucesso."
        : "Equipamento inativado com sucesso.",
      equipmentId: equipment.id,
    };
  } catch (error) {
    return serviceErrorResult(error);
  }
}
