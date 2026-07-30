"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { saveEntryChecklistAction } from "@/actions/entry-checklist.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatBrazilianDateTime } from "@/lib/dates";
import type { EntryChecklistDetail } from "@/repositories/entry-checklist.repository";
import {
  createEmptyEntryChecklistItems,
  entryChecklistItemDefinitions,
  saveEntryChecklistSchema,
  type SaveEntryChecklistInput,
} from "@/schemas/entry-checklist.schema";

type EntryChecklistFormProps = {
  serviceOrderId: string;
  checklist: EntryChecklistDetail | null;
  idempotencyKey: string;
};

function createDefaultItems(checklist: EntryChecklistDetail | null) {
  if (!checklist) {
    return createEmptyEntryChecklistItems();
  }

  return entryChecklistItemDefinitions.map((definition) => {
    const savedItem = checklist.items.find(
      (item) => item.key === definition.key,
    );

    return {
      key: definition.key,
      checked: savedItem?.checked ?? false,
      notes: savedItem?.notes ?? "",
    };
  });
}

export function EntryChecklistForm({
  serviceOrderId,
  checklist,
  idempotencyKey,
}: EntryChecklistFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const isCompleted = checklist?.status === "COMPLETED";
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SaveEntryChecklistInput>({
    resolver: zodResolver(saveEntryChecklistSchema),
    defaultValues: {
      serviceOrderId,
      notes: checklist?.notes ?? "",
      items: createDefaultItems(checklist),
      complete: false,
      idempotencyKey,
    },
  });

  async function save(values: SaveEntryChecklistInput, complete: boolean) {
    if (
      complete &&
      !window.confirm(
        "Concluir a checklist de entrada? Depois disso ela não poderá ser alterada.",
      )
    ) {
      return;
    }

    setMessage(null);
    const result = await saveEntryChecklistAction({
      ...values,
      complete,
    });
    setMessage(result.message);

    if (!result.success) {
      setError("root", { message: result.message });
      return;
    }

    router.refresh();
  }

  return (
    <form className="space-y-5" noValidate>
      <input type="hidden" {...register("serviceOrderId")} />
      <input type="hidden" {...register("idempotencyKey")} />
      <input type="hidden" {...register("complete")} />

      {isCompleted ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-muted-foreground">
          Concluída
          {checklist.completedBy
            ? ` por ${checklist.completedBy.name}`
            : ""}
          {checklist.completedAt
            ? ` em ${formatBrazilianDateTime(checklist.completedAt)}`
            : ""}
          . Este registro não pode mais ser alterado.
        </div>
      ) : null}

      {errors.root?.message ? (
        <p
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          {errors.root.message}
        </p>
      ) : null}

      <div className="space-y-3">
        {entryChecklistItemDefinitions.map((definition, index) => (
          <div
            key={definition.key}
            className="grid gap-3 rounded-xl border bg-muted/15 p-3 sm:grid-cols-[minmax(180px,0.75fr)_minmax(240px,1fr)] sm:items-center"
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                disabled={isCompleted}
                className="size-4 rounded border-input accent-primary"
                {...register(`items.${index}.checked`)}
              />
              {definition.label}
            </label>
            <div>
              <input
                type="hidden"
                value={definition.key}
                {...register(`items.${index}.key`)}
              />
              <input
                type="text"
                disabled={isCompleted}
                placeholder="Observação do item"
                aria-label={`Observação: ${definition.label}`}
                aria-invalid={Boolean(errors.items?.[index]?.notes)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-input/30"
                {...register(`items.${index}.notes`)}
              />
              {errors.items?.[index]?.notes?.message ? (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {errors.items[index].notes.message}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-checklist-notes">Observações gerais</Label>
        <textarea
          id="entry-checklist-notes"
          rows={3}
          disabled={isCompleted}
          placeholder="Informações gerais da conferência de entrada"
          aria-invalid={Boolean(errors.notes)}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-input/30"
          {...register("notes")}
        />
        {errors.notes?.message ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.notes.message}
          </p>
        ) : null}
      </div>

      {!isCompleted ? (
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSubmit((values) => save(values, false))}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            Salvar pendente
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit((values) => save(values, true))}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            Concluir checklist
          </Button>
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
