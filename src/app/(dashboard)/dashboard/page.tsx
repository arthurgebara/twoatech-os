import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileCheck2,
  PackageCheck,
  Plus,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatLongBrazilianDate } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Dashboard",
};

const metrics = [
  { label: "Ordens abertas", value: "0", icon: Wrench, helper: "Em atendimento" },
  {
    label: "Aguardando aprovação",
    value: "0",
    icon: Clock3,
    helper: "Orçamentos enviados",
  },
  {
    label: "Em execução",
    value: "0",
    icon: CircleDashed,
    helper: "Serviços em andamento",
  },
  {
    label: "Prontos para entrega",
    value: "0",
    icon: PackageCheck,
    helper: "Equipamentos finalizados",
  },
];

const workflow = [
  "Recebimento",
  "Diagnóstico",
  "Orçamento",
  "Execução",
  "Entrega",
];

export default function DashboardPage() {
  const today = formatLongBrazilianDate(new Date());

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {today}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a operação da assistência técnica em um só lugar.
          </p>
        </div>
        <Button disabled className="h-9 gap-2">
          <Plus aria-hidden="true" />
          Nova ordem de serviço
        </Button>
      </header>

      <section aria-label="Indicadores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, helper }) => (
          <Card key={label} className="shadow-xs">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">
                  {value}
                </CardTitle>
              </div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="min-h-[360px] shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Ordens recentes</CardTitle>
            <CardDescription>
              Últimos atendimentos adicionados ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
              <FileCheck2 className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-medium">Nenhuma ordem cadastrada</h2>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              As ordens mais recentes aparecerão aqui quando o fluxo de atendimento começar.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Fluxo de atendimento</CardTitle>
            <CardDescription>Etapas principais da operação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {workflow.map((step, index) => (
              <div key={step} className="flex items-center gap-3 py-3">
                <span className="flex size-7 items-center justify-center rounded-full border bg-background font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm">{step}</span>
                {index < workflow.length - 1 ? (
                  <ArrowRight className="ml-auto size-3.5 text-muted-foreground/50" />
                ) : (
                  <CheckCircle2 className="ml-auto size-3.5 text-emerald-600" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
