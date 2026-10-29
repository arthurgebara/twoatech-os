import { randomUUID } from "node:crypto";

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteForm } from "@/components/quotes/quote-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { decimalToBrlInput } from "@/lib/currency";
import { customerService } from "@/services/customer.service";
import { equipmentService } from "@/services/equipment.service";
import { serviceCatalogRepository } from "@/repositories/service-catalog.repository";
import { serviceOrderService } from "@/services/service-order.service";
import { checklistAttachmentService } from "@/services/checklist-attachment.service";
import { quoteService } from "@/services/quote.service";

export const metadata: Metadata = { title: "Novo orçamento" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ revisao?: string; atendimento?: string }> }) {
  await requireUser();
  const { revisao, atendimento } = await searchParams;
  const sourceQuote = revisao ? await quoteService.getById(revisao) : null;
  if (revisao && (!sourceQuote || sourceQuote.status !== "REJECTED")) notFound();
  const intakeId = sourceQuote?.serviceOrder?.id ?? atendimento;
  const intake = intakeId ? await serviceOrderService.getById(intakeId) : null;
  if (intakeId && !intake) notFound();
  const photos = intake ? (await checklistAttachmentService.list(intake.id, "ENTRY")).filter((photo) => ["image/jpeg", "image/png", "image/webp"].includes(photo.mimeType)) : [];
  const [catalog, customers, equipment] = await Promise.all([
    serviceCatalogRepository.listActiveOptions(),
    customerService.listOptions(),
    equipmentService.listOptions(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/orcamentos" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar para orçamentos</Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{sourceQuote ? `Revisar orçamento #${sourceQuote.number}` : intake ? "Orçamento definitivo" : "Pré-orçamento remoto"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sourceQuote ? "A nova versão preserva o cliente, o equipamento e o histórico da proposta." : intake ? "Orçamento baseado na entrada e no diagnóstico do atendimento." : "Estimativa sujeita ao diagnóstico presencial. Para equipamento recebido, abra um atendimento."}</p>
      </header>
      <Card>
        <CardHeader className="border-b"><CardTitle>{sourceQuote ? `Nova versão · v${sourceQuote.version + 1}` : "Orçamento inicial"}</CardTitle><CardDescription>{intake ? "A aprovação converte o atendimento em OS e autoriza a execução." : sourceQuote?.kind === "LEGACY" ? "Revisão de proposta anterior, preservando as condições do fluxo original." : "O pré-orçamento não autoriza execução. O orçamento definitivo será emitido após entrada e diagnóstico."}</CardDescription></CardHeader>
        <CardContent><QuoteForm isLegacy={sourceQuote?.kind === "LEGACY"} serviceOrderId={intake?.id} photos={photos.map((photo) => ({ id: photo.id, name: photo.originalName }))} idempotencyKey={randomUUID()} catalog={catalog.map((item) => ({ ...item, defaultPrice: item.defaultPrice.toString() }))} customers={customers} equipment={equipment} initialValues={sourceQuote ? {
          revisionOfQuoteId: sourceQuote.id,
          serviceOrderId: sourceQuote.serviceOrder?.id,
          evidenceIds: sourceQuote.evidence.map((item) => item.attachmentId),
          customerId: sourceQuote.customer.id,
          equipmentId: sourceQuote.equipment.id,
          reportedProblem: sourceQuote.reportedProblem,
          receivedAccessories: sourceQuote.receivedAccessories ?? "",
          generalNotes: sourceQuote.generalNotes ?? "",
          validUntil: sourceQuote.validUntil?.toISOString().slice(0, 10) ?? "",
          notes: sourceQuote.notes ?? "",
          discount: decimalToBrlInput(sourceQuote.discount.toString()),
          items: sourceQuote.items.map((item) => ({
            type: item.type,
            serviceCatalogItemId: item.serviceCatalogItemId ?? "",
            description: item.description,
            quantity: item.quantity.toString().replace(".", ","),
            unitPrice: decimalToBrlInput(item.unitPrice.toString()),
          })),
        } : intake ? {
          customerId: intake.customer.id, equipmentId: intake.equipment.id,
          reportedProblem: intake.reportedProblem, receivedAccessories: intake.receivedAccessories ?? "", generalNotes: intake.generalNotes ?? "",
          validUntil: "", notes: "", discount: "R$ 0,00",
          items: [{ type: "SERVICE", serviceCatalogItemId: "", description: "", quantity: "1", unitPrice: "R$ 0,00" }],
        } : undefined} /></CardContent>
      </Card>
    </div>
  );
}
