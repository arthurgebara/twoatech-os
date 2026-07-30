"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  createServiceOrderAction,
  type ServiceOrderActionResult,
} from "@/actions/service-order.actions";
import { formatCpfCnpj } from "@/components/customers/customer-formatters";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CustomerOption } from "@/repositories/customer.repository";
import type { EquipmentOption } from "@/repositories/equipment.repository";
import {
  createServiceOrderSchema,
  isCreateServiceOrderField,
  type CreateServiceOrderInput,
} from "@/schemas/service-order.schema";

type ServiceOrderFormProps = {
  customerOptions: CustomerOption[];
  equipmentOptions: EquipmentOption[];
  idempotencyKey: string;
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

export function ServiceOrderForm({
  customerOptions,
  equipmentOptions,
  idempotencyKey,
}: ServiceOrderFormProps) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceOrderInput>({
    resolver: zodResolver(createServiceOrderSchema),
    defaultValues: {
      customerId: "",
      equipmentId: "",
      reportedProblem: "",
      receivedAccessories: "",
      generalNotes: "",
      idempotencyKey,
    },
  });
  const selectedCustomerId = useWatch({ control, name: "customerId" });
  const selectedEquipmentId = useWatch({ control, name: "equipmentId" });
  const availableEquipment = equipmentOptions.filter(
    (equipment) =>
      equipment.customerId === selectedCustomerId &&
      equipment.isActive &&
      equipment.customer.isActive,
  );

  useEffect(() => {
    if (
      selectedEquipmentId &&
      !availableEquipment.some(
        (equipment) => equipment.id === selectedEquipmentId,
      )
    ) {
      setValue("equipmentId", "");
    }
  }, [availableEquipment, selectedEquipmentId, setValue]);

  async function onSubmit(values: CreateServiceOrderInput) {
    const result: ServiceOrderActionResult =
      await createServiceOrderAction(values);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          const message = messages?.[0];

          if (message && isCreateServiceOrderField(field)) {
            setError(field, { message });
          }
        }
      }

      setError("root", { message: result.message });
      return;
    }

    router.push(`/ordens-de-servico/${result.serviceOrderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <input type="hidden" {...register("idempotencyKey")} />

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
          <h2 className="text-sm font-medium">Cliente e equipamento</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Somente equipamentos ativos pertencentes ao cliente selecionado são
            exibidos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerId">Cliente</Label>
            <select
              id="customerId"
              className={fieldClassName}
              aria-invalid={Boolean(errors.customerId)}
              {...register("customerId")}
            >
              <option value="">Selecione o cliente</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {formatCpfCnpj(customer.document)}
                </option>
              ))}
            </select>
            <FieldError message={errors.customerId?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipmentId">Equipamento</Label>
            <select
              id="equipmentId"
              className={fieldClassName}
              aria-invalid={Boolean(errors.equipmentId)}
              disabled={!selectedCustomerId}
              {...register("equipmentId")}
            >
              <option value="">
                {selectedCustomerId
                  ? "Selecione o equipamento"
                  : "Selecione primeiro o cliente"}
              </option>
              {availableEquipment.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {formatEquipmentName(equipment)}
                  {equipment.serialNumber
                    ? ` · Série ${equipment.serialNumber}`
                    : ""}
                </option>
              ))}
            </select>
            <FieldError message={errors.equipmentId?.message} />
            {selectedCustomerId && availableEquipment.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Este cliente não possui equipamento ativo.{" "}
                <Link
                  href="/equipamentos/novo"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Cadastrar equipamento
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-sm font-medium">Abertura do atendimento</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registre exatamente o problema informado pelo cliente.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportedProblem">Problema relatado</Label>
          <textarea
            id="reportedProblem"
            rows={5}
            placeholder="Descreva os sintomas e o pedido do cliente"
            className={textareaClassName}
            aria-invalid={Boolean(errors.reportedProblem)}
            {...register("reportedProblem")}
          />
          <FieldError message={errors.reportedProblem?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="receivedAccessories">Acessórios informados</Label>
            <textarea
              id="receivedAccessories"
              rows={4}
              placeholder="Ex.: carregador e bolsa"
              className={textareaClassName}
              aria-invalid={Boolean(errors.receivedAccessories)}
              {...register("receivedAccessories")}
            />
            <FieldError message={errors.receivedAccessories?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="generalNotes">Observações gerais</Label>
            <textarea
              id="generalNotes"
              rows={4}
              placeholder="Informações administrativas relevantes"
              className={textareaClassName}
              aria-invalid={Boolean(errors.generalNotes)}
              {...register("generalNotes")}
            />
            <FieldError message={errors.generalNotes?.message} />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/ordens-de-servico"
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
          {isSubmitting ? "Criando ordem..." : "Criar ordem de serviço"}
        </Button>
      </div>
    </form>
  );
}
