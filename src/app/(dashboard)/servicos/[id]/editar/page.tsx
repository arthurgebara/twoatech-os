import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceCatalogForm } from "@/components/service-catalog/service-catalog-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { decimalToBrlInput } from "@/lib/currency";
import { serviceCatalogService } from "@/services/service-catalog.service";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const service = await serviceCatalogService.getById(id);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Editar serviço</h1>
        <p className="mt-1 text-sm text-muted-foreground">{service.name}</p>
      </header>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dados do serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceCatalogForm
            mode="edit"
            serviceId={service.id}
            defaultValues={{
              name: service.name,
              description: service.description ?? "",
              defaultPrice: decimalToBrlInput(
                service.defaultPrice.toString(),
              ),
              estimatedMinutes: service.estimatedMinutes
                ? String(service.estimatedMinutes)
                : "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
