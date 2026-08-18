import "server-only";

import { formatEquipmentName } from "@/components/equipment/equipment-formatters";
import type {
  ChecklistPdfDto,
  CustomerPdfDto,
  EquipmentPdfDto,
  QuotePdfDto,
  ServiceOrderPdfDto,
} from "@/dtos/pdf-document.dto";
import type { OrderDocumentRecord } from "@/repositories/pdf-document.repository";
import { pdfDocumentRepository } from "@/repositories/pdf-document.repository";
import { quoteIdSchema } from "@/schemas/quote.schema";
import { serviceOrderIdSchema } from "@/schemas/service-order.schema";

function customerDto(customer: OrderDocumentRecord["customer"]): CustomerPdfDto {
  return {
    name: customer.name,
    document: customer.document,
    email: customer.email,
    phone: customer.phone,
    secondaryPhone: customer.secondaryPhone,
    address: customer.address,
  };
}

function equipmentDto(equipment: OrderDocumentRecord["equipment"]): EquipmentPdfDto {
  return {
    type: equipment.type,
    name: formatEquipmentName(equipment),
    serialNumber: equipment.serialNumber,
    color: equipment.color,
    specifications: equipment.specifications,
    notes: equipment.notes,
  };
}

function checklistDto(order: OrderDocumentRecord, type: "ENTRY" | "EXIT"): ChecklistPdfDto | null {
  const checklist = order.checklists.find((item) => item.type === type);
  if (!checklist) return null;
  return {
    type,
    status: checklist.status,
    serviceOrderNumber: order.number,
    customer: customerDto(order.customer),
    equipment: equipmentDto(order.equipment),
    notes: checklist.notes,
    completedAt: checklist.completedAt,
    completedBy: checklist.completedBy?.name ?? null,
    items: checklist.items.map((item) => ({ label: item.label, checked: item.checked, notes: item.notes })),
  };
}

export const pdfDocumentService = {
  async getServiceOrder(id: string, includeTimeline: boolean): Promise<ServiceOrderPdfDto | null> {
    const parsed = serviceOrderIdSchema.safeParse(id);
    if (!parsed.success) return null;
    const order = await pdfDocumentRepository.findOrder(parsed.data);
    if (!order) return null;
    const checklists = ["ENTRY", "EXIT"].map((type) => checklistDto(order, type as "ENTRY" | "EXIT")).filter((item): item is ChecklistPdfDto => item !== null);
    return {
      number: order.number,
      status: order.status,
      createdAt: order.createdAt,
      receivedAt: order.receivedAt,
      deliveredAt: order.deliveredAt,
      customer: customerDto(order.customer),
      equipment: equipmentDto(order.equipment),
      reportedProblem: order.reportedProblem,
      receivedAccessories: order.receivedAccessories,
      generalNotes: order.generalNotes,
      diagnostic: order.diagnostic ? {
        description: order.diagnostic.description,
        technicalConclusion: order.diagnostic.technicalConclusion,
        recommendations: order.diagnostic.recommendations,
        registeredAt: order.diagnostic.registeredAt,
        registeredBy: order.diagnostic.registeredBy.name,
      } : null,
      serviceReport: order.serviceReport ? {
        workPerformed: order.serviceReport.workPerformed,
        partsUsed: order.serviceReport.partsUsed,
        testsPerformed: order.serviceReport.testsPerformed,
        notes: order.serviceReport.notes,
        registeredAt: order.serviceReport.registeredAt,
        registeredBy: order.serviceReport.registeredBy.name,
      } : null,
      checklists,
      quotes: order.quotes.map((quote) => ({
        number: quote.number,
        version: quote.version,
        status: quote.status,
        total: quote.total.toFixed(2),
      })),
      ...(includeTimeline ? {
        timeline: order.timeline.map((event) => ({
          title: event.title,
          description: event.description,
          occurredAt: event.occurredAt,
          responsible: event.responsibleUser?.name ?? "Sistema",
        })),
      } : {}),
    };
  },
  async getQuote(id: string): Promise<QuotePdfDto | null> {
    const parsed = quoteIdSchema.safeParse(id);
    if (!parsed.success) return null;
    const quote = await pdfDocumentRepository.findQuote(parsed.data);
    if (!quote) return null;
    return {
      number: quote.number,
      version: quote.version,
      status: quote.status,
      serviceOrderNumber: quote.serviceOrder?.number ?? null,
      createdAt: quote.createdAt,
      validUntil: quote.validUntil,
      customer: {
        name: quote.customer.name,
        document: quote.customer.document,
        email: quote.customer.email,
        phone: quote.customer.phone,
      },
      equipment: {
        type: quote.equipment.type,
        name: formatEquipmentName(quote.equipment),
        serialNumber: quote.equipment.serialNumber,
      },
      items: quote.items.map((item) => ({
        type: item.type,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toFixed(2),
        total: item.total.toFixed(2),
      })),
      subtotal: quote.subtotal.toFixed(2),
      discount: quote.discount.toFixed(2),
      total: quote.total.toFixed(2),
      notes: quote.notes,
    };
  },
  async getChecklist(id: string, type: "ENTRY" | "EXIT") {
    const parsed = serviceOrderIdSchema.safeParse(id);
    if (!parsed.success) return null;
    const order = await pdfDocumentRepository.findOrder(parsed.data);
    return order ? checklistDto(order, type) : null;
  },
};
