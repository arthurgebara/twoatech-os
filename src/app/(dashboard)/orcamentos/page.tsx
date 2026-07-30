import { FileText, Search } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBrazilianCurrency } from "@/lib/currency";
import { formatBrazilianDateTime } from "@/lib/dates";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { quoteStatusLabels } from "@/schemas/quote.schema";
import { quoteService } from "@/services/quote.service";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const result = await quoteService.list({ search: params.q, status: params.status, page: params.page });
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Orçamentos</h1><p className="mt-1 text-sm text-muted-foreground">Acompanhe versões, envios e decisões dos clientes.</p></header>
      <form action="/orcamentos" className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row" role="search">
        <div className="relative flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input name="q" defaultValue={result.search} className="pl-9" placeholder="Número, OS ou cliente" /></div>
        <select name="status" defaultValue={result.status ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Todos os status</option>{Object.entries(quoteStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className={cn(buttonVariants({ variant: "secondary" }))}>Filtrar</button>
      </form>
      <Card>
        <CardHeader className="border-b"><CardTitle>Orçamentos cadastrados</CardTitle><CardDescription>{result.total} registro(s)</CardDescription></CardHeader>
        <CardContent className="px-0">
          {result.quotes.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><FileText className="mb-3 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">Nenhum orçamento encontrado</p><p className="text-sm text-muted-foreground">Crie o orçamento a partir de uma ordem de serviço.</p></div> : (
            <div className="divide-y">{result.quotes.map((quote) => <Link key={quote.id} href={`/orcamentos/${quote.id}` as Route} className="grid gap-2 px-4 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
              <div><p className="font-medium">Orçamento #{quote.number} · v{quote.version}</p><p className="text-xs text-muted-foreground">{formatBrazilianDateTime(quote.createdAt)}</p></div>
              <div><p className="text-sm">{quote.serviceOrder.customer.name}</p><p className="text-xs text-muted-foreground">{formatServiceOrderNumber(quote.serviceOrder.number)}</p></div>
              <Badge variant="secondary">{quoteStatusLabels[quote.status]}</Badge>
              <p className="text-sm font-semibold sm:text-right">{formatBrazilianCurrency(quote.total.toString())}</p>
            </Link>)}</div>
          )}
          {result.totalPages > 1 ? <div className="flex items-center justify-between border-t p-4 text-sm"><span>Página {result.page} de {result.totalPages}</span><div className="flex gap-2">{result.page > 1 ? <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`/orcamentos?page=${result.page - 1}`}>Anterior</Link> : null}{result.page < result.totalPages ? <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`/orcamentos?page=${result.page + 1}`}>Próxima</Link> : null}</div></div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
