import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileUser,
  Pencil,
  SearchX,
  UserRound,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import {
  formatCpfCnpj,
  formatPhone,
} from "@/components/customers/customer-formatters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomerListItem } from "@/repositories/customer.repository";
import { cn } from "@/lib/utils";

type CustomerListProps = {
  customers: CustomerListItem[];
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
  return (suffix ? `/clientes?${suffix}` : "/clientes") as Route;
}

function CustomerStatus({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "secondary" : "outline"}>
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}

export function CustomerList({
  customers,
  search,
  page,
  total,
  totalPages,
}: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <Card className="min-h-[360px] shadow-xs">
        <CardContent className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
            {search ? (
              <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <UserRound className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <h2 className="text-sm font-medium">
            {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          </h2>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            {search
              ? "Revise o nome, telefone ou CPF/CNPJ informado e tente novamente."
              : "Cadastre o primeiro cliente para começar a organizar os atendimentos."}
          </p>
          {search ? (
            <Link
              href="/clientes"
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
        <CardTitle>Clientes cadastrados</CardTitle>
        <CardDescription>
          {total} {total === 1 ? "cliente encontrado" : "clientes encontrados"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/35 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">CPF/CNPJ</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Atendimentos</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <p className="font-medium">{customer.name}</p>
                    <p className="mt-0.5 max-w-[260px] truncate text-xs text-muted-foreground">
                      {customer.email ?? "E-mail não informado"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCpfCnpj(customer.document)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatPhone(customer.phone)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer._count.serviceOrders}
                  </td>
                  <td className="px-4 py-3">
                    <CustomerStatus isActive={customer.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/clientes/${customer.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        )}
                        aria-label={`Visualizar ${customer.name}`}
                      >
                        <Eye aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/clientes/${customer.id}/editar`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        )}
                        aria-label={`Editar ${customer.name}`}
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
          {customers.map((customer) => (
            <article key={customer.id} className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <FileUser className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{customer.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPhone(customer.phone)}
                  </p>
                </div>
                <CustomerStatus isActive={customer.isActive} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">CPF/CNPJ</p>
                  <p className="mt-1">{formatCpfCnpj(customer.document)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Atendimentos</p>
                  <p className="mt-1">{customer._count.serviceOrders}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/clientes/${customer.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "flex-1",
                  )}
                >
                  <Eye aria-hidden="true" />
                  Visualizar
                </Link>
                <Link
                  href={`/clientes/${customer.id}/editar`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
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
