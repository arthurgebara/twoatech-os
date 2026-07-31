import PDFDocument from "pdfkit";

import type { ChecklistPdfDto, QuotePdfDto, ServiceOrderPdfDto } from "@/dtos/pdf-document.dto";
import { formatBrazilianCurrency } from "@/lib/currency";
import { formatBrazilianDateTime } from "@/lib/dates";
import { quoteItemTypeLabels, quoteStatusLabels } from "@/schemas/quote.schema";
import { serviceOrderStatusLabels } from "@/schemas/service-order.schema";

const BLUE = "#164e63";
const TEXT = "#172033";
const MUTED = "#667085";
const LINE = "#d7dee8";

function dateOnly(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(value) : "Não informado";
}

function documentBuffer(
  title: string,
  subject: string,
  render: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 82, right: 48, bottom: 64, left: 48 },
      bufferPages: true,
      info: { Title: title, Author: "TwoATech OS", Subject: subject, Creator: "TwoATech OS" },
    });
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    render(doc);
    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(index);
      doc.save();
      doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(16).text("TwoATech OS", 48, 30, { lineBreak: false });
      doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(title, 48, 51, { lineBreak: false });
      doc.moveTo(48, 66).lineTo(547, 66).strokeColor(LINE).lineWidth(0.6).stroke();
      doc.moveTo(48, 789).lineTo(547, 789).strokeColor(LINE).lineWidth(0.6).stroke();
      doc.fillColor(MUTED).fontSize(8).text("Documento gerado pelo TwoATech OS", 48, 799, { lineBreak: false });
      doc.text(`Página ${index + 1} de ${range.count}`, 470, 799, { lineBreak: false });
      doc.restore();
    }
    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > 720) doc.addPage();
  doc.moveDown(0.7).fillColor(BLUE).font("Helvetica-Bold").fontSize(11).text(title.toUpperCase());
  doc.moveDown(0.25).moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(LINE).lineWidth(0.5).stroke();
  doc.moveDown(0.55);
}

function line(doc: PDFKit.PDFDocument, label: string, value: string | null | undefined) {
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(label, { continued: true });
  doc.fillColor(TEXT).font("Helvetica").text(`  ${value || "Não informado"}`);
}

function paragraph(doc: PDFKit.PDFDocument, label: string, value: string | null | undefined) {
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(label);
  doc.fillColor(TEXT).font("Helvetica").fontSize(9).text(value || "Não informado", { lineGap: 2 });
  doc.moveDown(0.45);
}

function customerEquipment(doc: PDFKit.PDFDocument, customer: ChecklistPdfDto["customer"], equipment: ChecklistPdfDto["equipment"]) {
  section(doc, "Cliente");
  line(doc, "Nome", customer.name);
  line(doc, "CPF/CNPJ", customer.document);
  line(doc, "Telefone", customer.phone);
  line(doc, "E-mail", customer.email);
  section(doc, "Equipamento");
  line(doc, "Equipamento", equipment.name);
  line(doc, "Número de série", equipment.serialNumber);
}

export function generateServiceOrderPdf(dto: ServiceOrderPdfDto) {
  const title = `Ordem de Serviço #${String(dto.number).padStart(6, "0")}`;
  return documentBuffer(title, "Ordem de serviço completa", (doc) => {
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown(0.25).fillColor(MUTED).font("Helvetica").fontSize(9).text(`Status: ${serviceOrderStatusLabels[dto.status]}  |  Abertura: ${formatBrazilianDateTime(dto.createdAt)}`);
    customerEquipment(doc, dto.customer, dto.equipment);
    section(doc, "Atendimento");
    paragraph(doc, "Problema relatado", dto.reportedProblem);
    paragraph(doc, "Acessórios recebidos", dto.receivedAccessories);
    paragraph(doc, "Observações gerais", dto.generalNotes);
    line(doc, "Recebimento", dto.receivedAt ? formatBrazilianDateTime(dto.receivedAt) : null);
    line(doc, "Entrega", dto.deliveredAt ? formatBrazilianDateTime(dto.deliveredAt) : null);
    if (dto.diagnostic) {
      section(doc, "Diagnóstico");
      paragraph(doc, "Descrição", dto.diagnostic.description);
      paragraph(doc, "Conclusão técnica", dto.diagnostic.technicalConclusion);
      paragraph(doc, "Recomendações", dto.diagnostic.recommendations);
      line(doc, "Registrado por", `${dto.diagnostic.registeredBy} em ${formatBrazilianDateTime(dto.diagnostic.registeredAt)}`);
    }
    if (dto.quotes.length) {
      section(doc, "Orçamentos");
      for (const quote of dto.quotes) {
        line(doc, `Orçamento #${quote.number} - v${quote.version}`, `${quoteStatusLabels[quote.status]} - ${formatBrazilianCurrency(quote.total)}`);
      }
    }
    for (const checklist of dto.checklists) {
      section(doc, checklist.type === "ENTRY" ? "Checklist de entrada" : "Checklist de saída");
      for (const item of checklist.items) {
        line(doc, item.checked ? "[X]" : "[ ]", `${item.label}${item.notes ? ` - ${item.notes}` : ""}`);
      }
    }
    if (dto.timeline?.length) {
      section(doc, "Timeline");
      for (const event of dto.timeline) {
        if (doc.y > 740) doc.addPage();
        paragraph(doc, `${formatBrazilianDateTime(event.occurredAt)} - ${event.title} - ${event.responsible}`, event.description);
      }
    }
  });
}

export function generateQuotePdf(dto: QuotePdfDto) {
  const title = `Orçamento #${dto.number} - versão ${dto.version}`;
  return documentBuffer(title, "Orçamento de serviços", (doc) => {
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown(0.25).fillColor(MUTED).font("Helvetica").fontSize(9).text(`OS #${String(dto.serviceOrderNumber).padStart(6, "0")}  |  ${quoteStatusLabels[dto.status]}  |  Validade: ${dateOnly(dto.validUntil)}`);
    customerEquipment(doc, dto.customer, dto.equipment);
    section(doc, "Itens do orçamento");
    for (const item of dto.items) {
      if (doc.y > 730) doc.addPage();
      doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(9).text(item.description);
      doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(`${quoteItemTypeLabels[item.type]} | ${item.quantity} x ${formatBrazilianCurrency(item.unitPrice)} | ${formatBrazilianCurrency(item.total)}`);
      doc.moveDown(0.5);
    }
    section(doc, "Totais");
    line(doc, "Subtotal", formatBrazilianCurrency(dto.subtotal));
    line(doc, "Desconto", formatBrazilianCurrency(dto.discount));
    doc.fillColor(BLUE).font("Helvetica-Bold").fontSize(12).text(`TOTAL: ${formatBrazilianCurrency(dto.total)}`, { align: "right" });
    section(doc, "Observações");
    paragraph(doc, "Condições e observações", dto.notes);
  });
}

export function generateChecklistPdf(dto: ChecklistPdfDto) {
  const label = dto.type === "ENTRY" ? "Entrada" : "Saída";
  const title = `Checklist de ${label} - OS #${String(dto.serviceOrderNumber).padStart(6, "0")}`;
  return documentBuffer(title, `Checklist de ${label.toLowerCase()}`, (doc) => {
    doc.fillColor(TEXT).font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown(0.25).fillColor(MUTED).font("Helvetica").fontSize(9).text(`Status: ${dto.status === "COMPLETED" ? "Concluída" : "Pendente"}`);
    customerEquipment(doc, dto.customer, dto.equipment);
    section(doc, "Itens conferidos");
    for (const item of dto.items) {
      if (doc.y > 735) doc.addPage();
      line(doc, item.checked ? "[X]" : "[ ]", item.label);
      if (item.notes) paragraph(doc, "Observação", item.notes);
    }
    section(doc, "Conclusão");
    paragraph(doc, "Observações gerais", dto.notes);
    line(doc, "Responsável", dto.completedBy);
    line(doc, "Concluída em", dto.completedAt ? formatBrazilianDateTime(dto.completedAt) : null);
  });
}
