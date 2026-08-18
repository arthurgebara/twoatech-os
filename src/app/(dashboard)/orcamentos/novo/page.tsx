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
import { quoteService } from "@/services/quote.service";

export const metadata: Metadata = { title: "Novo atendimento" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ revisao?: string }> }) {
  await requireUser();
  const { revisao } = await searchParams;
  const sourceQuote = revisao ? await quoteService.getById(revisao) : null;
  if (revisao && (!sourceQuote || sourceQuote.status !== "REJECTED")) notFound();
  const [catalog, customers, equipment] = await Promise.all([
    serviceCatalogRepository.listActiveOptions(),
    customerService.listOptions(),
    equipmentService.listOptions(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/orcamentos" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar para orçamentos</Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{sourceQuote ? `Revisar orçamento #${sourceQuote.number}` : "Novo atendimento"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sourceQuote ? "A nova versão preserva o cliente, o equipamento e o histórico da proposta." : "Identifique o cliente e o equipamento, monte o orçamento e envie para aprovação."}</p>
      </header>
      <Card>
        <CardHeader className="border-b"><CardTitle>{sourceQuote ? `Nova versão · v${sourceQuote.version + 1}` : "Orçamento inicial"}</CardTitle><CardDescription>A ordem de serviço será aberta automaticamente após a aprovação.</CardDescription></CardHeader>
        <CardContent><QuoteForm idempotencyKey={randomUUID()} catalog={catalog.map((item) => ({ ...item, defaultPrice: item.defaultPrice.toString() }))} customers={customers} equipment={equipment} initialValues={sourceQuote ? {
          revisionOfQuoteId: sourceQuote.id,
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
        } : undefined} /></CardContent>
      </Card>
    </div>
  );
}
