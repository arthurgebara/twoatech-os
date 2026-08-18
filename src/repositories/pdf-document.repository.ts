import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const orderDocumentSelect = {
  id: true,
  number: true,
  status: true,
  reportedProblem: true,
  receivedAccessories: true,
  generalNotes: true,
  receivedAt: true,
  deliveredAt: true,
  createdAt: true,
  customer: {
    select: {
      name: true,
      document: true,
      email: true,
      phone: true,
      secondaryPhone: true,
      address: true,
    },
  },
  equipment: {
    select: {
      type: true,
      brand: true,
      model: true,
      serialNumber: true,
      color: true,
      specifications: true,
      notes: true,
    },
  },
  diagnostic: {
    select: {
      description: true,
      technicalConclusion: true,
      recommendations: true,
      registeredAt: true,
      registeredBy: { select: { name: true } },
    },
  },
  serviceReport: {
    select: {
      workPerformed: true,
      partsUsed: true,
      testsPerformed: true,
      notes: true,
      registeredAt: true,
      registeredBy: { select: { name: true } },
    },
  },
  checklists: {
    select: {
      id: true,
      type: true,
      status: true,
      notes: true,
      completedAt: true,
      completedBy: { select: { name: true } },
      items: {
        select: { label: true, checked: true, notes: true, position: true },
        orderBy: { position: "asc" },
      },
    },
  },
  quotes: {
    select: { id: true, number: true, version: true, status: true, total: true },
    orderBy: { version: "desc" },
  },
  timeline: {
    select: {
      title: true,
      description: true,
      occurredAt: true,
      responsibleUser: { select: { name: true } },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  },
} satisfies Prisma.ServiceOrderSelect;

const quoteDocumentSelect = {
  id: true,
  number: true,
  version: true,
  status: true,
  subtotal: true,
  discount: true,
  total: true,
  validUntil: true,
  notes: true,
  createdAt: true,
  customer: { select: { name: true, document: true, phone: true, email: true } },
  equipment: { select: { type: true, brand: true, model: true, serialNumber: true } },
  serviceOrder: {
    select: {
      id: true,
      number: true,
    },
  },
  items: {
    select: { type: true, description: true, quantity: true, unitPrice: true, total: true, position: true },
    orderBy: { position: "asc" },
  },
} satisfies Prisma.QuoteSelect;

export type OrderDocumentRecord = Prisma.ServiceOrderGetPayload<{ select: typeof orderDocumentSelect }>;
export type QuoteDocumentRecord = Prisma.QuoteGetPayload<{ select: typeof quoteDocumentSelect }>;

export const pdfDocumentRepository = {
  findOrder(id: string) {
    return prisma.serviceOrder.findUnique({ where: { id }, select: orderDocumentSelect });
  },
  findQuote(id: string) {
    return prisma.quote.findUnique({ where: { id }, select: quoteDocumentSelect });
  },
};
