import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { CustomerForm } from "@/components/customers/customer-form";
import {
  maskCpfCnpj,
  maskPhone,
} from "@/components/customers/customer-formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { customerService } from "@/services/customer.service";

export const metadata: Metadata = {
  title: "Editar cliente",
};

export default async function EditCustomerPage({
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
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Pencil className="size-4" aria-hidden="true" />
          Edição
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Editar cliente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize os dados de {customer.name}.
        </p>
      </header>

      <Card className="shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>Dados do cliente</CardTitle>
          <CardDescription>
            As alterações passam a valer nos próximos atendimentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm
            mode="edit"
            customerId={customer.id}
            defaultValues={{
              name: customer.name,
              document: maskCpfCnpj(customer.document ?? ""),
              email: customer.email ?? "",
              phone: maskPhone(customer.phone),
              secondaryPhone: maskPhone(customer.secondaryPhone ?? ""),
              address: customer.address ?? "",
              notes: customer.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
