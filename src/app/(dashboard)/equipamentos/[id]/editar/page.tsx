import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EquipmentForm } from "@/components/equipment/equipment-form";
import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { customerService } from "@/services/customer.service";
import { equipmentService } from "@/services/equipment.service";

export const metadata: Metadata = {
  title: "Editar equipamento",
};

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [equipment, customerOptions] = await Promise.all([
    equipmentService.getById(id),
    customerService.listOptions(),
  ]);

  if (!equipment) {
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
          Editar equipamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize os dados de {formatEquipmentName(equipment)}.
        </p>
      </header>

      <Card className="shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>Dados do equipamento</CardTitle>
          <CardDescription>
            As alterações preservam o histórico e o identificador do cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentForm
            mode="edit"
            equipmentId={equipment.id}
            currentCustomerId={equipment.customer.id}
            customerOptions={customerOptions}
            defaultValues={{
              customerId: equipment.customer.id,
              type: equipment.type,
              brand: equipment.brand ?? "",
              model: equipment.model ?? "",
              serialNumber: equipment.serialNumber ?? "",
              color: equipment.color ?? "",
              specifications: equipment.specifications ?? "",
              notes: equipment.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
