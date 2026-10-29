"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save, UserPlus, LaptopMinimal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  createServiceOrderAction,
  type ServiceOrderActionResult,
} from "@/actions/service-order.actions";
import { formatCpfCnpj } from "@/components/customers/customer-formatters";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { CustomerForm } from "@/components/customers/customer-form";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CustomerFormInput } from "@/schemas/customer.schema";
import type { EquipmentFormInput } from "@/schemas/equipment.schema";
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
  initialValues?: Omit<CreateServiceOrderInput, "idempotencyKey">;
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
  customerOptions: initialCustomers,
  equipmentOptions: initialEquipment,
  idempotencyKey,
  initialValues,
}: ServiceOrderFormProps) {
  const router = useRouter();
  const [customerOptions, setCustomers] = useState(initialCustomers);
  const [equipmentOptions, setEquipment] = useState(initialEquipment);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [equipmentSheetOpen, setEquipmentSheetOpen] = useState(false);
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
      ...initialValues,
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

  function customerCreated(customerId: string, values: CustomerFormInput) {
    setCustomers((current) => [...current, { id: customerId, name: values.name.trim(), document: values.document.replace(/\D/g, "") || null, isActive: true }]);
    setValue("customerId", customerId, { shouldValidate: true });
    setValue("equipmentId", "");
    setCustomerSheetOpen(false);
  }

  function equipmentCreated(equipmentId: string, values: EquipmentFormInput) {
    setEquipment((current) => [...current, {
      id: equipmentId,
      customerId: values.customerId,
      type: values.type,
      brand: values.brand.trim() || null,
      model: values.model.trim() || null,
      serialNumber: values.serialNumber.trim() || null,
      isActive: true,
      customer: { isActive: true },
    }]);
    setValue("equipmentId", equipmentId, { shouldValidate: true });
    setEquipmentSheetOpen(false);
  }

  return (
    <>
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
            <div className="flex items-center justify-between"><Label htmlFor="customerId">Cliente</Label><Button type="button" variant="ghost" size="sm" onClick={() => setCustomerSheetOpen(true)}><UserPlus aria-hidden="true" /> Novo</Button></div>
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
            <div className="flex items-center justify-between"><Label htmlFor="equipmentId">Equipamento</Label><Button type="button" variant="ghost" size="sm" disabled={!selectedCustomerId} onClick={() => setEquipmentSheetOpen(true)}><LaptopMinimal aria-hidden="true" /> Novo</Button></div>
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
          {isSubmitting ? "Criando atendimento..." : "Criar atendimento"}
        </Button>
      </div>
    </form>
      <Sheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Novo cliente</SheetTitle><SheetDescription>Cadastre sem perder os dados da entrada.</SheetDescription></SheetHeader><div className="p-4 pt-0"><CustomerForm mode="create" embedded onCreated={customerCreated} /></div></SheetContent></Sheet>
      <Sheet open={equipmentSheetOpen} onOpenChange={setEquipmentSheetOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Novo equipamento</SheetTitle><SheetDescription>O equipamento será vinculado ao cliente selecionado.</SheetDescription></SheetHeader><div className="p-4 pt-0"><EquipmentForm mode="create" embedded customerOptions={customerOptions} defaultValues={{ customerId: selectedCustomerId, type: "NOTEBOOK", brand: "", model: "", serialNumber: "", color: "", specifications: "", notes: "" }} onCreated={equipmentCreated} /></div></SheetContent></Sheet>
    </>
  );
}
