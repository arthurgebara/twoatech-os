import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { CustomerList } from "@/components/customers/customer-list";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { customerService } from "@/services/customer.service";

export const metadata: Metadata = {
  title: "Clientes",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const result = await customerService.list({
    search: params.q,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre e consulte os clientes da assistência técnica.
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <Plus aria-hidden="true" />
          Novo cliente
        </Link>
      </header>

      <form
        action="/clientes"
        method="get"
        className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-xs sm:flex-row"
        role="search"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={result.search}
            placeholder="Buscar por nome, telefone ou CPF/CNPJ"
            aria-label="Buscar clientes"
            className="h-9 pl-9"
          />
        </div>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
        >
          Buscar
        </button>
        {result.search ? (
          <Link
            href="/clientes"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <CustomerList {...result} />
    </div>
  );
}
