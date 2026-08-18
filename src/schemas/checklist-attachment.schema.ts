import { z } from "zod";

import { ChecklistType } from "@/generated/prisma/enums";

export const checklistAttachmentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

export const checklistAttachmentAccept = checklistAttachmentMimeTypes.join(",");
export const checklistAttachmentMaxSize = 10 * 1024 * 1024;

export const requestChecklistAttachmentUploadSchema = z.object({
  serviceOrderId: z.string().uuid("A ordem de serviço é inválida."),
  checklistType: z.enum(ChecklistType),
  originalName: z.string().trim().min(1, "O arquivo precisa ter um nome.").max(255, "O nome do arquivo é muito longo."),
  mimeType: z.enum(checklistAttachmentMimeTypes, { error: "Envie uma foto JPEG, PNG, WebP, HEIC ou um PDF." }),
  size: z.number().int().positive("O arquivo está vazio.").max(checklistAttachmentMaxSize, "O arquivo deve ter no máximo 10 MB."),
});

export const finalizeChecklistAttachmentUploadSchema = z.object({
  attachmentId: z.string().uuid("O anexo é inválido."),
});

export type RequestChecklistAttachmentUploadInput = z.infer<typeof requestChecklistAttachmentUploadSchema>;
export type FinalizeChecklistAttachmentUploadInput = z.infer<typeof finalizeChecklistAttachmentUploadSchema>;
