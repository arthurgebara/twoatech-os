import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const customerListSelect = {
  id: true,
  name: true,
  document: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  _count: {
    select: {
      serviceOrders: true,
    },
  },
} satisfies Prisma.CustomerSelect;

const customerDetailSelect = {
  id: true,
  name: true,
  document: true,
  email: true,
  phone: true,
  secondaryPhone: true,
  address: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      equipment: true,
      serviceOrders: true,
    },
  },
} satisfies Prisma.CustomerSelect;

const customerOptionSelect = {
  id: true,
  name: true,
  document: true,
  isActive: true,
} satisfies Prisma.CustomerSelect;

export type CustomerListItem = Prisma.CustomerGetPayload<{
  select: typeof customerListSelect;
}>;

export type CustomerDetail = Prisma.CustomerGetPayload<{
  select: typeof customerDetailSelect;
}>;

export type CustomerOption = Prisma.CustomerGetPayload<{
  select: typeof customerOptionSelect;
}>;

export type CustomerPersistenceInput = {
  name: string;
  document: string | null;
  email: string | null;
  phone: string;
  secondaryPhone: string | null;
  address: string | null;
  notes: string | null;
};

function createSearchWhere(search: string): Prisma.CustomerWhereInput {
  if (!search) {
    return {};
  }

  const digits = search.replace(/\D/g, "");
  const fields: Prisma.CustomerWhereInput[] = [
    {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
  ];

  if (digits) {
    fields.push(
      { phone: { contains: digits } },
      { secondaryPhone: { contains: digits } },
      { document: { contains: digits } },
    );
  }

  return { OR: fields };
}

export const customerRepository = {
  listOptions() {
    return prisma.customer.findMany({
      select: customerOptionSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
  },

  count(search: string) {
    return prisma.customer.count({
      where: createSearchWhere(search),
    });
  },

  list(search: string, skip: number, take: number) {
    return prisma.customer.findMany({
      where: createSearchWhere(search),
      select: customerListSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip,
      take,
    });
  },

  findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      select: customerDetailSelect,
    });
  },

  findByDocument(document: string) {
    return prisma.customer.findUnique({
      where: { document },
      select: { id: true },
    });
  },

  create(data: CustomerPersistenceInput) {
    return prisma.customer.create({
      data,
      select: customerDetailSelect,
    });
  },

  update(id: string, data: CustomerPersistenceInput) {
    return prisma.customer.update({
      where: { id },
      data,
      select: customerDetailSelect,
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.customer.update({
      where: { id },
      data: { isActive },
      select: customerDetailSelect,
    });
  },
};
