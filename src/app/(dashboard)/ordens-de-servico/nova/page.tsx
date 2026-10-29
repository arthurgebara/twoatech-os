import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceOrderForm } from "@/components/service-orders/service-order-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { customerService } from "@/services/customer.service";
import { equipmentService } from "@/services/equipment.service";
import { quoteService } from "@/services/quote.service";

export const metadata: Metadata = { title: "Novo atendimento" };

export default async function NewIntakePage({ searchParams }: { searchParams: Promise<{ estimativa?: string }> }) {
  await requireUser();
  const { estimativa } = await searchParams;
  const quote = estimativa ? await quoteService.getById(estimativa) : null;
  if (estimativa && (!quote || quote.kind !== "ESTIMATE")) notFound();
  const [customers, equipment] = await Promise.all([customerService.listOptions(), equipmentService.listOptions()]);
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold">Novo atendimento</h1>
      <p className="mt-1 text-sm text-muted-foreground">Registre o recebimento, confira a entrada e faça o diagnóstico antes do orçamento. A aprovação autoriza a conversão em OS.</p>
      <div className="mt-3 flex gap-4 text-sm underline"><Link href="/clientes/novo">Cadastrar cliente</Link><Link href="/equipamentos/novo">Cadastrar equipamento</Link><Link href="/orcamentos/novo">Equipamento ainda não chegou? Criar pré-orçamento</Link></div>
    </header>
    <Card><CardContent className="pt-6"><ServiceOrderForm customerOptions={customers} equipmentOptions={equipment} idempotencyKey={randomUUID()} initialValues={quote ? {
      customerId: quote.customer.id, equipmentId: quote.equipment.id, reportedProblem: quote.reportedProblem,
      receivedAccessories: quote.receivedAccessories ?? "", generalNotes: `Pré-orçamento de referência #${quote.number}.\n${quote.generalNotes ?? ""}`,
    } : undefined} /></CardContent></Card>
  </div>;
}
