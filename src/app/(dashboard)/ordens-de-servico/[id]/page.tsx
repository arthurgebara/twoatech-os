import { randomUUID } from "node:crypto";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Laptop,
  LockKeyhole,
  Package,
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
import { ChecklistAttachments } from "@/components/service-orders/checklist-attachments";
import { EntryChecklistForm } from "@/components/service-orders/entry-checklist-form";
import { ExitChecklistForm } from "@/components/service-orders/exit-checklist-form";
import { DeliveryControls } from "@/components/service-orders/delivery-controls";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { ServiceOrderObservationForm } from "@/components/service-orders/service-order-observation-form";
import { ServiceExecutionControls } from "@/components/service-orders/service-execution-controls";
import { ServiceReportForm } from "@/components/service-orders/service-report-form";
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
import { checklistAttachmentService } from "@/services/checklist-attachment.service";
import { entryChecklistService } from "@/services/entry-checklist.service";
import { exitChecklistService } from "@/services/exit-checklist.service";
import { quoteService } from "@/services/quote.service";
import { serviceOrderService } from "@/services/service-order.service";
import { serviceReportService } from "@/services/service-report.service";

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

function WorkflowStep({ number, title, description, unlocked, completed, children }: { number: number; title: string; description: string; unlocked: boolean; completed: boolean; children: React.ReactNode }) {
  return (
    <Card className={cn("shadow-xs", !unlocked && "bg-muted/20 opacity-75")}>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold", completed ? "border-primary bg-primary text-primary-foreground" : unlocked ? "border-primary text-primary" : "bg-muted text-muted-foreground")}>
            {completed ? <CheckCircle2 className="size-4" aria-hidden="true" /> : unlocked ? number : <LockKeyhole className="size-4" aria-hidden="true" />}
          </span>
          <div><CardTitle>{title}</CardTitle><CardDescription className="mt-1">{unlocked ? description : "Conclua a etapa anterior para liberar."}</CardDescription></div>
        </div>
      </CardHeader>
      {unlocked ? <CardContent>{children}</CardContent> : null}
    </Card>
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

  const [entryChecklist, exitChecklist, diagnostic, serviceReport, quotes, entryAttachments, exitAttachments] = await Promise.all([
    entryChecklistService.getForServiceOrder(order.id),
    exitChecklistService.getForServiceOrder(order.id),
    diagnosticService.getForServiceOrder(order.id),
    serviceReportService.getForServiceOrder(order.id),
    quoteService.listForServiceOrder(order.id),
    checklistAttachmentService.list(order.id, "ENTRY"),
    checklistAttachmentService.list(order.id, "EXIT"),
  ]);
  const diagnosticEditable =
    entryChecklist?.status === "COMPLETED" &&
    ["RECEIVED", "DIAGNOSING", "QUOTE_REJECTED"].includes(order.status);
  const entryCompleted = entryChecklist?.status === "COMPLETED";
  const diagnosticCompleted = Boolean(diagnostic) && !["RECEIVED", "DIAGNOSING", "QUOTE_REJECTED"].includes(order.status);
  const serviceCompleted = Boolean(serviceReport) || ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"].includes(order.status);
  const exitCompleted = exitChecklist?.status === "COMPLETED";

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

      {!exitCompleted && !["DELIVERED", "CANCELED"].includes(order.status) ? <DeliveryControls serviceOrderId={order.id} status={order.status} cancelOnly /> : null}

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

      <section className="space-y-4" aria-labelledby="workflow-title">
        <div>
          <h2 id="workflow-title" className="text-xl font-semibold">Fluxo do atendimento</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cada etapa é liberada quando a anterior é concluída.</p>
        </div>

        <WorkflowStep number={1} title="Checklist de entrada" description="Confira o estado físico e confirme o recebimento do equipamento." unlocked completed={entryCompleted}>
          <div className="space-y-5">
            <EntryChecklistForm serviceOrderId={order.id} checklist={entryChecklist} idempotencyKey={randomUUID()} canComplete={["OPEN", "RECEIVED"].includes(order.status)} />
            <ChecklistAttachments serviceOrderId={order.id} checklistType="ENTRY" attachments={entryAttachments} editable={!entryCompleted && ["OPEN", "RECEIVED"].includes(order.status)} />
          </div>
        </WorkflowStep>

        <WorkflowStep number={2} title="Diagnóstico" description="Documente o problema encontrado e a conclusão técnica." unlocked={entryCompleted} completed={diagnosticCompleted}>
          <DiagnosticForm serviceOrderId={order.id} diagnostic={diagnostic} idempotencyKey={randomUUID()} editable={diagnosticEditable} />
        </WorkflowStep>

        <WorkflowStep number={3} title="Execução e relatório do serviço" description="Inicie a execução, registre o trabalho realizado e conclua a etapa técnica." unlocked={Boolean(diagnostic)} completed={serviceCompleted}>
          <div className="space-y-4">
            <ServiceExecutionControls serviceOrderId={order.id} status={order.status} />
            <ServiceReportForm serviceOrderId={order.id} report={serviceReport} idempotencyKey={randomUUID()} editable={order.status === "IN_PROGRESS" && !serviceReport} />
          </div>
        </WorkflowStep>

        <WorkflowStep number={4} title="Checklist de saída" description="Faça os testes finais, limpeza, montagem e conferência de acessórios." unlocked={serviceCompleted} completed={exitCompleted}>
          <div className="space-y-5">
            <ExitChecklistForm serviceOrderId={order.id} checklist={exitChecklist} idempotencyKey={randomUUID()} />
            <ChecklistAttachments serviceOrderId={order.id} checklistType="EXIT" attachments={exitAttachments} editable={!exitCompleted && order.status === "COMPLETED"} />
          </div>
        </WorkflowStep>

        <WorkflowStep number={5} title="Pronto e entrega" description="Libere o equipamento e registre a retirada pelo cliente." unlocked={exitCompleted} completed={order.status === "DELIVERED"}>
          {order.status === "DELIVERED" ? <p className="rounded-lg border bg-muted/20 p-3 text-sm">Equipamento entregue em {order.deliveredAt ? formatBrazilianDateTime(order.deliveredAt) : "data não informada"}.</p> : <DeliveryControls serviceOrderId={order.id} status={order.status} />}
        </WorkflowStep>
      </section>

      {quotes.length > 0 ? <Card className="shadow-xs"><CardHeader className="border-b"><CardTitle>Orçamento de origem</CardTitle><CardDescription>Proposta comercial que deu origem a esta ordem.</CardDescription></CardHeader><CardContent className="px-0"><div className="divide-y">{quotes.map((quote) => <Link key={quote.id} href={`/orcamentos/${quote.id}` as Route} className="grid gap-2 px-4 py-4 hover:bg-muted/30 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="text-sm font-medium">Orçamento #{quote.number} · versão {quote.version}</p><p className="text-xs text-muted-foreground">{formatBrazilianDateTime(quote.createdAt)}</p></div><Badge variant="secondary">{quoteStatusLabels[quote.status]}</Badge><p className="text-sm font-semibold">{formatBrazilianCurrency(quote.total.toString())}</p></Link>)}</div></CardContent></Card> : null}
    </div>
  );
}
