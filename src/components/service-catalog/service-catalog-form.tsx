"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import {
  createServiceCatalogItemAction,
  updateServiceCatalogItemAction,
  type ServiceCatalogActionResult,
} from "@/actions/service-catalog.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskBrlInput } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  isServiceCatalogFormField,
  serviceCatalogFormSchema,
  type ServiceCatalogFormInput,
} from "@/schemas/service-catalog.schema";

type ServiceCatalogFormProps = {
  mode: "create" | "edit";
  serviceId?: string;
  defaultValues?: ServiceCatalogFormInput;
};

const emptyValues: ServiceCatalogFormInput = {
  name: "",
  description: "",
  defaultPrice: "R$ 0,00",
  estimatedMinutes: "",
};

export function ServiceCatalogForm({
  mode,
  serviceId,
  defaultValues = emptyValues,
}: ServiceCatalogFormProps) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceCatalogFormInput>({
    resolver: zodResolver(serviceCatalogFormSchema),
    defaultValues,
  });
  const returnHref = (serviceId ? `/servicos/${serviceId}` : "/servicos") as Route;

  async function onSubmit(values: ServiceCatalogFormInput) {
    let result: ServiceCatalogActionResult;

    if (mode === "edit" && serviceId) {
      result = await updateServiceCatalogItemAction(serviceId, values);
    } else {
      result = await createServiceCatalogItemAction(values);
    }

    if (!result.success) {
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        const message = messages?.[0];

        if (message && isServiceCatalogFormField(field)) {
          setError(field, { message });
        }
      }

      setError("root", { message: result.message });
      return;
    }

    router.push(`/servicos/${result.serviceId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {errors.root?.message ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="service-name">Nome do serviço</Label>
        <Input
          id="service-name"
          placeholder="Ex.: Formatação e instalação do sistema"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name?.message ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-description">Descrição</Label>
        <textarea
          id="service-description"
          rows={4}
          placeholder="Descreva o que está incluído neste serviço"
          aria-invalid={Boolean(errors.description)}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          {...register("description")}
        />
        {errors.description?.message ? (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default-price">Preço padrão</Label>
          <Controller
            name="defaultPrice"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="default-price"
                inputMode="numeric"
                aria-invalid={Boolean(errors.defaultPrice)}
                onChange={(event) =>
                  field.onChange(maskBrlInput(event.target.value))
                }
              />
            )}
          />
          {errors.defaultPrice?.message ? (
            <p className="text-xs text-destructive">
              {errors.defaultPrice.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated-minutes">Duração estimada (minutos)</Label>
          <Input
            id="estimated-minutes"
            type="number"
            min="0"
            step="1"
            placeholder="Ex.: 120"
            aria-invalid={Boolean(errors.estimatedMinutes)}
            {...register("estimatedMinutes")}
          />
          {errors.estimatedMinutes?.message ? (
            <p className="text-xs text-destructive">
              {errors.estimatedMinutes.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Link
          href={returnHref}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <ArrowLeft aria-hidden="true" />
          Cancelar
        </Link>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isSubmitting
            ? "Salvando..."
            : mode === "create"
              ? "Cadastrar serviço"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
