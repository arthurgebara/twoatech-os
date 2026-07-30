"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { addServiceOrderObservationAction } from "@/actions/service-order.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  addServiceOrderObservationSchema,
  type AddServiceOrderObservationInput,
} from "@/schemas/service-order.schema";

export function ServiceOrderObservationForm({
  serviceOrderId,
  idempotencyKey,
}: {
  serviceOrderId: string;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddServiceOrderObservationInput>({
    resolver: zodResolver(addServiceOrderObservationSchema),
    defaultValues: {
      serviceOrderId,
      description: "",
      idempotencyKey,
    },
  });

  async function onSubmit(values: AddServiceOrderObservationInput) {
    setMessage(null);
    const result = await addServiceOrderObservationAction(values);

    if (!result.success) {
      setError("description", { message: result.message });
      return;
    }

    setMessage(result.message);
    reset({
      serviceOrderId,
      description: "",
      idempotencyKey: crypto.randomUUID(),
    });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <input type="hidden" {...register("serviceOrderId")} />
      <input type="hidden" {...register("idempotencyKey")} />
      <div className="space-y-2">
        <Label htmlFor="timeline-observation">Adicionar observação</Label>
        <textarea
          id="timeline-observation"
          rows={3}
          placeholder="Registre uma informação permanente na timeline"
          aria-invalid={Boolean(errors.description)}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register("description")}
        />
        {errors.description?.message ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Após salvar, este registro não poderá ser editado nem excluído.
        </p>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <MessageSquarePlus aria-hidden="true" />
          )}
          {isSubmitting ? "Adicionando..." : "Adicionar"}
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
