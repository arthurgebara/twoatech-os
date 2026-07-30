import { Laptop, UserRoundPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EquipmentForm } from "@/components/equipment/equipment-form";
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

export const metadata: Metadata = {
  title: "Novo equipamento",
};

export default async function NewEquipmentPage() {
  await requireUser();
  const customerOptions = await customerService.listOptions();
  const activeCustomers = customerOptions.filter((customer) => customer.isActive);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Laptop className="size-4" aria-hidden="true" />
          Cadastro
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Novo equipamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identifique o equipamento e selecione seu proprietário.
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
              Um equipamento precisa estar vinculado a um cliente ativo.
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
            <CardTitle>Dados do equipamento</CardTitle>
            <CardDescription>
              O vínculo com o cliente é obrigatório. Os demais campos ajudam na
              identificação durante o atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EquipmentForm
              mode="create"
              customerOptions={activeCustomers}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
