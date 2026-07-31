"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { saveExitChecklistAction } from "@/actions/exit-checklist.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatBrazilianDateTime } from "@/lib/dates";
import type { ExitChecklistDetail } from "@/repositories/exit-checklist.repository";
import {
  createEmptyExitChecklistItems,
  exitChecklistItemDefinitions,
  saveExitChecklistSchema,
  type SaveExitChecklistInput,
} from "@/schemas/exit-checklist.schema";

function defaultItems(checklist: ExitChecklistDetail | null) {
  if (!checklist) return createEmptyExitChecklistItems();
  return exitChecklistItemDefinitions.map((definition) => {
    const item = checklist.items.find((saved) => saved.key === definition.key);
    return { key: definition.key, checked: item?.checked ?? false, notes: item?.notes ?? "" };
  });
}

export function ExitChecklistForm({
  serviceOrderId,
  checklist,
  idempotencyKey,
}: {
  serviceOrderId: string;
  checklist: ExitChecklistDetail | null;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const completed = checklist?.status === "COMPLETED";
  const { handleSubmit, register, setError, formState: { errors, isSubmitting } } = useForm<SaveExitChecklistInput>({
    resolver: zodResolver(saveExitChecklistSchema),
    defaultValues: {
      serviceOrderId,
      notes: checklist?.notes ?? "",
      items: defaultItems(checklist),
      complete: false,
      idempotencyKey,
    },
  });
  async function save(values: SaveExitChecklistInput, complete: boolean) {
    if (complete && !window.confirm("Concluir a checklist de saída? Depois disso ela não poderá ser alterada.")) return;
    const result = await saveExitChecklistAction({ ...values, complete });
    setMessage(result.message);
    if (!result.success) setError("root", { message: result.message });
    else router.refresh();
  }
  return (
    <form className="space-y-5" noValidate>
      <input type="hidden" {...register("serviceOrderId")} />
      <input type="hidden" {...register("idempotencyKey")} />
      <input type="hidden" {...register("complete")} />
      {completed ? <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
        Concluída{checklist.completedBy ? ` por ${checklist.completedBy.name}` : ""}{checklist.completedAt ? ` em ${formatBrazilianDateTime(checklist.completedAt)}` : ""}. Este registro não pode mais ser alterado.
      </p> : null}
      {errors.root?.message ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive" role="alert">{errors.root.message}</p> : null}
      <div className="space-y-3">
        {exitChecklistItemDefinitions.map((definition, index) => (
          <div key={definition.key} className="grid gap-3 rounded-xl border bg-muted/15 p-3 sm:grid-cols-[minmax(180px,.75fr)_minmax(240px,1fr)] sm:items-center">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input type="checkbox" disabled={completed} className="size-4 accent-primary" {...register(`items.${index}.checked`)} />
              {definition.label}
            </label>
            <div>
              <input type="hidden" value={definition.key} {...register(`items.${index}.key`)} />
              <input type="text" disabled={completed} placeholder="Observação do item" aria-label={`Observação: ${definition.label}`} className="h-8 w-full rounded-lg border bg-transparent px-3 text-sm dark:bg-input/30" {...register(`items.${index}.notes`)} />
              {errors.items?.[index]?.notes?.message ? <p className="mt-1 text-xs text-destructive">{errors.items[index].notes.message}</p> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="exit-notes">Observações gerais</Label>
        <textarea id="exit-notes" rows={3} disabled={completed} className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:bg-input/30" {...register("notes")} />
      </div>
      {!completed ? <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleSubmit((values) => save(values, false))}>{isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}Salvar pendente</Button>
        <Button type="button" disabled={isSubmitting} onClick={handleSubmit((values) => save(values, true))}><CheckCircle2 aria-hidden="true" />Concluir checklist</Button>
      </div> : null}
      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </form>
  );
}
