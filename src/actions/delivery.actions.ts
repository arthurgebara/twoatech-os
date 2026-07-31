"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import {
  cancelServiceOrderSchema,
  deliveryCommandSchema,
  type CancelServiceOrderInput,
  type DeliveryCommandInput,
} from "@/schemas/delivery.schema";
import { DeliveryServiceError, deliveryService } from "@/services/delivery.service";

export type DeliveryActionResult = { success: boolean; message: string };

function failure(error: unknown): DeliveryActionResult {
  if (error instanceof DeliveryServiceError) return { success: false, message: error.message };
  console.error("Falha no fluxo de entrega.", error);
  return { success: false, message: "Não foi possível concluir a operação agora." };
}

function revalidate(serviceOrderId: string) {
  revalidatePath(`/ordens-de-servico/${serviceOrderId}`);
  revalidatePath("/ordens-de-servico");
  revalidatePath("/dashboard");
}

export async function markEquipmentReadyAction(input: DeliveryCommandInput): Promise<DeliveryActionResult> {
  const user = await requireUser();
  const parsed = deliveryCommandSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await deliveryService.markReady(parsed.data, user.id);
    revalidate(parsed.data.serviceOrderId);
    return { success: true, message: "Equipamento marcado como pronto para retirada." };
  } catch (error) { return failure(error); }
}

export async function deliverEquipmentAction(input: DeliveryCommandInput): Promise<DeliveryActionResult> {
  const user = await requireUser();
  const parsed = deliveryCommandSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await deliveryService.deliver(parsed.data, user.id);
    revalidate(parsed.data.serviceOrderId);
    return { success: true, message: "Entrega registrada com sucesso." };
  } catch (error) { return failure(error); }
}

export async function cancelServiceOrderAction(input: CancelServiceOrderInput): Promise<DeliveryActionResult> {
  const user = await requireUser();
  const parsed = cancelServiceOrderSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Informe o motivo." };
  try {
    await deliveryService.cancel(parsed.data, user.id);
    revalidate(parsed.data.serviceOrderId);
    return { success: true, message: "Ordem cancelada." };
  } catch (error) { return failure(error); }
}
