import { ChevronLeft, ChevronRight, Eye, SearchX, Wrench } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBrazilianCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { ServiceCatalogItemDetail } from "@/repositories/service-catalog.repository";

type Props = {
  services: ServiceCatalogItemDetail[];
  search: string;
  page: number;
  total: number;
  totalPages: number;
};

function pageHref(page: number, search: string): Route {
  const query = new URLSearchParams();
  if (search) query.set("q", search);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return (suffix ? `/servicos?${suffix}` : "/servicos") as Route;
}

export function ServiceCatalogList({
  services,
  search,
  page,
  total,
  totalPages,
}: Props) {
  if (services.length === 0) {
    return (
      <Card className="min-h-[340px] shadow-xs">
        <CardContent className="flex flex-1 flex-col items-center justify-center text-center">
          {search ? (
            <SearchX className="mb-4 size-8 text-muted-foreground" />
          ) : (
            <Wrench className="mb-4 size-8 text-muted-foreground" />
          )}
          <h2 className="font-medium">
            {search ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? "Revise a busca e tente novamente."
              : "Cadastre os serviços oferecidos pela assistência."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <CardTitle>Serviços cadastrados</CardTitle>
        <CardDescription>
          {total} {total === 1 ? "serviço encontrado" : "serviços encontrados"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/35 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Preço padrão</th>
                <th className="px-4 py-3 font-medium">Duração</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <p className="font-medium">{service.name}</p>
                    <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                      {service.description ?? "Sem descrição"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {formatBrazilianCurrency(service.defaultPrice.toString())}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {service.estimatedMinutes
                      ? `${service.estimatedMinutes} min`
                      : "Não informada"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={service.isActive ? "secondary" : "outline"}>
                      {service.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/servicos/${service.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      )}
                      aria-label={`Visualizar ${service.name}`}
                    >
                      <Eye aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y md:hidden">
          {services.map((service) => (
            <article key={service.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="mt-1 text-sm">
                    {formatBrazilianCurrency(service.defaultPrice.toString())}
                  </p>
                </div>
                <Badge variant={service.isActive ? "secondary" : "outline"}>
                  {service.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <Link
                href={`/servicos/${service.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full",
                )}
              >
                <Eye aria-hidden="true" />
                Visualizar
              </Link>
            </article>
          ))}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-1">
              <Link
                href={pageHref(Math.max(1, page - 1), search)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  page === 1 && "pointer-events-none opacity-50",
                )}
              >
                <ChevronLeft aria-hidden="true" />
              </Link>
              <Link
                href={pageHref(Math.min(totalPages, page + 1), search)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  page === totalPages && "pointer-events-none opacity-50",
                )}
              >
                <ChevronRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
