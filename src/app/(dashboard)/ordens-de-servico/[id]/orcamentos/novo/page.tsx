import { randomUUID } from "node:crypto";

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteForm } from "@/components/quotes/quote-form";
import { formatServiceOrderNumber } from "@/components/service-orders/service-order-formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { serviceCatalogRepository } from "@/repositories/service-catalog.repository";
import { serviceOrderService } from "@/services/service-order.service";

export const metadata: Metadata = { title: "Novo orçamento" };

export default async function NewQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [order, catalog] = await Promise.all([
    serviceOrderService.getById(id),
    serviceCatalogRepository.listActiveOptions(),
  ]);
  if (!order) notFound();
  return (
    <div className="space-y-6">
      <header>
        <Link href={`/ordens-de-servico/${order.id}`} className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Voltar para {formatServiceOrderNumber(order.number)}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Novo orçamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">{order.customer.name} · {formatServiceOrderNumber(order.number)}</p>
      </header>
      <Card>
        <CardHeader className="border-b"><CardTitle>Dados do orçamento</CardTitle><CardDescription>O número e a versão serão gerados automaticamente.</CardDescription></CardHeader>
        <CardContent><QuoteForm serviceOrderId={order.id} idempotencyKey={randomUUID()} catalog={catalog} /></CardContent>
      </Card>
    </div>
  );
}
