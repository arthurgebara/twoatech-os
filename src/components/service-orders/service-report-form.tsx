"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { saveServiceReportAction } from "@/actions/service-report.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatBrazilianDateTime } from "@/lib/dates";
import type { ServiceReportDetail } from "@/repositories/service-report.repository";
import { saveServiceReportSchema, type SaveServiceReportInput, type ServiceReportFormField } from "@/schemas/service-report.schema";

const textareaClassName = "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30";

function isField(value: PropertyKey): value is ServiceReportFormField {
  return value === "workPerformed" || value === "partsUsed" || value === "testsPerformed" || value === "notes";
}

export function ServiceReportForm({ serviceOrderId, report, idempotencyKey, editable }: { serviceOrderId: string; report: ServiceReportDetail | null; idempotencyKey: string; editable: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const { handleSubmit, register, setError, formState: { errors, isSubmitting } } = useForm<SaveServiceReportInput>({
    resolver: zodResolver(saveServiceReportSchema),
    defaultValues: {
      serviceOrderId,
      workPerformed: report?.workPerformed ?? "",
      partsUsed: report?.partsUsed ?? "",
      testsPerformed: report?.testsPerformed ?? "",
      notes: report?.notes ?? "",
      idempotencyKey,
    },
  });

  async function submit(values: SaveServiceReportInput) {
    setMessage("");
    const result = await saveServiceReportAction(values);
    if (!result.success) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (isField(field) && messages?.[0]) setError(field, { message: messages[0] });
      }
      setError("root", { message: result.message });
      return;
    }
    setMessage(result.message);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("serviceOrderId")} /><input type="hidden" {...register("idempotencyKey")} />
      {report ? <p className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">Concluído por {report.registeredBy.name} em {formatBrazilianDateTime(report.registeredAt)}. O relatório fica preservado após a conclusão.</p> : null}
      {!report && !editable ? <p className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">Inicie o serviço para liberar o relatório técnico.</p> : null}
      {errors.root?.message ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">{errors.root.message}</p> : null}
      <div className="space-y-2"><Label htmlFor="work-performed">Serviço realizado</Label><textarea id="work-performed" rows={5} disabled={!editable} className={textareaClassName} placeholder="Descreva o trabalho executado" {...register("workPerformed")} />{errors.workPerformed?.message ? <p className="text-xs text-destructive">{errors.workPerformed.message}</p> : null}</div>
      <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="parts-used">Peças utilizadas</Label><textarea id="parts-used" rows={4} disabled={!editable} className={textareaClassName} placeholder="Peças e componentes substituídos" {...register("partsUsed")} /></div><div className="space-y-2"><Label htmlFor="tests-performed">Testes realizados</Label><textarea id="tests-performed" rows={4} disabled={!editable} className={textareaClassName} placeholder="Testes finais da execução técnica" {...register("testsPerformed")} /></div></div>
      <div className="space-y-2"><Label htmlFor="report-notes">Observações técnicas</Label><textarea id="report-notes" rows={3} disabled={!editable} className={textareaClassName} {...register("notes")} /></div>
      {editable ? <div className="flex justify-end border-t pt-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}{isSubmitting ? "Concluindo..." : "Salvar relatório e concluir serviço"}</Button></div> : null}
      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </form>
  );
}
