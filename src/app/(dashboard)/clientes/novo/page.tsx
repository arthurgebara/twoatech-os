import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { CustomerForm } from "@/components/customers/customer-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Novo cliente",
};

export default async function NewCustomerPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <UserPlus className="size-4" aria-hidden="true" />
          Cadastro
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Novo cliente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados utilizados durante o atendimento.
        </p>
      </header>

      <Card className="shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>Dados do cliente</CardTitle>
          <CardDescription>
            Campos obrigatórios estão indicados pelas validações do formulário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
