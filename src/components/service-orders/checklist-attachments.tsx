"use client";

import { CheckCircle2, CircleAlert, ExternalLink, FileText, ImageIcon, LoaderCircle, Paperclip, Upload, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { finalizeChecklistAttachmentUploadAction, requestChecklistAttachmentUploadAction } from "@/actions/checklist-attachment.actions";
import { Button } from "@/components/ui/button";
import { createUploadProgressFetch } from "@/lib/supabase/upload-progress";
import { cn } from "@/lib/utils";
import { formatBrazilianDateTime } from "@/lib/dates";
import type { ChecklistAttachmentDetail } from "@/repositories/checklist-attachment.repository";
import { checklistAttachmentAccept, checklistAttachmentMaxSize, checklistAttachmentMimeTypes } from "@/schemas/checklist-attachment.schema";

function formatSize(size: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(size / 1024 / 1024) + " MB";
}

type FileUpload = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  status: "queued" | "authorizing" | "uploading" | "confirming" | "complete" | "error";
  error?: string;
  attachmentId?: string;
};

function uploadLabel(upload: FileUpload) {
  switch (upload.status) {
    case "queued": return "Na fila";
    case "authorizing": return "Preparando envio...";
    case "uploading": return `Enviando · ${upload.progress}%`;
    case "confirming": return "Confirmando arquivo...";
    case "complete": return "Enviado";
    case "error": return upload.error ?? "Falha no envio.";
  }
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
  const uploadingRef = useRef(false);
  const dragDepth = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [message, setMessage] = useState("");
  const visibleAttachments = attachments.filter((attachment) => !uploads.some((upload) => upload.status === "complete" && upload.attachmentId === attachment.id));

  function updateUpload(id: string, patch: Partial<FileUpload>) {
    setUploads((current) => current.map((upload) => upload.id === id ? { ...upload, ...patch } : upload));
  }

  async function uploadFiles(files: FileList | null) {
    if (!editable || uploadingRef.current || !files?.length) return;
    uploadingRef.current = true;
    setUploading(true);
    setDragging(false);
    dragDepth.current = 0;
    setMessage("");
    const batch = Array.from(files).map((file) => ({ file, id: crypto.randomUUID() }));
    setUploads(batch.map(({ file, id }) => ({ id, name: file.name, size: file.size, mimeType: file.type, progress: 0, status: "queued" })));
    if (inputRef.current) inputRef.current.value = "";
    let completed = 0;
    try {
      for (const { file, id } of batch) {
        try {
          if (!checklistAttachmentMimeTypes.includes(file.type as (typeof checklistAttachmentMimeTypes)[number])) {
            throw new Error("Formato não aceito. Use JPEG, PNG, WebP, HEIC/HEIF ou PDF.");
          }
          if (file.size === 0) throw new Error("O arquivo está vazio.");
          if (file.size > checklistAttachmentMaxSize) throw new Error("O arquivo ultrapassa o limite de 10 MB.");
          updateUpload(id, { status: "authorizing" });
          const authorization = await requestChecklistAttachmentUploadAction({
            serviceOrderId, checklistType, originalName: file.name,
            mimeType: file.type as (typeof checklistAttachmentMimeTypes)[number], size: file.size,
          });
          if (!authorization.success || !authorization.bucket || !authorization.objectPath || !authorization.token || !authorization.projectUrl || !authorization.attachmentId || !authorization.publishableKey) throw new Error(authorization.message);
          const storage = createClient(authorization.projectUrl, authorization.publishableKey, {
            auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
            global: { fetch: createUploadProgressFetch((progress) => updateUpload(id, { progress })) },
          }).storage;
          updateUpload(id, { status: "uploading" });
          const { error: uploadError } = await storage.from(authorization.bucket).uploadToSignedUrl(
            authorization.objectPath, authorization.token, file, { cacheControl: "3600", contentType: file.type },
          );
          if (uploadError) throw new Error("Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente.");
          updateUpload(id, { status: "confirming", progress: 100 });
          const confirmation = await finalizeChecklistAttachmentUploadAction({ attachmentId: authorization.attachmentId });
          if (!confirmation.success) throw new Error(confirmation.message);
          updateUpload(id, { status: "complete", attachmentId: authorization.attachmentId });
          completed += 1;
        } catch (error) {
          updateUpload(id, { status: "error", error: error instanceof Error ? error.message : "Não foi possível enviar o arquivo." });
        }
      }
      const failed = batch.length - completed;
      setMessage(failed ? `${completed} de ${batch.length} arquivo(s) enviado(s). Confira os erros e selecione novamente os arquivos que falharam.` : `${completed} arquivo(s) enviado(s) com sucesso.`);
      if (completed) router.refresh();
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }

  return (
    <section className="space-y-3 border-t pt-5" aria-labelledby={`attachments-${checklistType}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id={`attachments-${checklistType}`} className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="size-4" aria-hidden="true" />Fotos e documentos</h3>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, HEIC ou PDF, até 10 MB por arquivo.</p>
        </div>
      </div>

      {editable ? (
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            if (!event.dataTransfer.types.includes("Files") || uploadingRef.current) return;
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = uploadingRef.current ? "none" : "copy";
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (!dragDepth.current) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            void uploadFiles(event.dataTransfer.files);
          }}
          className={cn("rounded-xl border-2 border-dashed transition-colors", dragging ? "border-primary bg-primary/10" : "border-border bg-muted/15", !uploading && "hover:border-primary/60 hover:bg-primary/5", "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50")}
        >
          <input ref={inputRef} type="file" multiple accept={checklistAttachmentAccept} className="sr-only" disabled={uploading} aria-label="Selecionar fotos e documentos" onChange={(event) => void uploadFiles(event.target.files)} />
          <Button type="button" variant="ghost" disabled={uploading} className="h-auto w-full flex-col gap-2 whitespace-normal rounded-xl px-4 py-7 text-center hover:bg-transparent" onClick={() => inputRef.current?.click()}>
            <span className={cn("flex size-11 items-center justify-center rounded-full", dragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
              {uploading ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <UploadCloud className="size-5" aria-hidden="true" />}
            </span>
            <span className="text-sm font-medium">{uploading ? "Enviando arquivos..." : dragging ? "Solte os arquivos para começar o envio" : "Arraste fotos e documentos para cá"}</span>
            <span className="text-xs font-normal text-muted-foreground">{uploading ? "Acompanhe o progresso de cada arquivo abaixo." : "ou clique para selecionar · envio automático"}</span>
          </Button>
        </div>
      ) : null}

      {uploads.length ? <ul className="grid gap-3 sm:grid-cols-2" aria-label="Progresso dos envios">
        {uploads.map((upload) => <li key={upload.id} className={cn("min-w-0 rounded-lg border p-3", upload.status === "error" ? "border-destructive/30 bg-destructive/5" : upload.status === "complete" ? "border-primary/25 bg-primary/5" : "bg-muted/15")}>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {upload.mimeType === "application/pdf" ? <FileText className="size-4" aria-hidden="true" /> : <ImageIcon className="size-4" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={upload.name}>{upload.name}</p><p className="text-xs text-muted-foreground">{formatSize(upload.size)}</p></div>
            {upload.status === "complete" ? <CheckCircle2 className="size-4 shrink-0 text-primary" aria-label="Enviado" /> : upload.status === "error" ? <CircleAlert className="size-4 shrink-0 text-destructive" aria-label="Erro no envio" /> : upload.status === "queued" ? <Upload className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" aria-label="Envio em andamento" />}
            {upload.status === "complete" && upload.attachmentId ? <a href={`/api/anexos/${upload.attachmentId}`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Abrir ${upload.name}`}><ExternalLink className="size-4" aria-hidden="true" /></a> : null}
          </div>
          <progress max={100} value={upload.progress} aria-label={`Envio de ${upload.name}`} className={cn("mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary", upload.status === "error" && "[&::-webkit-progress-value]:bg-destructive [&::-moz-progress-bar]:bg-destructive")} />
          <p className={cn("mt-1.5 text-xs", upload.status === "error" ? "text-destructive" : "text-muted-foreground")} aria-live="polite">{uploadLabel(upload)}</p>
        </li>)}
      </ul> : null}

      {visibleAttachments.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visibleAttachments.map((attachment) => (
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
      ) : !uploads.length ? <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Nenhum arquivo anexado nesta etapa.</p> : null}
      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </section>
  );
}
