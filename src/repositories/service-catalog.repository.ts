import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const serviceCatalogSelect = {
  id: true,
  name: true,
  description: true,
  defaultPrice: true,
  estimatedMinutes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceCatalogItemSelect;

export type ServiceCatalogItemDetail =
  Prisma.ServiceCatalogItemGetPayload<{
    select: typeof serviceCatalogSelect;
  }>;

export type ServiceCatalogPersistenceInput = {
  name: string;
  description: string | null;
  defaultPrice: string;
  estimatedMinutes: number | null;
};

function createWhere(search: string): Prisma.ServiceCatalogItemWhereInput {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ],
  };
}

export const serviceCatalogRepository = {
  count(search: string) {
    return prisma.serviceCatalogItem.count({
      where: createWhere(search),
    });
  },

  list(search: string, skip: number, take: number) {
    return prisma.serviceCatalogItem.findMany({
      where: createWhere(search),
      select: serviceCatalogSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip,
      take,
    });
  },

  listActiveOptions() {
    return prisma.serviceCatalogItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        defaultPrice: true,
      },
      orderBy: { name: "asc" },
    });
  },

  findById(id: string) {
    return prisma.serviceCatalogItem.findUnique({
      where: { id },
      select: serviceCatalogSelect,
    });
  },

  create(data: ServiceCatalogPersistenceInput) {
    return prisma.serviceCatalogItem.create({
      data,
      select: serviceCatalogSelect,
    });
  },

  update(id: string, data: ServiceCatalogPersistenceInput) {
    return prisma.serviceCatalogItem.update({
      where: { id },
      data,
      select: serviceCatalogSelect,
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.serviceCatalogItem.update({
      where: { id },
      data: { isActive },
      select: serviceCatalogSelect,
    });
  },
};
