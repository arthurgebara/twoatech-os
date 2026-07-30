import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ServiceOrderList } from "@/components/service-orders/service-order-list";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { serviceOrderService } from "@/services/service-order.service";

export const metadata: Metadata = {
  title: "Ordens de Serviço",
};

export default async function ServiceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const result = await serviceOrderService.list({
    search: params.q,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a abertura, o recebimento e o histórico dos atendimentos.
          </p>
        </div>
        <Link
          href="/ordens-de-servico/nova"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          <Plus aria-hidden="true" />
          Nova ordem
        </Link>
      </header>

      <form
        action="/ordens-de-servico"
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
            placeholder="Buscar por número, cliente ou equipamento"
            aria-label="Buscar ordens de serviço"
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
            href="/ordens-de-servico"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            Limpar
          </Link>
        ) : null}
      </form>

      <ServiceOrderList {...result} />
    </div>
  );
}
