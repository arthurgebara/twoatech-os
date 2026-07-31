import { randomUUID } from "node:crypto";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileText,
  Laptop,
  Package,
  Plus,
  Printer,
  Phone,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCpfCnpj,
  formatPhone,
} from "@/components/customers/customer-formatters";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { DiagnosticForm } from "@/components/service-orders/diagnostic-form";
import { EntryChecklistForm } from "@/components/service-orders/entry-checklist-form";
import { ExitChecklistForm } from "@/components/service-orders/exit-checklist-form";
import { DeliveryControls } from "@/components/service-orders/delivery-controls";
import { ReceiveEquipmentButton } from "@/components/service-orders/receive-equipment-button";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { ServiceOrderObservationForm } from "@/components/service-orders/service-order-observation-form";
import { ServiceExecutionControls } from "@/components/service-orders/service-execution-controls";
import { ServiceOrderTimeline } from "@/components/service-orders/service-order-timeline";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatBrazilianDateTime } from "@/lib/dates";
import { formatBrazilianCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { quoteStatusLabels } from "@/schemas/quote.schema";
import { serviceOrderStatusLabels } from "@/schemas/service-order.schema";
import { diagnosticService } from "@/services/diagnostic.service";
import { entryChecklistService } from "@/services/entry-checklist.service";
import { exitChecklistService } from "@/services/exit-checklist.service";
import { quoteService } from "@/services/quote.service";
import { serviceOrderService } from "@/services/service-order.service";

export const metadata: Metadata = {
  title: "Detalhes da ordem de serviço",
};

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

export default async function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const order = await serviceOrderService.getById(id);

  if (!order) {
    notFound();
  }

  const [entryChecklist, exitChecklist, diagnostic, quotes] = await Promise.all([
    entryChecklistService.getForServiceOrder(order.id),
    exitChecklistService.getForServiceOrder(order.id),
    diagnosticService.getForServiceOrder(order.id),
    quoteService.listForServiceOrder(order.id),
  ]);
  const diagnosticEditable =
    entryChecklist?.status === "COMPLETED" &&
    ["RECEIVED", "DIAGNOSING", "QUOTE_REJECTED"].includes(order.status);
  const quoteCreationAvailable =
    entryChecklist?.status === "COMPLETED" &&
    Boolean(diagnostic) &&
    ["DIAGNOSING", "QUOTE_REJECTED"].includes(order.status);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/ordens-de-servico"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Voltar para ordens
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatServiceOrderNumber(order.number)}
            </h1>
            <Badge variant={order.status === "OPEN" ? "outline" : "secondary"}>
              {serviceOrderStatusLabels[order.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Criada por {order.createdBy.name} em{" "}
            {formatBrazilianDateTime(order.createdAt)}
          </p>
        </div>
        {order.status === "OPEN" ? (
          <ReceiveEquipmentButton
            serviceOrderId={order.id}
            idempotencyKey={randomUUID()}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/pdfs/ordens-de-servico/${order.id}?timeline=1`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Printer aria-hidden="true" /> PDF da ordem
          </a>
          {entryChecklist ? (
            <a
              href={`/api/pdfs/checklists/${order.id}/entrada`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              PDF entrada
            </a>
          ) : null}
          {exitChecklist ? (
            <a
              href={`/api/pdfs/checklists/${order.id}/saida`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              PDF saída
            </a>
          ) : null}
        </div>
      </header>

      <ServiceExecutionControls serviceOrderId={order.id} status={order.status} />
      <DeliveryControls serviceOrderId={order.id} status={order.status} />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Atendimento</CardTitle>
              <CardDescription>
                Informações registradas durante a abertura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DetailItem icon={ClipboardList} label="Problema relatado">
                {order.reportedProblem}
              </DetailItem>
              <DetailItem icon={Package} label="Acessórios informados">
                {order.receivedAccessories ?? "Nenhum acessório informado."}
              </DetailItem>
              <DetailItem icon={StickyNote} label="Observações gerais">
                {order.generalNotes ?? "Nenhuma observação geral."}
              </DetailItem>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Cliente e equipamento</CardTitle>
              <CardDescription>
                Vínculos permanentes deste atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <DetailItem icon={UserRound} label="Cliente">
                  <Link
                    href={`/clientes/${order.customer.id}`}
                    className="font-medium transition-colors hover:text-primary"
                  >
                    {order.customer.name}
                  </Link>
                </DetailItem>
                <DetailItem icon={UserRound} label="CPF/CNPJ">
                  {formatCpfCnpj(order.customer.document)}
                </DetailItem>
                <DetailItem icon={Phone} label="Telefone">
                  {formatPhone(order.customer.phone)}
                </DetailItem>
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <DetailItem icon={Laptop} label="Equipamento">
                  <Link
                    href={`/equipamentos/${order.equipment.id}`}
                    className="font-medium transition-colors hover:text-primary"
                  >
                    {formatEquipmentName(order.equipment)}
                  </Link>
                </DetailItem>
                <DetailItem icon={Laptop} label="Número de série">
                  {order.equipment.serialNumber ?? "Não informado"}
                </DetailItem>
                <DetailItem icon={Laptop} label="Cor">
                  {order.equipment.color ?? "Não informada"}
                </DetailItem>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Controle de datas</CardTitle>
              <CardDescription>
                Horários exibidos no fuso America/Sao_Paulo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <DetailItem icon={CalendarClock} label="Ordem criada">
                {formatBrazilianDateTime(order.createdAt)}
              </DetailItem>
              <DetailItem icon={CalendarClock} label="Equipamento recebido">
                {order.receivedAt
                  ? formatBrazilianDateTime(order.receivedAt)
                  : "Aguardando recebimento"}
              </DetailItem>
            </CardContent>
          </Card>
        </div>

        <Card className="self-start shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Timeline</CardTitle>
            <CardDescription>
              Histórico imutável e auditável da ordem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ServiceOrderObservationForm
              serviceOrderId={order.id}
              idempotencyKey={randomUUID()}
            />
            <div className="border-t pt-6">
              <ServiceOrderTimeline timeline={order.timeline} />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="self-start shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Checklist de entrada</CardTitle>
            <CardDescription>
              Conferência física do equipamento e dos acessórios recebidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntryChecklistForm
              serviceOrderId={order.id}
              checklist={entryChecklist}
              idempotencyKey={randomUUID()}
              canComplete={order.status === "RECEIVED"}
            />
          </CardContent>
        </Card>

        <Card className="self-start shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Diagnóstico</CardTitle>
            <CardDescription>
              Registro técnico atual da ordem de serviço.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DiagnosticForm
              serviceOrderId={order.id}
              diagnostic={diagnostic}
              idempotencyKey={randomUUID()}
              editable={diagnosticEditable}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>Checklist de saída</CardTitle>
          <CardDescription>Testes finais, montagem, limpeza e acessórios antes da entrega.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExitChecklistForm
            serviceOrderId={order.id}
            checklist={exitChecklist}
            idempotencyKey={randomUUID()}
          />
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Orçamentos</CardTitle>
            <CardDescription>Versões e situação comercial desta ordem.</CardDescription>
          </div>
          {quoteCreationAvailable ? (
            <Link
              href={`/ordens-de-servico/${order.id}/orcamentos/novo` as Route}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Plus aria-hidden="true" /> Novo orçamento
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="px-0">
          {quotes.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center text-center">
              <FileText className="mb-2 size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Nenhum orçamento criado</p>
              <p className="text-xs text-muted-foreground">O diagnóstico pode seguir sem orçamento até esta etapa.</p>
            </div>
          ) : (
            <div className="divide-y">
              {quotes.map((quote) => (
                <Link key={quote.id} href={`/orcamentos/${quote.id}` as Route} className="grid gap-2 px-4 py-4 hover:bg-muted/30 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-medium">Orçamento #{quote.number} · versão {quote.version}</p>
                    <p className="text-xs text-muted-foreground">{formatBrazilianDateTime(quote.createdAt)}</p>
                  </div>
                  <Badge variant="secondary">{quoteStatusLabels[quote.status]}</Badge>
                  <p className="text-sm font-semibold">{formatBrazilianCurrency(quote.total.toString())}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
