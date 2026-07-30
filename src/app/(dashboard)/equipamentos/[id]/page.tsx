import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarClock,
  Cpu,
  Hash,
  Laptop,
  Palette,
  Pencil,
  StickyNote,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatCpfCnpj } from "@/components/customers/customer-formatters";
import {
  formatEquipmentName,
  formatOptionalValue,
} from "@/components/equipment/equipment-formatters";
import { EquipmentStatusButton } from "@/components/equipment/equipment-status-button";
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
import { equipmentTypeLabels } from "@/schemas/equipment.schema";
import { equipmentService } from "@/services/equipment.service";

export const metadata: Metadata = {
  title: "Detalhes do equipamento",
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

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const equipment = await equipmentService.getById(id);

  if (!equipment) {
    notFound();
  }

  const equipmentName = formatEquipmentName(equipment);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/equipamentos"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Voltar para equipamentos
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {equipmentName}
            </h1>
            <Badge variant={equipment.isActive ? "secondary" : "outline"}>
              {equipment.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {equipmentTypeLabels[equipment.type]}
          </p>
        </div>
        <Link
          href={`/equipamentos/${equipment.id}/editar`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Pencil aria-hidden="true" />
          Editar dados
        </Link>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Dados do equipamento</CardTitle>
            <CardDescription>
              Identificação e características cadastradas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <DetailItem icon={Laptop} label="Tipo">
              {equipmentTypeLabels[equipment.type]}
            </DetailItem>
            <DetailItem icon={Laptop} label="Marca e modelo">
              {equipmentName}
            </DetailItem>
            <DetailItem icon={Hash} label="Número de série">
              {formatOptionalValue(equipment.serialNumber)}
            </DetailItem>
            <DetailItem icon={Palette} label="Cor">
              {formatOptionalValue(equipment.color)}
            </DetailItem>
            <div className="sm:col-span-2">
              <DetailItem icon={Cpu} label="Especificações">
                {formatOptionalValue(equipment.specifications)}
              </DetailItem>
            </div>
            <div className="sm:col-span-2">
              <DetailItem icon={StickyNote} label="Observações">
                {formatOptionalValue(equipment.notes)}
              </DetailItem>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/20 shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Proprietário</CardTitle>
              <CardDescription>
                Cliente responsável por este equipamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/clientes/${equipment.customer.id}`}
                    className="font-medium transition-colors hover:text-primary"
                  >
                    {equipment.customer.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCpfCnpj(equipment.customer.document)}
                  </p>
                  <Badge
                    className="mt-3"
                    variant={
                      equipment.customer.isActive ? "secondary" : "outline"
                    }
                  >
                    Cliente{" "}
                    {equipment.customer.isActive ? "ativo" : "inativo"}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/clientes/${equipment.customer.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-5 w-full",
                )}
              >
                Ver dados do proprietário
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="border-b">
              <CardTitle>Controle</CardTitle>
              <CardDescription>
                A inativação preserva os dados do equipamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <DetailItem icon={CalendarClock} label="Cadastrado em">
                {formatBrazilianDateTime(equipment.createdAt)}
              </DetailItem>
              <DetailItem icon={CalendarClock} label="Última atualização">
                {formatBrazilianDateTime(equipment.updatedAt)}
              </DetailItem>
              <EquipmentStatusButton
                equipmentId={equipment.id}
                isActive={equipment.isActive}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
