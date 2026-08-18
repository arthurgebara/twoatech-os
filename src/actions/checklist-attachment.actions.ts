"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import {
  finalizeChecklistAttachmentUploadSchema,
  requestChecklistAttachmentUploadSchema,
  type FinalizeChecklistAttachmentUploadInput,
  type RequestChecklistAttachmentUploadInput,
} from "@/schemas/checklist-attachment.schema";
import { ChecklistAttachmentServiceError, checklistAttachmentService } from "@/services/checklist-attachment.service";

export type ChecklistAttachmentActionResult = {
  success: boolean;
  message: string;
  attachmentId?: string;
  bucket?: string;
  objectPath?: string;
  token?: string;
  projectUrl?: string;
  publishableKey?: string;
};

function failure(error: unknown): ChecklistAttachmentActionResult {
  if (error instanceof ChecklistAttachmentServiceError) return { success: false, message: error.message };
  console.error("Falha na operação de anexo da checklist.", error);
  return { success: false, message: "Não foi possível enviar o anexo agora." };
}

export async function requestChecklistAttachmentUploadAction(input: RequestChecklistAttachmentUploadInput): Promise<ChecklistAttachmentActionResult> {
  const user = await requireUser();
  const parsed = requestChecklistAttachmentUploadSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Revise o arquivo." };
  try {
    const upload = await checklistAttachmentService.requestUpload(parsed.data, user.id);
    return { success: true, message: "Envio autorizado.", ...upload };
  } catch (error) {
    return failure(error);
  }
}

export async function finalizeChecklistAttachmentUploadAction(input: FinalizeChecklistAttachmentUploadInput): Promise<ChecklistAttachmentActionResult> {
  const user = await requireUser();
  const parsed = finalizeChecklistAttachmentUploadSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "Anexo inválido." };
  try {
    const attachment = await checklistAttachmentService.finalizeUpload(parsed.data, user.id);
    if (!attachment) throw new ChecklistAttachmentServiceError("Não foi possível confirmar o anexo.");
    revalidatePath(`/ordens-de-servico/${attachment.serviceOrderId}`);
    return { success: true, message: "Anexo enviado com sucesso.", attachmentId: attachment.id };
  } catch (error) {
    return failure(error);
  }
}
