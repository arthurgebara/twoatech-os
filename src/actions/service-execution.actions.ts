"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { serviceExecutionActionSchema, type ServiceExecutionActionInput } from "@/schemas/service-execution.schema";
import { ServiceExecutionError, serviceExecutionService } from "@/services/service-execution.service";

export type ServiceExecutionActionResult = { success: boolean; message: string };
type Command = "START" | "WAIT_PART" | "RECEIVE_PART" | "COMPLETE";

async function execute(input: ServiceExecutionActionInput, command: Command): Promise<ServiceExecutionActionResult> {
  const user = await requireUser();
  const parsed = serviceExecutionActionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await serviceExecutionService.execute(parsed.data, user.id, command);
    revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
    revalidatePath("/ordens-de-servico");
    revalidatePath("/dashboard");
    const messages: Record<Command, string> = {
      START: "Serviço iniciado.",
      WAIT_PART: "Ordem marcada como aguardando peça.",
      RECEIVE_PART: "Peça recebida e serviço retomado.",
      COMPLETE: "Serviço concluído.",
    };
    return { success: true, message: messages[command] };
  } catch (error) {
    if (error instanceof ServiceExecutionError) return { success: false, message: error.message };
    console.error("Falha ao alterar execução da ordem.", error);
    return { success: false, message: "Não foi possível concluir a ação agora." };
  }
}

export async function startServiceAction(input: ServiceExecutionActionInput) { return execute(input, "START"); }
export async function waitForPartAction(input: ServiceExecutionActionInput) { return execute(input, "WAIT_PART"); }
export async function receivePartAction(input: ServiceExecutionActionInput) { return execute(input, "RECEIVE_PART"); }
export async function completeServiceAction(input: ServiceExecutionActionInput) { return execute(input, "COMPLETE"); }
