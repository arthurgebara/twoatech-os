import { ArrowLeft, Clock3, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceCatalogStatusButton } from "@/components/service-catalog/service-catalog-status-button";
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
import { formatBrazilianCurrency } from "@/lib/currency";
import { formatBrazilianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { serviceCatalogService } from "@/services/service-catalog.service";

export const metadata: Metadata = { title: "Detalhes do serviço" };

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const service = await serviceCatalogService.getById(id);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          <Link
            href="/servicos"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            <ArrowLeft className="size-3" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">{service.name}</h1>
            <Badge variant={service.isActive ? "secondary" : "outline"}>
              {service.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
        <Link
          href={`/servicos/${service.id}/editar`}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <Pencil /> Editar
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Informações comerciais</CardTitle>
            <CardDescription>Valores padrão do catálogo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground">Preço padrão</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatBrazilianCurrency(service.defaultPrice.toString())}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Descrição</p>
              <p className="mt-1 whitespace-pre-wrap">
                {service.description ?? "Não informada"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Controle</CardTitle>
            <CardDescription>Disponibilidade no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" />
              {service.estimatedMinutes
                ? `${service.estimatedMinutes} minutos`
                : "Duração não informada"}
            </p>
            <p className="text-xs text-muted-foreground">
              Atualizado em {formatBrazilianDateTime(service.updatedAt)}
            </p>
            <ServiceCatalogStatusButton
              serviceId={service.id}
              isActive={service.isActive}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
