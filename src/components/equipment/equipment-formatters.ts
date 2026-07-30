import type { EquipmentType } from "@/generated/prisma/client";
import { equipmentTypeLabels } from "@/schemas/equipment.schema";

type EquipmentIdentification = {
  type: EquipmentType;
  brand: string | null;
  model: string | null;
};

export function formatEquipmentName(equipment: EquipmentIdentification) {
  const identification = [equipment.brand, equipment.model]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return identification || equipmentTypeLabels[equipment.type];
}

export function formatOptionalValue(value: string | null) {
  return value || "Não informado";
}
