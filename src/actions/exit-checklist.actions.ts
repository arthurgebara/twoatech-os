"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { saveExitChecklistSchema, type SaveExitChecklistInput } from "@/schemas/exit-checklist.schema";
import { ExitChecklistServiceError, exitChecklistService } from "@/services/exit-checklist.service";

export type ExitChecklistActionResult = { success: boolean; message: string };

export async function saveExitChecklistAction(input: SaveExitChecklistInput): Promise<ExitChecklistActionResult> {
  const user = await requireUser();
  const parsed = saveExitChecklistSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise a checklist." };
  try {
    await exitChecklistService.save(parsed.data, user.id);
    revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
    return { success: true, message: parsed.data.complete ? "Checklist de saída concluída." : "Checklist salva como pendente." };
  } catch (error) {
    if (error instanceof ExitChecklistServiceError) return { success: false, message: error.message };
    console.error("Falha ao salvar checklist de saída.", error);
    return { success: false, message: "Não foi possível salvar a checklist agora." };
  }
}
