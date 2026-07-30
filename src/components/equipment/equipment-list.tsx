import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Laptop,
  Pencil,
  SearchX,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { formatCpfCnpj } from "@/components/customers/customer-formatters";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EquipmentListItem } from "@/repositories/equipment.repository";
import { equipmentTypeLabels } from "@/schemas/equipment.schema";

type EquipmentListProps = {
  equipment: EquipmentListItem[];
  search: string;
  customerId: string;
  type: "" | EquipmentListItem["type"];
  page: number;
  total: number;
  totalPages: number;
};

function pageHref(
  page: number,
  filters: Pick<EquipmentListProps, "search" | "customerId" | "type">,
): Route {
  const query = new URLSearchParams();

  if (filters.search) {
    query.set("q", filters.search);
  }

  if (filters.customerId) {
    query.set("cliente", filters.customerId);
  }

  if (filters.type) {
    query.set("tipo", filters.type);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const suffix = query.toString();
  return (suffix ? `/equipamentos?${suffix}` : "/equipamentos") as Route;
}

function EquipmentStatus({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "secondary" : "outline"}>
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}

export function EquipmentList(props: EquipmentListProps) {
  const {
    equipment,
    search,
    customerId,
    type,
    page,
    total,
    totalPages,
  } = props;
  const hasFilters = Boolean(search || customerId || type);

  if (equipment.length === 0) {
    return (
      <Card className="min-h-[360px] shadow-xs">
        <CardContent className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
            {hasFilters ? (
              <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Laptop className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <h2 className="text-sm font-medium">
            {hasFilters
              ? "Nenhum equipamento encontrado"
              : "Nenhum equipamento cadastrado"}
          </h2>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            {hasFilters
              ? "Revise a busca e os filtros selecionados para tentar novamente."
              : "Cadastre o primeiro equipamento e vincule-o ao seu proprietário."}
          </p>
          {hasFilters ? (
            <Link
              href="/equipamentos"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4",
              )}
            >
              Limpar filtros
            </Link>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const filters = { search, customerId, type };

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b">
        <CardTitle>Equipamentos cadastrados</CardTitle>
        <CardDescription>
          {total}{" "}
          {total === 1 ? "equipamento encontrado" : "equipamentos encontrados"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/35 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Equipamento</th>
                <th className="px-4 py-3 font-medium">Proprietário</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Número de série</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {equipment.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatEquipmentName(item)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.color ?? "Cor não informada"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${item.customer.id}`}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {item.customer.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCpfCnpj(item.customer.document)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {equipmentTypeLabels[item.type]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.serialNumber ?? "Não informado"}
                  </td>
                  <td className="px-4 py-3">
                    <EquipmentStatus isActive={item.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/equipamentos/${item.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        )}
                        aria-label={`Visualizar ${formatEquipmentName(item)}`}
                      >
                        <Eye aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/equipamentos/${item.id}/editar`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        )}
                        aria-label={`Editar ${formatEquipmentName(item)}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y md:hidden">
          {equipment.map((item) => (
            <article key={item.id} className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Laptop className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {formatEquipmentName(item)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {equipmentTypeLabels[item.type]}
                  </p>
                </div>
                <EquipmentStatus isActive={item.isActive} />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  Proprietário
                </p>
                <Link
                  href={`/clientes/${item.customer.id}`}
                  className="mt-1 block text-sm font-medium"
                >
                  {item.customer.name}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Número de série</p>
                  <p className="mt-1">{item.serialNumber ?? "Não informado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cor</p>
                  <p className="mt-1">{item.color ?? "Não informada"}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/equipamentos/${item.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "flex-1",
                  )}
                >
                  <Eye aria-hidden="true" />
                  Visualizar
                </Link>
                <Link
                  href={`/equipamentos/${item.id}/editar`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <Pencil aria-hidden="true" />
                  Editar
                </Link>
              </div>
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
                href={pageHref(Math.max(1, page - 1), filters)}
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
                href={pageHref(Math.min(totalPages, page + 1), filters)}
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
