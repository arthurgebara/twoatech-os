import { randomUUID } from "node:crypto";

import { ClipboardPlus, UserRoundPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ServiceOrderForm } from "@/components/service-orders/service-order-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { customerService } from "@/services/customer.service";
import { equipmentService } from "@/services/equipment.service";

export const metadata: Metadata = {
  title: "Nova ordem de serviço",
};

export default async function NewServiceOrderPage() {
  await requireUser();
  const [customers, equipment] = await Promise.all([
    customerService.listOptions(),
    equipmentService.listOptions(),
  ]);
  const activeCustomers = customers.filter((customer) => customer.isActive);
  const activeEquipment = equipment.filter(
    (item) => item.isActive && item.customer.isActive,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardPlus className="size-4" aria-hidden="true" />
          Abertura
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Nova ordem de serviço
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra o atendimento para um equipamento já vinculado ao cliente.
        </p>
      </header>

      {activeCustomers.length === 0 ? (
        <Card className="min-h-[300px] shadow-xs">
          <CardContent className="flex flex-1 flex-col items-center justify-center py-14 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl border bg-muted/50">
              <UserRoundPlus
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <h2 className="text-sm font-medium">
              Cadastre ou ative um cliente primeiro
            </h2>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              A ordem precisa estar vinculada a um cliente e a um equipamento
              ativos.
            </p>
            <Link
              href="/clientes/novo"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4",
              )}
            >
              <UserRoundPlus aria-hidden="true" />
              Novo cliente
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>Dados da ordem</CardTitle>
            <CardDescription>
              A abertura gera automaticamente o primeiro evento da timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceOrderForm
              customerOptions={activeCustomers}
              equipmentOptions={activeEquipment}
              idempotencyKey={randomUUID()}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
