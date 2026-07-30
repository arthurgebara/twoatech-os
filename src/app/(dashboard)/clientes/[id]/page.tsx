import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarClock,
  Laptop,
  Mail,
  MapPin,
  Pencil,
  Phone,
  StickyNote,
  UserRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatCpfCnpj,
  formatPhone,
} from "@/components/customers/customer-formatters";
import { CustomerStatusButton } from "@/components/customers/customer-status-button";
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
import { cn } from "@/lib/utils";
import { customerService } from "@/services/customer.service";

export const metadata: Metadata = {
  title: "Detalhes do cliente",
};

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const customer = await customerService.getById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/clientes"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Voltar para clientes
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {customer.name}
            </h1>
            <Badge variant={customer.isActive ? "secondary" : "outline"}>
              {customer.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCpfCnpj(customer.document)}
          </p>
        </div>
        <Link
          href={`/clientes/${customer.id}/editar`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Pencil aria-hidden="true" />
          Editar dados
        </Link>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Dados cadastrais</CardTitle>
            <CardDescription>
              Informações de contato e identificação do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <DetailItem icon={UserRound} label="CPF/CNPJ">
              {formatCpfCnpj(customer.document)}
            </DetailItem>
            <DetailItem icon={Mail} label="E-mail">
              {customer.email ?? "Não informado"}
            </DetailItem>
            <DetailItem icon={Phone} label="Telefone principal">
              {formatPhone(customer.phone)}
            </DetailItem>
            <DetailItem icon={Phone} label="Telefone secundário">
              {formatPhone(customer.secondaryPhone)}
            </DetailItem>
            <div className="sm:col-span-2">
              <DetailItem icon={MapPin} label="Endereço">
                {customer.address ?? "Não informado"}
              </DetailItem>
            </div>
            <div className="sm:col-span-2">
              <DetailItem icon={StickyNote} label="Observações">
                {customer.notes ?? "Nenhuma observação registrada."}
              </DetailItem>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Resumo</CardTitle>
              <CardDescription>Vínculos existentes no sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/25 p-4">
                <Laptop className="size-4 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-2xl font-semibold">
                  {customer._count.equipment}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Equipamentos</p>
              </div>
              <div className="rounded-xl border bg-muted/25 p-4">
                <Wrench className="size-4 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-2xl font-semibold">
                  {customer._count.serviceOrders}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Ordens</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Controle</CardTitle>
              <CardDescription>
                A inativação preserva dados e histórico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <DetailItem icon={CalendarClock} label="Cadastrado em">
                {formatBrazilianDateTime(customer.createdAt)}
              </DetailItem>
              <DetailItem icon={CalendarClock} label="Última atualização">
                {formatBrazilianDateTime(customer.updatedAt)}
              </DetailItem>
              <CustomerStatusButton
                customerId={customer.id}
                isActive={customer.isActive}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
