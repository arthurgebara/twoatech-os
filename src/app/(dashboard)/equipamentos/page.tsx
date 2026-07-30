import { Filter, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EquipmentList } from "@/components/equipment/equipment-list";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { customerService } from "@/services/customer.service";
import { equipmentService } from "@/services/equipment.service";
import { equipmentTypeOptions } from "@/schemas/equipment.schema";

export const metadata: Metadata = {
  title: "Equipamentos",
};

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    cliente?: string;
    tipo?: string;
    page?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const [result, customerOptions] = await Promise.all([
    equipmentService.list({
      search: params.q,
      customerId: params.cliente,
      type: params.tipo,
      page: params.page,
    }),
    customerService.listOptions(),
  ]);
  const hasFilters = Boolean(
    result.search || result.customerId || result.type,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Equipamentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os equipamentos e identifique claramente seus proprietários.
          </p>
        </div>
        <Link
          href="/equipamentos/novo"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <Plus aria-hidden="true" />
          Novo equipamento
        </Link>
      </header>

      <form
        action="/equipamentos"
        method="get"
        className="grid gap-2 rounded-xl border bg-card p-3 shadow-xs lg:grid-cols-[minmax(240px,1fr)_minmax(180px,0.7fr)_minmax(160px,0.5fr)_auto]"
        role="search"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={result.search}
            placeholder="Marca, modelo, série ou cliente"
            aria-label="Buscar equipamentos"
            className="h-9 pl-9"
          />
        </div>

        <select
          name="cliente"
          defaultValue={result.customerId}
          className={selectClassName}
          aria-label="Filtrar por cliente"
        >
          <option value="">Todos os clientes</option>
          {customerOptions.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {!customer.isActive ? " · Inativo" : ""}
            </option>
          ))}
        </select>

        <select
          name="tipo"
          defaultValue={result.type}
          className={selectClassName}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {equipmentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "flex-1",
            )}
          >
            <Filter aria-hidden="true" />
            Filtrar
          </button>
          {hasFilters ? (
            <Link
              href="/equipamentos"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              Limpar
            </Link>
          ) : null}
        </div>
      </form>

      <EquipmentList {...result} />
    </div>
  );
}
