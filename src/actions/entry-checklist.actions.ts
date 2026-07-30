"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import {
  saveEntryChecklistSchema,
  type SaveEntryChecklistInput,
} from "@/schemas/entry-checklist.schema";
import {
  EntryChecklistServiceError,
  entryChecklistService,
} from "@/services/entry-checklist.service";

export type EntryChecklistActionResult = {
  success: boolean;
  message: string;
};

export async function saveEntryChecklistAction(
  input: SaveEntryChecklistInput,
): Promise<EntryChecklistActionResult> {
  const user = await requireUser();
  const parsed = saveEntryChecklistSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        "Revise a checklist e tente novamente.",
    };
  }

  try {
    await entryChecklistService.save(parsed.data, user.id);
    revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);

    return {
      success: true,
      message: parsed.data.complete
        ? "Checklist de entrada concluída com sucesso."
        : "Checklist salva como pendente.",
    };
  } catch (error) {
    if (error instanceof EntryChecklistServiceError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("Falha ao salvar checklist de entrada.", error);

    return {
      success: false,
      message:
        "Não foi possível salvar a checklist agora. Tente novamente em instantes.",
    };
  }
}
