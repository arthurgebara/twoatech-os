import { Clock3, Filter, SearchX } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBrazilianDateTime } from "@/lib/dates";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { timelineEventTypeLabels } from "@/schemas/history.schema";
import { historyService } from "@/services/history.service";

export const metadata: Metadata = { title: "Histórico" };

function pageHref(page: number, values: Record<string, string | number | undefined>): Route {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...values, page })) {
    if (value && value !== 1) query.set(key, String(value));
  }
  return `/historico?${query.toString()}` as Route;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string; tipo?: string; os?: string; usuario?: string; page?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const result = await historyService.list({
    startDate: params.inicio,
    endDate: params.fim,
    type: params.tipo,
    serviceOrder: params.os,
    userId: params.usuario,
    page: params.page,
  });
  const queryValues = { inicio: result.startDate, fim: result.endDate, tipo: result.type, os: result.serviceOrder, usuario: result.userId };
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Histórico</h1><p className="mt-1 text-sm text-muted-foreground">Timeline global, permanente e ordenada do evento mais recente para o mais antigo.</p></header>
      <form action="/historico" className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-6">
        <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="history-start">Data inicial</label><Input id="history-start" name="inicio" type="date" defaultValue={result.startDate} /></div>
        <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="history-end">Data final</label><Input id="history-end" name="fim" type="date" defaultValue={result.endDate} /></div>
        <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="history-type">Evento</label><select id="history-type" name="tipo" defaultValue={result.type ?? ""} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Todos</option>{Object.entries(timelineEventTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="history-os">Ordem</label><Input id="history-os" name="os" placeholder="Ex.: 123" defaultValue={result.serviceOrder} /></div>
        <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="history-user">Responsável</label><select id="history-user" name="usuario" defaultValue={result.userId} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Todos</option>{result.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>
        <div className="flex items-end gap-2"><button className={cn(buttonVariants({ variant: "secondary" }), "flex-1")}><Filter aria-hidden="true" />Filtrar</button><Link href="/historico" className={cn(buttonVariants({ variant: "ghost" }))}>Limpar</Link></div>
      </form>
      <Card>
        <CardHeader className="border-b"><CardTitle>Eventos</CardTitle><CardDescription>{result.total} evento(s) encontrado(s)</CardDescription></CardHeader>
        <CardContent className="px-0">
          {result.events.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><SearchX className="mb-3 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">Nenhum evento encontrado</p><p className="text-sm text-muted-foreground">Revise os filtros informados.</p></div> : (
            <ol className="divide-y">{result.events.map((event) => <li key={event.id} className="grid gap-3 px-4 py-4 md:grid-cols-[auto_1fr_auto]">
              <span className="flex size-9 items-center justify-center rounded-xl border bg-muted/30"><Clock3 className="size-4" aria-hidden="true" /></span>
              <div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{event.title}</p><Badge variant="outline">{timelineEventTypeLabels[event.type]}</Badge></div>{event.description ? <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{event.description}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{event.responsibleUser?.name ?? "Sistema"} · {event.serviceOrder.customer.name} · {formatEquipmentName(event.serviceOrder.equipment)}</p></div>
              <div className="md:text-right"><time className="text-xs text-muted-foreground">{formatBrazilianDateTime(event.occurredAt)}</time><Link href={`/ordens-de-servico/${event.serviceOrder.id}` as Route} className="mt-1 block text-sm font-medium hover:text-primary">{formatServiceOrderNumber(event.serviceOrder.number)}</Link></div>
            </li>)}</ol>
          )}
          {result.totalPages > 1 ? <div className="flex items-center justify-between border-t p-4 text-sm"><span>Página {result.page} de {result.totalPages}</span><div className="flex gap-2"><Link aria-disabled={result.page === 1} className={cn(buttonVariants({ variant: "outline", size: "sm" }), result.page === 1 && "pointer-events-none opacity-50")} href={pageHref(Math.max(1, result.page - 1), queryValues)}>Anterior</Link><Link aria-disabled={result.page === result.totalPages} className={cn(buttonVariants({ variant: "outline", size: "sm" }), result.page === result.totalPages && "pointer-events-none opacity-50")} href={pageHref(Math.min(result.totalPages, result.page + 1), queryValues)}>Próxima</Link></div></div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
