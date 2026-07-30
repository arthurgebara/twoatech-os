"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerActionResult,
} from "@/actions/customer.actions";
import {
  maskCpfCnpj,
  maskPhone,
} from "@/components/customers/customer-formatters";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  customerFormSchema,
  isCustomerFormField,
  type CustomerFormInput,
} from "@/schemas/customer.schema";

type CustomerFormProps = {
  mode: "create" | "edit";
  customerId?: string;
  defaultValues?: CustomerFormInput;
};

const emptyValues: CustomerFormInput = {
  name: "",
  document: "",
  email: "",
  phone: "",
  secondaryPhone: "",
  address: "",
  notes: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function CustomerForm({
  mode,
  customerId,
  defaultValues = emptyValues,
}: CustomerFormProps) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });
  const returnHref = (
    customerId ? `/clientes/${customerId}` : "/clientes"
  ) as Route;

  async function onSubmit(values: CustomerFormInput) {
    let result: CustomerActionResult;

    if (mode === "edit" && customerId) {
      result = await updateCustomerAction(customerId, values);
    } else {
      result = await createCustomerAction(values);
    }

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          const message = messages?.[0];

          if (message && isCustomerFormField(field)) {
            setError(field, { message });
          }
        }
      }

      setError("root", { message: result.message });
      return;
    }

    router.push(`/clientes/${result.customerId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
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
          <h2 className="text-sm font-medium">Identificação</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dados principais para localizar o cliente no atendimento.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nome completo ou razão social</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Ex.: João da Silva"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">CPF ou CNPJ</Label>
            <Controller
              name="document"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="document"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={maskCpfCnpj(field.value)}
                  onChange={(event) =>
                    field.onChange(maskCpfCnpj(event.target.value))
                  }
                  aria-invalid={Boolean(errors.document)}
                />
              )}
            />
            <FieldError message={errors.document?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="cliente@exemplo.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-sm font-medium">Contato</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O telefone principal é obrigatório para contato sobre o serviço.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone principal</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={maskPhone(field.value)}
                  onChange={(event) =>
                    field.onChange(maskPhone(event.target.value))
                  }
                  aria-invalid={Boolean(errors.phone)}
                />
              )}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryPhone">Telefone secundário</Label>
            <Controller
              name="secondaryPhone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="secondaryPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 3333-4444"
                  value={maskPhone(field.value)}
                  onChange={(event) =>
                    field.onChange(maskPhone(event.target.value))
                  }
                  aria-invalid={Boolean(errors.secondaryPhone)}
                />
              )}
            />
            <FieldError message={errors.secondaryPhone?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <textarea
              id="address"
              rows={3}
              placeholder="Rua, número, complemento, bairro e cidade"
              aria-invalid={Boolean(errors.address)}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              {...register("address")}
            />
            <FieldError message={errors.address?.message} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div className="space-y-2">
          <Label htmlFor="notes">Observações internas</Label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Preferências de contato ou informações relevantes sobre o cliente"
            aria-invalid={Boolean(errors.notes)}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
            {...register("notes")}
          />
          <FieldError message={errors.notes?.message} />
        </div>
      </section>

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
              ? "Cadastrar cliente"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
