import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ServiceCatalogList } from "@/components/service-catalog/service-catalog-list";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { serviceCatalogService } from "@/services/service-catalog.service";

export const metadata: Metadata = { title: "Tabela de Serviços" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const result = await serviceCatalogService.list({
    search: params.q,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Tabela de Serviços
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Padronize preços e durações utilizados nos orçamentos.
          </p>
        </div>
        <Link
          href="/servicos/novo"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <Plus aria-hidden="true" />
          Novo serviço
        </Link>
      </header>

      <form
        action="/servicos"
        className="flex gap-2 rounded-xl border bg-card p-3"
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={result.search}
            placeholder="Buscar por nome ou descrição"
            className="pl-9"
          />
        </div>
        <button
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
        >
          Buscar
        </button>
      </form>

      <ServiceCatalogList {...result} />
    </div>
  );
}
