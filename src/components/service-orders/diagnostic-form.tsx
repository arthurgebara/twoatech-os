"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  saveDiagnosticAction,
  type DiagnosticActionResult,
} from "@/actions/diagnostic.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatBrazilianDateTime } from "@/lib/dates";
import type { DiagnosticDetail } from "@/repositories/diagnostic.repository";
import {
  saveDiagnosticSchema,
  type DiagnosticFormField,
  type SaveDiagnosticInput,
} from "@/schemas/diagnostic.schema";

type DiagnosticFormProps = {
  serviceOrderId: string;
  diagnostic: DiagnosticDetail | null;
  idempotencyKey: string;
  editable: boolean;
};

function isDiagnosticFormField(
  value: PropertyKey,
): value is DiagnosticFormField {
  return (
    value === "description" ||
    value === "technicalConclusion" ||
    value === "recommendations"
  );
}

export function DiagnosticForm({
  serviceOrderId,
  diagnostic,
  idempotencyKey,
  editable,
}: DiagnosticFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SaveDiagnosticInput>({
    resolver: zodResolver(saveDiagnosticSchema),
    defaultValues: {
      serviceOrderId,
      description: diagnostic?.description ?? "",
      technicalConclusion: diagnostic?.technicalConclusion ?? "",
      recommendations: diagnostic?.recommendations ?? "",
      idempotencyKey,
    },
  });

  async function onSubmit(values: SaveDiagnosticInput) {
    setMessage(null);
    const result: DiagnosticActionResult = await saveDiagnosticAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          const fieldMessage = messages?.[0];

          if (fieldMessage && isDiagnosticFormField(field)) {
            setError(field, { message: fieldMessage });
          }
        }
      }

      setError("root", { message: result.message });
      return;
    }

    setMessage(result.message);
    reset({
      ...values,
      idempotencyKey: crypto.randomUUID(),
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("serviceOrderId")} />
      <input type="hidden" {...register("idempotencyKey")} />

      {diagnostic ? (
        <p className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Último registro por {diagnostic.registeredBy.name} em{" "}
          {formatBrazilianDateTime(diagnostic.registeredAt)}.
        </p>
      ) : null}
      {!editable ? (
        <p className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          O diagnóstico fica disponível após a conclusão da checklist de entrada e é bloqueado quando a ordem avança para aprovação.
        </p>
      ) : null}

      {errors.root?.message ? (
        <p
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          {errors.root.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="diagnostic-description">Descrição do diagnóstico</Label>
        <textarea
          id="diagnostic-description"
          rows={5}
          placeholder="Descreva os testes realizados e o problema identificado"
          aria-invalid={Boolean(errors.description)}
          disabled={!editable}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register("description")}
        />
        {errors.description?.message ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="technical-conclusion">Conclusão técnica</Label>
        <textarea
          id="technical-conclusion"
          rows={4}
          placeholder="Conclusão técnica, se disponível"
          aria-invalid={Boolean(errors.technicalConclusion)}
          disabled={!editable}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register("technicalConclusion")}
        />
        {errors.technicalConclusion?.message ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.technicalConclusion.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnostic-recommendations">Recomendações</Label>
        <textarea
          id="diagnostic-recommendations"
          rows={4}
          placeholder="Recomendações técnicas ou próximos passos"
          aria-invalid={Boolean(errors.recommendations)}
          disabled={!editable}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register("recommendations")}
        />
        {errors.recommendations?.message ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.recommendations.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={isSubmitting || !editable}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Stethoscope aria-hidden="true" />
          )}
          {isSubmitting
            ? "Registrando..."
            : diagnostic
              ? "Atualizar diagnóstico"
              : "Registrar diagnóstico"}
        </Button>
      </div>

      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
