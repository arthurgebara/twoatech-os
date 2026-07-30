import {
  ChevronLeft,
  ChevronRight,
  Eye,
  SearchX,
  Wrench,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBrazilianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ServiceOrderListItem } from "@/repositories/service-order.repository";
import { serviceOrderStatusLabels } from "@/schemas/service-order.schema";

type ServiceOrderListProps = {
  orders: ServiceOrderListItem[];
  search: string;
  page: number;
  total: number;
  totalPages: number;
};

function pageHref(page: number, search: string): Route {
  const query = new URLSearchParams();

  if (search) {
    query.set("q", search);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const suffix = query.toString();
  return (
    suffix ? `/ordens-de-servico?${suffix}` : "/ordens-de-servico"
  ) as Route;
}

export function ServiceOrderList({
  orders,
  search,
  page,
  total,
  totalPages,
}: ServiceOrderListProps) {
  if (orders.length === 0) {
    return (
      <Card className="min-h-[360px] shadow-xs">
        <CardContent className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
            {search ? (
              <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Wrench className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <h2 className="text-sm font-medium">
            {search
              ? "Nenhuma ordem encontrada"
              : "Nenhuma ordem de serviço aberta"}
          </h2>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            {search
              ? "Revise o número, cliente ou equipamento informado."
              : "Crie a primeira ordem para iniciar um atendimento."}
          </p>
          {search ? (
            <Link
              href="/ordens-de-servico"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4",
              )}
            >
              Limpar busca
            </Link>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <CardTitle>Ordens cadastradas</CardTitle>
        <CardDescription>
          {total} {total === 1 ? "ordem encontrada" : "ordens encontradas"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/35 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Ordem</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Equipamento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Abertura</th>
                <th className="px-4 py-3 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {formatServiceOrderNumber(order.number)}
                    </p>
                    <p className="mt-0.5 max-w-[260px] truncate text-xs text-muted-foreground">
                      {order.reportedProblem}
                    </p>
                  </td>
                  <td className="px-4 py-3">{order.customer.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatEquipmentName(order.equipment)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={order.status === "OPEN" ? "outline" : "secondary"}
                    >
                      {serviceOrderStatusLabels[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatBrazilianDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/ordens-de-servico/${order.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      )}
                      aria-label={`Visualizar ${formatServiceOrderNumber(order.number)}`}
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
          {orders.map((order) => (
            <article key={order.id} className="space-y-3 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {formatServiceOrderNumber(order.number)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBrazilianDateTime(order.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={order.status === "OPEN" ? "outline" : "secondary"}
                >
                  {serviceOrderStatusLabels[order.status]}
                </Badge>
              </div>
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="mt-1 font-medium">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Equipamento</p>
                  <p className="mt-1">
                    {formatEquipmentName(order.equipment)}
                  </p>
                </div>
              </div>
              <Link
                href={`/ordens-de-servico/${order.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full",
                )}
              >
                <Eye aria-hidden="true" />
                Visualizar ordem
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
                aria-disabled={page === 1}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  page === 1 && "pointer-events-none opacity-50",
                )}
                aria-label="Página anterior"
              >
                <ChevronLeft aria-hidden="true" />
              </Link>
              <Link
                href={pageHref(Math.min(totalPages, page + 1), search)}
                aria-disabled={page === totalPages}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  page === totalPages && "pointer-events-none opacity-50",
                )}
                aria-label="Próxima página"
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
