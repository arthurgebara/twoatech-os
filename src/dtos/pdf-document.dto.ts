import type { ChecklistStatus, ChecklistType, QuoteItemType, QuoteStatus, ServiceOrderStatus } from "@/generated/prisma/enums";

export type CustomerPdfDto = {
  name: string;
  document: string | null;
  email: string | null;
  phone: string;
  secondaryPhone?: string | null;
  address?: string | null;
};

export type EquipmentPdfDto = {
  type: string;
  name: string;
  serialNumber: string | null;
  color?: string | null;
  specifications?: string | null;
  notes?: string | null;
};

export type ChecklistPdfDto = {
  type: ChecklistType;
  status: ChecklistStatus;
  serviceOrderNumber: number;
  isIntake: boolean;
  customer: CustomerPdfDto;
  equipment: EquipmentPdfDto;
  notes: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  items: Array<{ label: string; checked: boolean; notes: string | null }>;
};

export type QuotePdfDto = {
  kind: "LEGACY" | "ESTIMATE" | "DEFINITIVE";
  isIntake: boolean;
  evidence: Array<{ name: string; image: Buffer }>;
  number: number;
  version: number;
  status: QuoteStatus;
  serviceOrderNumber: number | null;
  createdAt: Date;
  validUntil: Date | null;
  customer: CustomerPdfDto;
  equipment: EquipmentPdfDto;
  items: Array<{ type: QuoteItemType; description: string; quantity: string; unitPrice: string; total: string }>;
  subtotal: string;
  discount: string;
  total: string;
  notes: string | null;
};

export type ServiceOrderPdfDto = {
  isIntake: boolean;
  number: number;
  status: ServiceOrderStatus;
  createdAt: Date;
  receivedAt: Date | null;
  deliveredAt: Date | null;
  customer: CustomerPdfDto;
  equipment: EquipmentPdfDto;
  reportedProblem: string;
  receivedAccessories: string | null;
  generalNotes: string | null;
  diagnostic: {
    description: string;
    technicalConclusion: string | null;
    recommendations: string | null;
    registeredAt: Date;
    registeredBy: string;
  } | null;
  serviceReport: {
    workPerformed: string;
    partsUsed: string | null;
    testsPerformed: string | null;
    notes: string | null;
    registeredAt: Date;
    registeredBy: string;
  } | null;
  checklists: ChecklistPdfDto[];
  quotes: Array<{ number: number; version: number; status: QuoteStatus; total: string }>;
  timeline?: Array<{ title: string; description: string | null; occurredAt: Date; responsible: string }>;
};
