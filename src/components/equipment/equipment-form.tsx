"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  createEquipmentAction,
  updateEquipmentAction,
  type EquipmentActionResult,
} from "@/actions/equipment.actions";
import { formatCpfCnpj } from "@/components/customers/customer-formatters";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CustomerOption } from "@/repositories/customer.repository";
import {
  equipmentFormSchema,
  equipmentTypeOptions,
  isEquipmentFormField,
  type EquipmentFormInput,
} from "@/schemas/equipment.schema";

type EquipmentFormProps = {
  mode: "create" | "edit";
  customerOptions: CustomerOption[];
  equipmentId?: string;
  currentCustomerId?: string;
  defaultValues?: EquipmentFormInput;
  embedded?: boolean;
  onCreated?: (equipmentId: string, values: EquipmentFormInput) => void;
};

const emptyValues: EquipmentFormInput = {
  customerId: "",
  type: "NOTEBOOK",
  brand: "",
  model: "",
  serialNumber: "",
  color: "",
  specifications: "",
  notes: "",
};

const fieldClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

const textareaClassName =
  "w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

export function EquipmentForm({
  mode,
  customerOptions,
  equipmentId,
  currentCustomerId,
  defaultValues = emptyValues,
  embedded = false,
  onCreated,
}: EquipmentFormProps) {
  const router = useRouter();
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormInput>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues,
  });
  const returnHref = (
    equipmentId ? `/equipamentos/${equipmentId}` : "/equipamentos"
  ) as Route;

  async function onSubmit(values: EquipmentFormInput) {
    let result: EquipmentActionResult;

    if (mode === "edit" && equipmentId) {
      result = await updateEquipmentAction(equipmentId, values);
    } else {
      result = await createEquipmentAction(values);
    }

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          const message = messages?.[0];

          if (message && isEquipmentFormField(field)) {
            setError(field, { message });
          }
        }
      }

      setError("root", { message: result.message });
      return;
    }

    if (embedded && result.equipmentId) {
      onCreated?.(result.equipmentId, values);
      return;
    }
    router.push(`/equipamentos/${result.equipmentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {errors.root?.message ? (
        <div
          className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errors.root.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Proprietário e tipo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Todo equipamento deve permanecer vinculado a um cliente.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customerId">Cliente proprietário</Label>
            <select
              id="customerId"
              aria-invalid={Boolean(errors.customerId)}
              className={fieldClassName}
              {...register("customerId")}
            >
              <option value="">Selecione um cliente</option>
              {customerOptions.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                  disabled={
                    !customer.isActive && customer.id !== currentCustomerId
                  }
                >
                  {customer.name} · {formatCpfCnpj(customer.document)}
                  {!customer.isActive ? " · Inativo" : ""}
                </option>
              ))}
            </select>
            <FieldError message={errors.customerId?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              aria-invalid={Boolean(errors.type)}
              className={fieldClassName}
              {...register("type")}
            >
              {equipmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.type?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-sm font-medium">Identificação</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Informações visuais e de fabricação para localizar o equipamento.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              placeholder="Ex.: Dell"
              aria-invalid={Boolean(errors.brand)}
              {...register("brand")}
            />
            <FieldError message={errors.brand?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              placeholder="Ex.: Inspiron 15"
              aria-invalid={Boolean(errors.model)}
              {...register("model")}
            />
            <FieldError message={errors.model?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Número de série</Label>
            <Input
              id="serialNumber"
              placeholder="Ex.: SN123456"
              aria-invalid={Boolean(errors.serialNumber)}
              {...register("serialNumber")}
            />
            <FieldError message={errors.serialNumber?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Input
              id="color"
              placeholder="Ex.: Preto"
              aria-invalid={Boolean(errors.color)}
              {...register("color")}
            />
            <FieldError message={errors.color?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="specifications">Especificações</Label>
          <textarea
            id="specifications"
            rows={4}
            placeholder="Processador, memória, armazenamento e demais características técnicas"
            aria-invalid={Boolean(errors.specifications)}
            className={textareaClassName}
            {...register("specifications")}
          />
          <FieldError message={errors.specifications?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Marcas de uso, acessórios entregues ou outras informações relevantes"
            aria-invalid={Boolean(errors.notes)}
            className={textareaClassName}
            {...register("notes")}
          />
          <FieldError message={errors.notes?.message} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        {!embedded ? (
          <Link
            href={returnHref}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            <ArrowLeft aria-hidden="true" />
            Cancelar
          </Link>
        ) : null}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isSubmitting
            ? "Salvando..."
            : mode === "create"
              ? "Cadastrar equipamento"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
