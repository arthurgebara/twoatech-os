import "server-only";

import type { EquipmentType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const equipmentListSelect = {
  id: true,
  type: true,
  brand: true,
  model: true,
  serialNumber: true,
  color: true,
  isActive: true,
  createdAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      document: true,
      isActive: true,
    },
  },
} satisfies Prisma.EquipmentSelect;

const equipmentDetailSelect = {
  id: true,
  type: true,
  brand: true,
  model: true,
  serialNumber: true,
  color: true,
  specifications: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      document: true,
      phone: true,
      isActive: true,
    },
  },
} satisfies Prisma.EquipmentSelect;

const equipmentOptionSelect = {
  id: true,
  customerId: true,
  type: true,
  brand: true,
  model: true,
  serialNumber: true,
  isActive: true,
  customer: {
    select: {
      isActive: true,
    },
  },
} satisfies Prisma.EquipmentSelect;

export type EquipmentListItem = Prisma.EquipmentGetPayload<{
  select: typeof equipmentListSelect;
}>;

export type EquipmentDetail = Prisma.EquipmentGetPayload<{
  select: typeof equipmentDetailSelect;
}>;

export type EquipmentOption = Prisma.EquipmentGetPayload<{
  select: typeof equipmentOptionSelect;
}>;

export type EquipmentPersistenceInput = {
  customerId: string;
  type: EquipmentType;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  color: string | null;
  specifications: string | null;
  notes: string | null;
};

type EquipmentWhereInput = {
  search: string;
  customerId: string;
  type: EquipmentType | "";
};

function createWhere({
  search,
  customerId,
  type,
}: EquipmentWhereInput): Prisma.EquipmentWhereInput {
  const where: Prisma.EquipmentWhereInput = {};

  if (search) {
    where.OR = [
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { color: { contains: search, mode: "insensitive" } },
      {
        customer: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (type) {
    where.type = type;
  }

  return where;
}

export const equipmentRepository = {
  listOptions() {
    return prisma.equipment.findMany({
      select: equipmentOptionSelect,
      orderBy: [
        { isActive: "desc" },
        { customer: { name: "asc" } },
        { brand: "asc" },
        { model: "asc" },
      ],
    });
  },

  count(filters: EquipmentWhereInput) {
    return prisma.equipment.count({
      where: createWhere(filters),
    });
  },

  list(filters: EquipmentWhereInput, skip: number, take: number) {
    return prisma.equipment.findMany({
      where: createWhere(filters),
      select: equipmentListSelect,
      orderBy: [
        { isActive: "desc" },
        { customer: { name: "asc" } },
        { brand: "asc" },
        { model: "asc" },
      ],
      skip,
      take,
    });
  },

  findById(id: string) {
    return prisma.equipment.findUnique({
      where: { id },
      select: equipmentDetailSelect,
    });
  },

  create(data: EquipmentPersistenceInput) {
    return prisma.equipment.create({
      data,
      select: equipmentDetailSelect,
    });
  },

  update(id: string, data: EquipmentPersistenceInput) {
    return prisma.equipment.update({
      where: { id },
      data,
      select: equipmentDetailSelect,
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.equipment.update({
      where: { id },
      data: { isActive },
      select: equipmentDetailSelect,
    });
  },
};
