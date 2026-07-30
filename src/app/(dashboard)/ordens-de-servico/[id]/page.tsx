import { randomUUID } from "node:crypto";

import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Laptop,
  Package,
  Phone,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCpfCnpj,
  formatPhone,
} from "@/components/customers/customer-formatters";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { ReceiveEquipmentButton } from "@/components/service-orders/receive-equipment-button";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { ServiceOrderObservationForm } from "@/components/service-orders/service-order-observation-form";
import { ServiceOrderTimeline } from "@/components/service-orders/service-order-timeline";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatBrazilianDateTime } from "@/lib/dates";
import { serviceOrderStatusLabels } from "@/schemas/service-order.schema";
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
      </header>

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
    </div>
  );
}
