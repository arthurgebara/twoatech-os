import {
  CircleDashed,
  Clock3,
  FileCheck2,
  PackageCheck,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBrazilianDateTime, formatLongBrazilianDate } from "@/lib/dates";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { serviceOrderStatusLabels } from "@/schemas/service-order.schema";
import { dashboardService } from "@/services/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireUser();
  const data = await dashboardService.getOperationalData();
  const metrics = [
    { label: "Ordens abertas", value: data.metrics.open, icon: Wrench, helper: "Em alguma etapa operacional" },
    { label: "Aguardando aprovação", value: data.metrics.awaitingApproval, icon: Clock3, helper: "Orçamentos enviados" },
    { label: "Em execução", value: data.metrics.inProgress, icon: CircleDashed, helper: "Serviços em andamento" },
    { label: "Aguardando peça", value: data.metrics.waitingPart, icon: PackageCheck, helper: "Execução temporariamente pausada" },
    { label: "Prontas para entrega", value: data.metrics.readyForPickup, icon: FileCheck2, helper: "Equipamentos liberados" },
  ];
  const maxStatusCount = Math.max(1, ...data.distribution.map((item) => item.count));
  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-2 font-normal">{formatLongBrazilianDate(new Date())}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Visão geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe a operação da assistência técnica em um só lugar.</p>
        </div>
        <Link href="/ordens-de-servico/nova" className={cn(buttonVariants({ size: "lg" }))}><Plus aria-hidden="true" />Nova ordem de serviço</Link>
      </header>
      <section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon, helper }) => (
          <Card key={label} className="shadow-xs">
            <CardHeader className="flex-row items-start justify-between">
              <div><CardDescription>{label}</CardDescription><CardTitle className="mt-2 text-3xl">{value}</CardTitle></div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span>
            </CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{helper}</p></CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="shadow-xs">
          <CardHeader className="border-b"><CardTitle>Ordens recentes</CardTitle><CardDescription>Últimos atendimentos cadastrados.</CardDescription></CardHeader>
          <CardContent className="px-0">
            {data.recentOrders.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center"><FileCheck2 className="mb-3 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">Nenhuma ordem cadastrada</p><p className="text-sm text-muted-foreground">Crie a primeira ordem para iniciar a operação.</p></div>
            ) : (
              <div className="divide-y">{data.recentOrders.map((order) => (
                <Link key={order.id} href={`/ordens-de-servico/${order.id}` as Route} className="grid gap-2 px-4 py-4 hover:bg-muted/30 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <div><p className="font-medium">{formatServiceOrderNumber(order.number)}</p><p className="text-xs text-muted-foreground">{formatBrazilianDateTime(order.createdAt)}</p></div>
                  <div><p className="text-sm">{order.customer.name}</p><p className="text-xs text-muted-foreground">{formatEquipmentName(order.equipment)}</p></div>
                  <Badge variant="secondary">{serviceOrderStatusLabels[order.status]}</Badge>
                </Link>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="border-b"><CardTitle>Distribuição por status</CardTitle><CardDescription>{data.totalOrders} ordem(ns) no total.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {data.distribution.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Sem dados para exibir.</p> : data.distribution.map((item) => (
                <div key={item.status}>
                  <div className="mb-1.5 flex justify-between gap-3 text-xs"><span>{serviceOrderStatusLabels[item.status]}</span><span className="font-medium">{item.count}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(5, (item.count / maxStatusCount) * 100)}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="border-b"><CardTitle>Atalhos</CardTitle></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link href="/clientes/novo" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}><Users aria-hidden="true" />Novo cliente</Link>
              <Link href="/equipamentos/novo" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}><PackageCheck aria-hidden="true" />Novo equipamento</Link>
              <Link href="/historico" className={cn(buttonVariants({ variant: "outline" }), "justify-start")}><Clock3 aria-hidden="true" />Ver histórico</Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
