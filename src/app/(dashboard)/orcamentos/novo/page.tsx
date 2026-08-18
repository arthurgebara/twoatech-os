import { randomUUID } from "node:crypto";

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { QuoteForm } from "@/components/quotes/quote-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { customerService } from "@/services/customer.service";
import { equipmentService } from "@/services/equipment.service";
import { serviceCatalogRepository } from "@/repositories/service-catalog.repository";

export const metadata: Metadata = { title: "Novo atendimento" };

export default async function NewQuotePage() {
  await requireUser();
  const [catalog, customers, equipment] = await Promise.all([
    serviceCatalogRepository.listActiveOptions(),
    customerService.listOptions(),
    equipmentService.listOptions(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/orcamentos" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar para orçamentos</Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Novo atendimento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Identifique o cliente e o equipamento, monte o orçamento e envie para aprovação.</p>
      </header>
      <Card>
        <CardHeader className="border-b"><CardTitle>Orçamento inicial</CardTitle><CardDescription>A ordem de serviço será aberta automaticamente após a aprovação.</CardDescription></CardHeader>
        <CardContent><QuoteForm idempotencyKey={randomUUID()} catalog={catalog.map((item) => ({ ...item, defaultPrice: item.defaultPrice.toString() }))} customers={customers} equipment={equipment} /></CardContent>
      </Card>
    </div>
  );
}
