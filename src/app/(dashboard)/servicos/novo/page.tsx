import type { Metadata } from "next";

import { ServiceCatalogForm } from "@/components/service-catalog/service-catalog-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NewServicePage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Novo serviço
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre um serviço para reutilizá-lo nos orçamentos.
        </p>
      </header>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dados do serviço</CardTitle>
          <CardDescription>Preço padrão em reais.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceCatalogForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
