import "server-only";

import { randomUUID } from "node:crypto";

import type { ChecklistType } from "@/generated/prisma/client";
import { storageBucket, storageProjectUrl, storagePublishableKey, supabaseStorage } from "@/lib/supabase/storage";
import { checklistAttachmentRepository } from "@/repositories/checklist-attachment.repository";
import {
  finalizeChecklistAttachmentUploadSchema,
  requestChecklistAttachmentUploadSchema,
  type FinalizeChecklistAttachmentUploadInput,
  type RequestChecklistAttachmentUploadInput,
} from "@/schemas/checklist-attachment.schema";

const extensions: Record<RequestChecklistAttachmentUploadInput["mimeType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

export class ChecklistAttachmentServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecklistAttachmentServiceError";
  }
}

async function assertUploadAllowed(serviceOrderId: string, checklistType: ChecklistType) {
  const order = await checklistAttachmentRepository.findOrder(serviceOrderId, checklistType);
  if (!order) throw new ChecklistAttachmentServiceError("Ordem de serviço não encontrada.");
  if (order.checklists[0]?.status === "COMPLETED") {
    throw new ChecklistAttachmentServiceError("A checklist concluída não aceita novos anexos.");
  }
  if (checklistType === "ENTRY" && !["OPEN", "RECEIVED"].includes(order.status)) {
    throw new ChecklistAttachmentServiceError("Os anexos de entrada não podem mais ser alterados nesta etapa.");
  }
  if (checklistType === "EXIT" && order.status !== "COMPLETED") {
    throw new ChecklistAttachmentServiceError("Conclua o serviço antes de anexar os registros de saída.");
  }
}

export const checklistAttachmentService = {
  async requestUpload(input: RequestChecklistAttachmentUploadInput, uploadedById: string) {
    const parsed = requestChecklistAttachmentUploadSchema.parse(input);
    await assertUploadAllowed(parsed.serviceOrderId, parsed.checklistType);
    const bucket = storageBucket();
    const folder = parsed.checklistType === "ENTRY" ? "entrada" : "saida";
    const objectPath = `ordens/${parsed.serviceOrderId}/${folder}/${randomUUID()}.${extensions[parsed.mimeType]}`;
    const pending = await checklistAttachmentRepository.createPending({
      serviceOrderId: parsed.serviceOrderId,
      checklistType: parsed.checklistType,
      bucket,
      objectPath,
      originalName: parsed.originalName,
      mimeType: parsed.mimeType,
      size: parsed.size,
      uploadedById,
    });
    const { data, error } = await supabaseStorage().from(bucket).createSignedUploadUrl(objectPath);
    if (error || !data) {
      await checklistAttachmentRepository.removePending(pending.id);
      throw new ChecklistAttachmentServiceError("Não foi possível autorizar o envio do arquivo.");
    }
    return {
      attachmentId: pending.id,
      bucket,
      objectPath: data.path,
      token: data.token,
      projectUrl: storageProjectUrl(),
      publishableKey: storagePublishableKey(),
    };
  },

  async finalizeUpload(input: FinalizeChecklistAttachmentUploadInput, uploadedById: string) {
    const parsed = finalizeChecklistAttachmentUploadSchema.parse(input);
    const attachment = await checklistAttachmentRepository.findById(parsed.attachmentId);
    if (!attachment || attachment.uploadedById !== uploadedById) {
      throw new ChecklistAttachmentServiceError("Anexo não encontrado.");
    }
    if (attachment.uploadedAt) return attachment;
    await assertUploadAllowed(attachment.serviceOrderId, attachment.checklistType);
    const { data, error } = await supabaseStorage().from(attachment.bucket).info(attachment.objectPath);
    if (error || !data) throw new ChecklistAttachmentServiceError("O arquivo ainda não chegou ao armazenamento.");
    if (data.size !== attachment.size || data.contentType !== attachment.mimeType) {
      await supabaseStorage().from(attachment.bucket).remove([attachment.objectPath]);
      await checklistAttachmentRepository.removePending(attachment.id);
      throw new ChecklistAttachmentServiceError("O arquivo recebido não corresponde ao envio autorizado.");
    }
    await checklistAttachmentRepository.markUploaded(attachment.id, new Date());
    return checklistAttachmentRepository.findById(attachment.id);
  },

  async list(serviceOrderId: string, checklistType: ChecklistType) {
    const parsed = requestChecklistAttachmentUploadSchema.shape.serviceOrderId.safeParse(serviceOrderId);
    return parsed.success ? checklistAttachmentRepository.list(parsed.data, checklistType) : [];
  },

  async createViewUrl(id: string) {
    const attachment = await checklistAttachmentRepository.findAccessible(id);
    if (!attachment) return null;
    const { data, error } = await supabaseStorage().from(attachment.bucket).createSignedUrl(attachment.objectPath, 60);
    return error ? null : data.signedUrl;
  },
};
