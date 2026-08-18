"use client";

import { ExternalLink, FileText, ImageIcon, LoaderCircle, Paperclip, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { finalizeChecklistAttachmentUploadAction, requestChecklistAttachmentUploadAction } from "@/actions/checklist-attachment.actions";
import { Button } from "@/components/ui/button";
import { formatBrazilianDateTime } from "@/lib/dates";
import type { ChecklistAttachmentDetail } from "@/repositories/checklist-attachment.repository";
import { checklistAttachmentAccept, checklistAttachmentMaxSize, checklistAttachmentMimeTypes } from "@/schemas/checklist-attachment.schema";

function formatSize(size: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(size / 1024 / 1024) + " MB";
}

export function ChecklistAttachments({
  serviceOrderId,
  checklistType,
  attachments,
  editable,
}: {
  serviceOrderId: string;
  checklistType: "ENTRY" | "EXIT";
  attachments: ChecklistAttachmentDetail[];
  editable: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMessage("");
    try {
      for (const file of Array.from(files)) {
        if (!checklistAttachmentMimeTypes.includes(file.type as (typeof checklistAttachmentMimeTypes)[number])) {
          throw new Error(`${file.name}: formato não aceito.`);
        }
        if (file.size > checklistAttachmentMaxSize) throw new Error(`${file.name}: o limite é 10 MB.`);
        const authorization = await requestChecklistAttachmentUploadAction({
          serviceOrderId,
          checklistType,
          originalName: file.name,
          mimeType: file.type as (typeof checklistAttachmentMimeTypes)[number],
          size: file.size,
        });
        if (!authorization.success || !authorization.bucket || !authorization.objectPath || !authorization.token || !authorization.projectUrl || !authorization.attachmentId || !authorization.publishableKey) throw new Error(authorization.message);
        const storage = createClient(authorization.projectUrl, authorization.publishableKey, {
          auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
        }).storage;
        const { error: uploadError } = await storage.from(authorization.bucket).uploadToSignedUrl(
          authorization.objectPath,
          authorization.token,
          file,
          { cacheControl: "3600", contentType: file.type },
        );
        if (uploadError) throw new Error(`Não foi possível enviar ${file.name}.`);
        const confirmation = await finalizeChecklistAttachmentUploadAction({ attachmentId: authorization.attachmentId });
        if (!confirmation.success) throw new Error(confirmation.message);
      }
      setMessage(files.length === 1 ? "Anexo enviado com sucesso." : `${files.length} anexos enviados com sucesso.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar os anexos.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="space-y-3 border-t pt-5" aria-labelledby={`attachments-${checklistType}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id={`attachments-${checklistType}`} className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="size-4" aria-hidden="true" />Fotos e documentos</h3>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, HEIC ou PDF, até 10 MB por arquivo.</p>
        </div>
        {editable ? (
          <>
            <input ref={inputRef} type="file" multiple accept={checklistAttachmentAccept} className="sr-only" onChange={(event) => void uploadFiles(event.target.files)} />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              {uploading ? "Enviando..." : "Adicionar arquivos"}
            </Button>
          </>
        ) : null}
      </div>

      {attachments.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/15 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {attachment.mimeType === "application/pdf" ? <FileText className="size-4" aria-hidden="true" /> : <ImageIcon className="size-4" aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={attachment.originalName}>{attachment.originalName}</p>
                <p className="text-xs text-muted-foreground">{formatSize(attachment.size)} · {attachment.uploadedAt ? formatBrazilianDateTime(attachment.uploadedAt) : "Processando"}</p>
              </div>
              <a href={`/api/anexos/${attachment.id}`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Abrir ${attachment.originalName}`}>
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Nenhum arquivo anexado nesta etapa.</p>}
      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </section>
  );
}
